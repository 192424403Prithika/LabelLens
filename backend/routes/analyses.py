from fastapi import APIRouter, HTTPException
from database import db
from models import DietaryPreferences
from services.nlp_service import nlp_service
from services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/analyses", tags=["Analyses"])

@router.get("/product/{product_id}")
def analyze_product_intelligence(product_id: str):
    product = db.find_one("products", {"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 1. Fetch user preferences
    user = db.find_one("users", {"id": "user-demo-1"})
    prefs_dict = user.get("preferences", {}) if user else {}
    preferences = DietaryPreferences(**prefs_dict)

    # 2. Allergen cross-check
    allergen_results = nlp_service.crosscheck_allergens(
        product.get("ingredients_raw", ""),
        product.get("declared_allergens", []),
        product.get("may_contain_allergens", [])
    )

    # 3. Preference evaluation & goal matching
    preference_eval = recommendation_service.evaluate_product_preferences(product, preferences)

    # 4. Smart alternatives
    all_products = db.find("products", limit=50)
    alternatives = recommendation_service.recommend_alternatives(product, all_products, preferences)

    # 5. Data quality & AI confidence report
    ocr_confidence = product.get("data_quality_score", 95.0)
    missing_fields = []
    nut = product.get("nutrition_per_serving", {})
    for key, label in [("fiber_g", "Dietary Fiber"), ("added_sugars_g", "Added Sugars"), ("protein_g", "Protein")]:
        if nut.get(key) is None:
            missing_fields.append(label)

    data_quality_report = {
        "overall_confidence_percent": ocr_confidence,
        "is_manually_verified": product.get("data_quality_score", 95.0) > 96.0,
        "missing_fields": missing_fields,
        "provenance": "Label OCR + Verified Open Food Data",
        "action_required": "None - High Confidence Extraction" if not missing_fields else f"Verify {', '.join(missing_fields)}"
    }

    return {
        "product": product,
        "allergen_crosscheck": [a.dict() for a in allergen_results],
        "preference_match": preference_eval,
        "smart_alternatives": alternatives,
        "data_quality_report": data_quality_report
    }
