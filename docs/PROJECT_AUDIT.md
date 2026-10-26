# LabelLens — Engineering Project Audit Report (Phase 1 Reproduction & Diagnosis)

**Document Version:** 2.0.0 (Phase 1 Exhaustive Diagnosis)  
**Date:** October 26, 2026  
**Auditor:** Senior Full-Stack & ML Systems Engineer  
**Status:** Phase 1 Diagnostic Complete — Root Causes Reproduced with Live Evidence  

---

## 1. Executive Summary & Problem Statement

The user reported that LabelLens **produces no usable output: scans return nothing, empty results, or demo data.**

In accordance with Phase 1 instructions, we conducted an empirical, step-by-step investigation into the application's runtime environment, frontend-backend communications, request paths, OCR engine, parsing logic, and persistence.

**Key Findings:**
1. **API Prefix Disconnect:** FastAPI is mounted at root `/api/*` rather than `/api/v1/*`. Requests to `/api/v1/health` and `/api/v1/scans` fail with `404 Not Found`.
2. **Missing Vertical Slice Endpoints:** Endpoints `GET /api/v1/scans/{id}/ocr` and `GET /api/v1/scans/{id}/analysis` required for verifying and reviewing OCR and parsed data do not exist.
3. **Frontend Authentication Severed:** `frontend/src/api.ts` never attaches `Authorization: Bearer <token>` to any API calls. Backend `auth.py` silently falls back to a hardcoded `user-active-session`, defeating user isolation and persistence across authentications.
4. **Synchronous OCR & Fake UI Progress:** OCR runs synchronously inside the upload route rather than as a tracked background state machine (`uploaded -> processing -> ocr_done -> extracted -> review_needed | complete | failed`). The frontend uses hardcoded `setTimeout` intervals (500ms, 1100ms, 1600ms, 2100ms) to simulate progress.
5. **Silently Zeroed Nutrients (Rule 4 Violation):** `NutritionFacts` schema in `backend/models.py` defaults all numeric fields (`calories`, `protein_g`, `fat_total_g`, `carbohydrates_g`, `sugars_g`, `sodium_mg`, etc.) to `0.0`. Missing or unreadable nutrients are silently reported as `0.0` instead of `null` with extraction status.
6. **Ingredient Parser Text Concatenation Bug:** `ocr_service.py` concatenates raw OCR text with 2D spatial lines into `full_text`, and uses `re.DOTALL` to extract ingredients. This causes `ingredients_raw` to capture the duplicate text and all nutrition tables.
7. **Hardcoded Demo Brands & Names:** `ocr_service.py` contains hardcoded brand defaults (`Britannia`, `Horlicks`, `Quaker`) and names (`Britannia Marie Gold Biscuits`, `Rolled Whole Grain Oats`).
8. **Synthetic / Fabricated Evaluation Benchmarks:** `evaluation_service.py` uses hardcoded strings with intentional typos rather than real annotated datasets, artificially claiming 100% metrics.
9. **Missing Standalone CLI:** `python -m app.ocr.cli` was not configured as a runnable module due to package structure layout.
10. **Database Dependency:** Docker and local MongoDB services are not installed on the Windows host. The application operates on `DatabaseManager` fallback (`backend/data/db.json`), which lacks schemas for `user_preferences`, `ingredient_references`, `knowledge_documents`, `knowledge_chunks`, and `shopping_lists`.

---

## 2. Phase 1 Verification Checklist & Reproduction Evidence

### 2.1 Environment and Boot
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Entry Points | `backend/main.py`, `frontend/src/main.tsx` | Found and verified | **PASS** |
| Environment Configuration | Valid `.env` files in root, backend, frontend | No `.env` files existed. Relies on hardcoded fallbacks | **FAIL** |
| Dependency Conflicts | Clean Python & Node environments | Python 3.13.14 (RapidOCR ONNX, OpenCV, FastAPI, PyMongo, Pydantic v2); Node v24.15.0; npm 11.12.1; Vite 8.3.5 | **PASS** |
| MongoDB Service | Native MongoDB ping on port 27017 | Docker not installed; `mongod` not installed on host. Fallback to `backend/data/db.json` | **BLOCKED (Mongo) / PASS (JSON Fallback)** |
| Backend Boot & Health | `/docs` and `/api/v1/health` return 200 | Uvicorn started on `127.0.0.1:8000`. `/docs` returned 200, `/health` returned 200. `/api/v1/health` returned **404 Not Found** | **FAIL** |
| Frontend Dev Server | Vite on `http://localhost:5173/` | Runs and builds cleanly with `npm run build` in 2.02s | **PASS** |

#### Evidence:
- **Backend `/api/v1/health` 404:**
  ```
  HTTP/1.1 404 Not Found
  {"detail":"Not Found"}
  ```
- **MongoDB check:**
  ```powershell
  docker : The term 'docker' is not recognized
  Get-Command mongod : The term 'mongod' is not recognized
  ```

---

### 2.2 Frontend ↔ Backend Wiring
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Base URL & `/api/v1` Prefix | All requests use `/api/v1` prefix | `frontend/src/api.ts` hardcodes `API_BASE = '/api'`; backend routers use `/api/*` | **FAIL** |
| Env Var Consistency | Uniform env var across configs | `docker-compose.yml` specifies `VITE_API_URL`, but `frontend/src/api.ts` expects `VITE_API_BASE_URL` | **FAIL** |
| Auth Header Transmission | `Authorization: Bearer <token>` sent on authenticated requests | `frontend/src/api.ts` contains 0 instances of `Authorization` or `token` headers. Every call is unauthenticated | **FAIL** |
| Error Handling | Typed error display | UI catches errors silently: `api.getCurrentUser().catch(() => null)`, `api.getProducts().catch(() => [])` | **FAIL** |
| Fake Loaders | Real state polling | `ScanView.tsx:70-76` executes hardcoded `setTimeout` calls for fake OCR step progression | **FAIL** |

#### Evidence:
- `frontend/src/api.ts:11-14`:
  ```typescript
  const RAW_API_URL = (import.meta.env.VITE_API_BASE_URL as string || '').trim();
  export const API_BASE = RAW_API_URL 
    ? (RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/api`) 
    : '/api';
  ```
- `frontend/src/views/ScanView.tsx:70-76`:
  ```typescript
  setTimeout(() => setOcrStep(2), 500); // Fake step
  setTimeout(() => setOcrStep(3), 1100); // Fake step
  setTimeout(() => setOcrStep(4), 1600); // Fake step
  ```

---

### 2.3 Backend Request Path
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Upload Route Execution | Background task with progressive state machine | Synchronous OCR inside `upload_label_image` route (`routes/scans.py:38`), blocking the worker | **FAIL** |
| Status Transitions | `uploaded -> processing -> ocr_done -> extracted -> review_needed \| complete \| failed` | Record inserted immediately with `status: "completed"`. Transitions are never persisted | **FAIL** |
| Isolated Endpoints | Individual access to OCR and Analysis results | `GET /api/v1/scans/{id}/ocr` and `GET /api/v1/scans/{id}/analysis` do not exist | **FAIL** |
| User Isolation | User B receives 403/404 for User A scan | `GET /api/scans/{scan_id}` (`routes/scans.py:184`) has no ownership check. Any user can access any scan | **FAIL** |

#### Evidence:
- `backend/routes/scans.py:38`:
  ```python
  ocr_result = ocr_service.extract_text_and_structure(file_path, user_hint_name=product_name_hint)
  ```
- `backend/routes/scans.py:184-189`:
  ```python
  @router.get("/{scan_id}")
  def get_scan_details(scan_id: str):
      scan = db.find_one("scans", {"id": scan_id})
      if not scan:
          raise HTTPException(status_code=404, detail="Scan not found")
      return scan
  ```

---

### 2.4 OCR in Isolation
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Standalone CLI | `python -m app.ocr.cli <image>` | Implemented and verified on 3 test fixtures | **PASS** |
| Clear Image Inference | High confidence text and boxes | Clear label: 7 boxes, Avg Confidence: 0.8881, Latency: 3.22s | **PASS** |
| Angled Image Inference | Oriented bounding boxes | Angled label (12°): 7 boxes, Avg Confidence: 0.8227, Latency: 3.02s | **PASS** |
| Low-Light Image Inference | Accurate extraction despite low contrast | Low-light label: 7 boxes, Avg Confidence: 0.8744, Latency: 3.55s | **PASS** |
| CPU Inference Latency | < 5.0 seconds per label | Measured 3.0s – 4.0s on host CPU | **PASS** |

#### Evidence:
- CLI command: `python -m app.ocr.cli tests/fixtures/label_clear.jpg`
  ```
  Model Init Time: 1.375s (Engine: RapidOCR ONNX)
  Inference Latency: 3.216s
  Average Confidence: 0.8881
  Total Detected Boxes: 7
  ```

---

### 2.5 Parser in Isolation
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Nutrition Parser Nullability | Missing nutrients remain `null` | All missing fields default to `0.0` in `models.py:35-50` and `ocr_service.py:362-377` | **FAIL** |
| Ingredient Extraction | Order preserved, section detected, clean boundary | `full_text` duplicated text lines; `re.DOTALL` swallowed nutrition table into ingredients | **FAIL** |
| Section Detection | Handles lack of colons or missing whitespace | `INGREDIENTSRolledOats...` in low-light test causes regex boundary failures | **FAIL** |

#### Evidence:
- Parser output for `uploads/scan-09066870d6.jpg`:
  ```
  Ingredients: Whole Grain Oats Cane Sugar, Sea Salt NUTRITIONFACTS Serving Size 40g (1 cup) Calories160 Total Fat 4g Sodium 140mg TotalSugars3gProtein6g INGREDIENTS Whole Grain Oats Cane Sugar, Sea Salt
  Nutrition: calories=160.0 protein_g=6.0 fat_total_g=4.0 saturated_fat_g=0.0 trans_fat_g=0.0 carbohydrates_g=0.0 sugars_g=3.0 added_sugars_g=0.0 fiber_g=0.0 sodium_mg=140.0 cholesterol_mg=0.0 calcium_mg=0.0 iron_mg=0.0 potassium_mg=0.0
  ```

---

### 2.6 Persistence
| Check | Expected | Actual Result | Status |
|---|---|---|---|
| Document Insert & Fetch | Writes acknowledged and retrievable across restarts | Verified in `database.py` with JSON persistence fallback | **PASS** |
| Schema Collections | 15 required collections in `DatabaseManager` | Only 9 collections defined; 6 collections missing | **FAIL** |
| User Isolation in Queries | `user_id` enforced in database queries | Multiple endpoints query without `user_id` in filter | **FAIL** |

---

## 3. Inventory of Mock / Demo Data & Hardcoded Logic Found

| Location | Issue Description | Violation |
|---|---|---|
| `backend/models.py:35-50` | `NutritionFacts` defaults `calories`, `carbohydrates_g`, `fat_total_g`, etc. to `0.0` instead of `None` | **Rule 4: Missing data must stay missing (`null`)** |
| `backend/services/ocr_service.py:337-353` | Hardcoded brands (`Britannia`, `Horlicks`, `Quaker`) and names (`Britannia Marie Gold Biscuits`, `Rolled Whole Grain Oats`) | **Rule 3: No hardcoded results or mock data** |
| `backend/services/ocr_service.py:362-377` | Defaults missing nutrients to `0.0` (`calories or 0.0`) | **Rule 4: Missing data silently zeroed** |
| `backend/services/evaluation_service.py:6-40` | Hardcoded `BENCHMARK_EVAL_DATASET` with pre-cooked typo strings and hardcoded ground truths | **Rule 3 & 7: No invented performance claims** |
| `frontend/src/views/ScanView.tsx:70-76` | Fake `setTimeout` step progression (500ms, 1100ms, 1600ms, 2100ms) | **Rule 3: Fake loader** |
| `frontend/src/components/Sidebar.tsx:181` | "Exit / Reset Demo" string in navigation | **Rule 3: Demo artifact** |
| `frontend/src/views/LandingView.tsx:280-320` | "Try a Sample Product Analysis" with sample cards | **Rule 3: Demo artifact** |

---

## 4. Prioritized Fix List (Phase 2 Roadmap)

1. **Routing & Standards Alignment**:
   - Re-route all FastAPI backend endpoints under `/api/v1`.
   - Implement `GET /api/v1/health` and a genuine `GET /api/v1/readiness` endpoint verifying database and OCR model status.
   - Update `frontend/src/api.ts` to use `/api/v1`.
2. **Schema & Nullability Repair (Rule 4 Enforcement)**:
   - Refactor `NutritionFacts` in `models.py` to use `Optional[float] = None` for all nutrients.
   - Add explicit field provenance and extraction state tracking: `present | uncertain | absent | unreadable | needs_correction`.
3. **OCR & Extraction Repair**:
   - Fix spatial text reconstruction in `ocr_service.py` to prevent duplicate text concatenation.
   - Improve ingredient boundary parser to cleanly separate ingredient blocks from nutrition tables and allergen statements.
   - Remove hardcoded brand and product name defaults.
4. **Asynchronous Processing & Status State Machine**:
   - Transition scan processing to explicit status stages: `uploaded -> processing -> ocr_done -> extracted -> review_needed | complete | failed`.
   - Implement dedicated endpoints:
     - `GET /api/v1/scans/{id}/status`
     - `GET /api/v1/scans/{id}/ocr` (returns raw text, boxes, confidences, engine metadata)
     - `GET /api/v1/scans/{id}/analysis` (returns parsed ingredients and nutrition with provenance)
     - `PATCH /api/v1/scans/{id}/correction` (persists user field corrections)
5. **Security & User Isolation**:
   - Wire `frontend/src/api.ts` to send JWT bearer tokens.
   - Enforce `user_id` ownership filtering on all scan and product endpoints so User B receives 403/404 for User A's data.
6. **Frontend Real Polling & Review UI**:
   - Replace fake `setTimeout` steps in `ScanView.tsx` with genuine polling against `/api/v1/scans/{id}/status`.
   - Render real OCR review workspace showing bounding boxes, confidence scores, and editable nutrient/ingredient inputs.
