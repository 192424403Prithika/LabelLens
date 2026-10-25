# LabelLens — RESTful API Specification

**Base URL:** `/api` (or `https://<your-render-url>.onrender.com/api`)  
**Specification Version:** OpenAPI 3.1.0 (Interactive Swagger UI active at `/docs`)

---

## 1. Authentication & User Profile (`/api/auth`)

### `POST /api/auth/register`
Creates a new user profile with secure bcrypt password hashing and returns an initial JWT bearer token.
- **Request Body:**
  ```json
  {
    "username": "alex_health",
    "email": "alex@example.com",
    "password": "StrongPassword123!",
    "full_name": "Alex Smith"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "Bearer",
    "user": {
      "id": "user-8f92b1",
      "username": "alex_health",
      "email": "alex@example.com",
      "full_name": "Alex Smith",
      "preferences": {
        "diet": [],
        "allergens_to_avoid": [],
        "avoid_ingredients": [],
        "monitor_ingredients": [],
        "find_ingredients": []
      }
    }
  }
  ```

### `POST /api/auth/login`
Authenticates user credentials and issues a signed JWT session token.
- **Request Body:**
  ```json
  {
    "username_or_email": "alex@example.com",
    "password": "StrongPassword123!"
  }
  ```

### `GET /api/auth/me`
Retrieves authenticated user profile and dietary constraints.
- **Headers:** `Authorization: Bearer <token>`

### `PUT /api/auth/preferences`
Updates user dietary constraints, maximum sugar/sodium limits, and ingredient watchlists.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "diet": ["Vegetarian", "Gluten-Free"],
    "allergens_to_avoid": ["Peanuts", "Soy"],
    "avoid_ingredients": ["High Fructose Corn Syrup", "Palm Oil"],
    "max_sugar_g": 10.0,
    "max_sodium_mg": 300.0
  }
  ```

### `DELETE /api/auth/delete-account`
GDPR-compliant permanent deletion of user profile, scan history, and bookmarks.
- **Headers:** `Authorization: Bearer <token>`

### `GET /api/auth/export-data`
Exports all personal account records in JSON format.
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Food Label Scanning & OCR (`/api/scans`)

### `POST /api/scans/upload`
Uploads a food label packaging image (`.jpg`, `.png`, `.webp`) and initiates the deep learning text extraction pipeline.
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `file`: `Binary Image Stream`
  - `product_name_hint` *(Optional)*: `string` (e.g., "Oats Box")
- **Response `200 OK`:**
  ```json
  {
    "status": "success",
    "scan": {
      "id": "scan-545adeeac2",
      "ocr_confidence": 0.92,
      "ocr_word_count": 48,
      "extracted_product_name": "Rolled Whole Grain Oats",
      "nutrition_per_serving": {
        "calories": 160.0,
        "protein_g": 6.0,
        "fat_total_g": 3.0,
        "carbohydrates_g": 28.0,
        "sugars_g": 1.0,
        "sodium_mg": 0.0
      },
      "ingredients_list": [
        {
          "name": "Whole Grain Oats",
          "category": "Whole Food",
          "evidence_source": "FDA 21 CFR 101.4",
          "confidence": 0.98
        }
      ]
    },
    "product": { ... }
  }
  ```

### `POST /api/scans/correct`
Allows users to review, edit, and correct OCR extractions. Logs corrections to evaluation logs.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "scan_id": "scan-545adeeac2",
    "corrected_product_name": "Rolled Oats",
    "corrected_nutrition": {
      "calories": 150.0,
      "protein_g": 5.0,
      "sugars_g": 1.0,
      "sodium_mg": 0.0
    },
    "feedback_notes": "Corrected calorie count from 160 to 150 based on serving"
  }
  ```

### `GET /api/scans/history`
Returns chronological list of scans performed by the authenticated user.
- **Headers:** `Authorization: Bearer <token>`

---

## 3. Product Catalog & Live Lookups (`/api/products`)

### `GET /api/products`
Lists products with optional category and search filters. If local catalog has insufficient results, queries Open Food Facts API live.
- **Query Params:** `category`, `search`, `limit`

### `GET /api/products/barcode/{barcode}`
Looks up barcode locally or queries Open Food Facts API in real time.
- **Response `200 OK`:**
  ```json
  {
    "source": "Open Food Facts API",
    "product": {
      "id": "prod-3017620422003",
      "barcode": "3017620422003",
      "name": "Nutella",
      "brand": "Ferrero",
      "category": "Breakfasts",
      "nutrition_per_100g": { "calories": 539.0, "sugars_g": 56.3 }
    }
  }
  ```

### `POST /api/products/{product_id}/calculate-serving`
Scales nutrients based on a verified custom portion size.
- **Request Body:** `{"target_serving_size": 45.0, "target_serving_unit": "g"}`

---

## 4. Multi-Product Comparison (`/api/comparisons`)

### `POST /api/comparisons/evaluate`
Executes side-by-side comparison matrix for 2 to 3 products based on a transparent goal (`Lower Sugar`, `Higher Protein`, `Lower Sodium`, `Clean Label`).
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "product_ids": ["prod-3017620422003", "prod-scan-545adeeac2"],
    "user_goal": "Lower Sugar"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "winner_id": "prod-scan-545adeeac2",
    "winner_name": "Rolled Whole Grain Oats",
    "recommendation_rationale": "Selected as top match for 'Lower Sugar'. Key factors: 55.3g less sugar per serving",
    "comparison_table": [ ... ]
  }
  ```

---

## 5. Reports & PDF Export (`/api/reports`)

### `GET /api/reports/pdf/{product_id}`
Generates a downloadable, branded PDF report containing nutrient breakdowns, ingredient classifications, FDA evidence, and data provenance.
- **Returns:** `application/pdf` binary stream.
