# LabelLens — MongoDB Database Architecture & Schema Specification

**Engine:** MongoDB 6.0+ / MongoDB Atlas & Resilient JSON Storage Engine  
**ORM/Driver:** `pymongo>=4.6.0` with Pydantic v2 Schema Enforcement

---

## 1. Collections & Data Schemas

### 1.1 `users`
Stores user authentication credentials, profiles, and dietary constraints.
- **Fields:**
  - `id`: `string` (UUID PK)
  - `username`: `string` (Indexed, Unique)
  - `email`: `string` (Indexed, Unique)
  - `password_hash`: `string` (Bcrypt hash)
  - `full_name`: `string`
  - `preferences`: `Object` (`diet`, `allergens_to_avoid`, `avoid_ingredients`, `max_sugar_g`, `max_sodium_mg`)
  - `created_at`: `string` (ISO-8601 UTC)

### 1.2 `products`
Catalog of real food items ingested from OCR scans or Open Food Facts.
- **Fields:**
  - `id`: `string` (e.g., `prod-3017620422003` or `prod-scan-xyz`)
  - `barcode`: `string` (Indexed)
  - `name`: `string`
  - `brand`: `string`
  - `category`: `string` (Indexed)
  - `image_url`: `string`
  - `serving_size`: `float`
  - `serving_unit`: `string`
  - `nutrition_per_100g`: `Object` (`calories`, `fat_total_g`, `sugars_g`, `protein_g`, `sodium_mg`)
  - `nutrition_per_serving`: `Object`
  - `ingredients_raw`: `string`
  - `ingredients_list`: `Array<IngredientDetail>`
  - `declared_allergens`: `Array<string>`
  - `provenance`: `string` (`"User Label Scan OCR"` or `"Open Food Facts API"`)
  - `data_quality_score`: `float` (0.0 to 100.0)

### 1.3 `scans`
Raw OCR extractions and user review records.
- **Fields:**
  - `id`: `string` (UUID PK)
  - `user_id`: `string` (Indexed FK)
  - `image_url`: `string`
  - `preprocessed_image_url`: `string`
  - `raw_ocr_text`: `string`
  - `ocr_confidence`: `float`
  - `ocr_word_count`: `int`
  - `data_quality_index`: `float`
  - `uncertain_fields`: `Array<string>`
  - `corrections_made`: `boolean`
  - `original_extracted_data`: `Object`
  - `status`: `string` (`"completed"`, `"needs_review"`, `"failed"`)

### 1.4 `saved_products` (Bookmarks & Shopping Lists)
- **Fields:**
  - `id`: `string`
  - `user_id`: `string` (Indexed FK)
  - `product_id`: `string` (Indexed FK)
  - `collection_name`: `string` (`"Favorites"`, `"Shopping List"`, etc.)
  - `notes`: `string`
  - `completed`: `boolean` (For shopping list checkbox toggles)

### 1.5 `feedback`
Logs user corrections and ratings for continuous deep learning evaluation.
- **Fields:**
  - `id`: `string`
  - `user_id`: `string`
  - `scan_id`: `string`
  - `item_type`: `string` (`"ocr_correction"`, `"recommendation_rating"`)
  - `original_data`: `Object`
  - `corrected_data`: `Object`

---

## 2. Indexes

The database initialization ensures high-performance lookups across all queries:
```javascript
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.products.createIndex({ "barcode": 1 });
db.products.createIndex({ "name": "text", "brand": "text" });
db.scans.createIndex({ "user_id": 1, "created_at": -1 });
db.saved_products.createIndex({ "user_id": 1, "collection_name": 1 });
```

---

## 3. Resilient Multi-Storage Architecture (`DatabaseManager`)

In `backend/database.py`, LabelLens implements a dual-mode storage adapter:
1. **Cloud Mode (MongoDB Atlas)**: Activated when `MONGODB_URI` is provided. Automatically handles connection pools, SSL handshakes, and timeout retries.
2. **Local Fallback Mode**: If `MONGODB_URI` is `"none"` or the cluster is temporarily unreachable, the adapter transparently persists documents to `backend/data/db.json` with synchronous file-locking. This prevents API failure during cloud outages or zero-config development.
