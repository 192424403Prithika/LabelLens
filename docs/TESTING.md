# LabelLens — Testing & Quality Assurance Guide

**Test Suite Status:** 100% Passing  
**Test Harness:** `pytest>=8.1.0`, `httpx`, `vitest` / TypeScript Compiler, `urllib` Verification Suite.

---

## 1. Automated Backend Test Suite (`pytest`)

Located at `backend/tests/test_labellens_api.py`.

### Execution Command:
```bash
python -m pytest backend/tests/test_labellens_api.py -v
```

### Verified Test Cases:
1. **`test_health_and_database_status`**:
   - Asserts backend health endpoint `/health` returns status `healthy`.
   - Confirms database connection adapter is initialized and collections are queryable.
2. **`test_user_jwt_token_generation_and_decode`**:
   - Asserts bcrypt password hashing and token generation.
   - Validates claims decode correctly with subject ID and expiration window.
3. **`test_nlp_ingredient_parsing_and_categorization`**:
   - Ingests raw multi-ingredient strings with additive codes (e.g. `Soy Lecithin`, `Sodium Benzoate`).
   - Asserts correct classification into `Emulsifier`, `Preservative`, etc. and verifies regulatory FDA citations.
4. **`test_rapid_ocr_inference_on_real_image`**:
   - Generates a synthetic packaging image with nutrition tables and ingredient lists.
   - Executes real ONNX Runtime RapidOCR text detection and recognition.
   - Asserts confidence scores are $> 0.85$ and extracted nutrients match rendered values.
5. **`test_ocr_evaluation_metrics_cer_wer`**:
   - Verifies Levenshtein distance calculations for Character Error Rate (CER) and Word Error Rate (WER).
6. **`test_serving_calculation`**:
   - Tests proportional nutrient recalculation (e.g., scaling 100g basis to 45g serving).
7. **`test_product_comparison_engine`**:
   - Ingests multiple product records and evaluates winner selection for `"Lower Sugar"` and `"Higher Protein"`.
8. **`test_pdf_report_generation`**:
   - Asserts ReportLab generates valid `%PDF-1.4` binary stream containing tables and branding.

---

## 2. Frontend Production Build Verification

Located at `frontend/`.

### Execution Command:
```bash
cd frontend
npm run build
```
- **Type Checking**: Runs `tsc -b` with strict TypeScript checks.
- **Bundler**: Bundles modular assets via Vite and minifies client chunks into `dist/`.
- **Status**: Builds in ~2.5s with **0 errors**.

---

## 3. Mobile TypeScript Verification

Located at `mobile/`.

### Execution Command:
```bash
cd mobile
npx tsc --noEmit
```
- **Coverage**: All 10 native screens (`HomeScreen`, `ScanScreen`, `ReviewCorrectionScreen`, `ProductDetailScreen`, `CompareScreen`, `SavedScreen`, `PreferencesScreen`, `ProfileScreen`, `AnalyticsScreen`, `HistoryScreen`).
- **Status**: **0 errors**.

---

## 4. End-to-End System Verification (`run_verification.py`)

A comprehensive verification script testing live HTTP endpoints, authentication, Open Food Facts API, real OCR inference, comparison algorithms, and personal analytics:

```bash
python backend/run_verification.py
```

### Verification Pipeline:
- **[1/8] FastAPI Backend Health**: Verified status `healthy`.
- **[2/8] Vite React Web Server**: Verified HTTP 200 response on port `5173`.
- **[3/8] Authentication & JWT Session**: Verified login and active preferences.
- **[4/8] Open Food Facts Live Lookup**: Tested live barcode query for Nutella (`3017620422003`).
- **[5/8] Deep Learning RapidOCR Inference**: Real OCR extraction on test image pixels.
- **[6/8] Product Comparison Engine**: Ranked lower sugar winner with transparent rationale.
- **[7/8] Branded PDF Report**: Verified `%PDF-1.4` stream generation.
- **[8/8] Personal User Analytics**: Real user metrics aggregated dynamically.
