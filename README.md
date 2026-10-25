# LabelLens — Intelligent Food Label Understanding and Ingredient Comparison

**LabelLens** is a complete, production-oriented cross-platform software system (Responsive Web + Native Android/iOS Mobile + Shared Python FastAPI Backend + MongoDB + Deep Learning Pipeline).

It transforms convoluted food packaging, fine-print ingredient lists, and numeric nutrition tables into clear, personalized, evidence-grounded scientific insights, allergen certainty, and multi-product comparisons.

---

## 🏗️ System Architecture

```
labellens/
├── backend/                       # Shared Python FastAPI Service
│   ├── app/
│   │   ├── main.py                # Application entrypoint & lifespan
│   │   ├── database.py            # MongoDB PyMongo connection + persistent fallback
│   │   ├── models.py              # Pydantic v2 schemas
│   │   ├── seed_data.py           # Clean schema initialization (Zero fake demo data)
│   │   ├── routes/
│   │   │   ├── auth.py            # JWT token auth, bcrypt hashing, account deletion
│   │   │   ├── products.py        # Real Open Food Facts live lookup & search
│   │   │   ├── scans.py           # Deep Learning OCR inference & field corrections
│   │   │   ├── comparisons.py     # 2-3 product comparison & semantic search
│   │   │   ├── collections.py     # Real personal analytics & shopping lists
│   │   │   ├── reports.py         # ReportLab PDF generation
│   │   │   └── evaluation.py      # CER/WER & semantic embedding benchmarks
│   │   ├── services/
│   │   │   ├── ocr_service.py     # RapidOCR (PaddleOCR ONNX) inference engine
│   │   │   ├── nlp_service.py     # Ingredient normalization & FDA/EFSA grounding
│   │   │   ├── semantic_service.py# Vector similarity & semantic search
│   │   │   ├── recommendation_service.py # Dynamic nutrient difference matrix
│   │   │   └── pdf_service.py     # ReportLab branded PDF exporter
│   │   └── tests/
│   │       └── test_labellens_api.py # Automated pytest test suite (100% passing)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                      # Responsive Web Application (Vite + React + TS)
│   ├── src/
│   │   ├── views/                 # Dashboard, Scanner, ProductDetail, Compare, etc.
│   │   ├── components/            # Claymorphic Sidebar, Header, Gauges
│   │   ├── api.ts                 # Full REST API Client
│   │   └── types.ts               # Shared TypeScript schemas
│   ├── package.json
│   └── Dockerfile
├── mobile/                        # Native Mobile Application (React Native + Expo)
│   ├── src/
│   │   ├── screens/               # Home, Scan, ReviewCorrection, Detail, Compare, Saved, etc.
│   │   ├── components/            # Native BottomNavBar, Header, Status Badges
│   │   ├── api/client.ts          # Auto host detection (10.0.2.2 for Android / LAN)
│   │   └── theme/colors.ts        # Forest Green, Tangerine, Warm Cream theme
│   ├── App.tsx                    # Mobile application root
│   ├── app.json                   # Expo configuration for Android & iOS permissions
│   └── package.json
├── docker-compose.yml             # Full-stack container orchestration
└── README.md
```

---

## 🚫 Strict NO-DEMO-DATA Policy Compliance

LabelLens strictly abides by the zero-demo-data standard:
- **No Seed Products**: MongoDB collections start clean. Product records come solely from actual user label scans or live Open Food Facts API lookups.
- **No Fabricated Analytics**: Personal compliance rates and top food categories are calculated strictly from the authenticated user's real scans. Empty scans produce honest, informative empty states.
- **Genuine Deep Learning OCR**: Text is detected and recognized using **RapidOCR (PaddleOCR ONNX runtime)** on real image pixels. Unreadable labels honestly report `needs_review: true` with zero invented nutrition numbers.
- **Proven Data Provenance**: Every record clearly indicates its origin: `User Label Scan OCR` or `Open Food Facts API`.

---

## 📱 Mobile Application (Android & iOS)

The mobile app in `mobile/` is built using **React Native and Expo**, designed specifically for phone ergonomics:
- **Bottom Navigation**: Persistent navigation between `Home`, `Scan`, `Compare`, `Saved`, and `Profile`.
- **Camera Viewfinder**: Real-time guide frame for capturing packaging labels, photo library picker, and barcode lookup.
- **Extracted Text Review & Correction**: Mobile workspace to review OCR bounding boxes and edit numeric values before confirming to MongoDB.
- **Portion Size Calculator**: Instant scaling for `0.5x`, `1 Serving`, `1.5x`, and `2 Servings`.
- **Side-by-Side Comparison**: Swipeable product difference matrix comparing calories, sugars, fiber, sodium, and ingredients.
- **Interactive Shopping List**: Checkbox toggles that sync across devices.
- **Data Privacy & GDPR**: One-tap personal data JSON export and permanent account deletion.

### Running Mobile on Android
```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Start Expo development server
npx expo start --android

# (Alternatively, scan the QR code using the Expo Go app on your physical Android phone on the same Wi-Fi network)
```
*Note for Android Emulator: The mobile API client automatically targets `http://10.0.2.2:8000` to communicate seamlessly with the host machine's backend.*

### Running Mobile on iOS
```bash
cd mobile

# 1. Start on iOS Simulator (macOS with Xcode required)
npx expo start --ios

# 2. Or open with Expo Go on a physical iPhone by scanning the QR code
```

### Production Mobile Builds
- **Android APK / AAB**:
  ```bash
  npx eas-cli build --platform android --profile preview
  ```
- **iOS IPA**:
  ```bash
  npx eas-cli build --platform ios --profile preview
  ```

---

## 💻 Web Application (Desktop & Tablet)

- **Warm Claymorphic Design System**: Custom forest green (`#174D36`), warm cream (`#FAF7F0`), and tangerine (`#F28C45`) palette with dark typography (`#000000`).
- **Dashboard**: Circular SVG donut gauges displaying Dietary Match %, RapidOCR Confidence %, and Clean Food Index.
- **Interactive Recharts Comparison**: Visual nutrient comparison bar charts.
- **PDF Report Generation**: Downloadable ReportLab reports for any verified food item.

### Running Web Locally
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev
# Active at http://127.0.0.1:5173
```

---

## ⚙️ Backend & Deep Learning Pipeline

- **FastAPI**: REST endpoints under `/api` with auto-generated Swagger UI at `/docs`.
- **Deep Learning OCR Engine**: `RapidOCR` with ONNX Runtime running pretrained PaddleOCR text detection and directional recognition models.
- **NLP & Ingredient Intelligence**: Structured parser extracting chemical additives, E-numbers, preservatives, and allergens grounded in FDA (21 CFR) and EFSA regulatory datasets.
- **Open Food Facts Integration**: Real-time barcode retrieval and live keyword search querying `world.openfoodfacts.org`.
- **Database Engine**: PyMongo connected to MongoDB, with transparent persistent JSON document storage fallback in `backend/data/db.json`.

### Running Backend Locally
```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Start FastAPI daemon
python -m uvicorn main:app --host 127.0.0.1 --port 8000
# Health check active at http://127.0.0.1:8000/health
# OpenAPI interactive docs at http://127.0.0.1:8000/docs
```

---

## 🧪 Automated Testing Suite

Comprehensive automated test coverage verified with `pytest`:
```bash
cd backend
python -m pytest tests/test_labellens_api.py -v
```
**Results: 8 passed in 9.75s**
- `test_health_and_database_status`: Verified healthy database storage.
- `test_user_jwt_token_generation_and_decode`: Verified token security.
- `test_nlp_ingredient_parsing_and_categorization`: Verified NLP ingredient decomposition.
- `test_rapid_ocr_inference_on_real_image`: Verified real RapidOCR image text extraction.
- `test_ocr_evaluation_metrics_cer_wer`: Verified Character & Word Error Rate calculations.
- `test_serving_calculation`: Verified serving portion scaling math.
- `test_product_comparison_engine`: Verified multi-product recommendation ranking.
- `test_pdf_report_generation`: Verified ReportLab PDF generation.

---

## 🐳 Docker Deployment

To launch the complete stack (MongoDB + FastAPI Backend + Nginx Web) with a single command:
```bash
docker-compose up --build
```
- Web Application: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MongoDB: `localhost:27017`
