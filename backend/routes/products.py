import httpx
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from database import db
from models import Product, ServingCalculationRequest
from services.recommendation_service import recommendation_service
from services.nlp_service import nlp_service

logger = logging.getLogger("labellens.products")

router = APIRouter(prefix="/api/products", tags=["Products"])

def map_openfoodfacts_product(off_prod: Dict[str, Any], barcode: str) -> Dict[str, Any]:
    """Transforms raw Open Food Facts product schema into LabelLens Product model."""
    p_name = (
        off_prod.get("product_name") 
        or off_prod.get("product_name_en") 
        or off_prod.get("generic_name") 
        or "Unnamed Product"
    )
    brand = off_prod.get("brands") or "Brand Not Specified"
    
    categories = off_prod.get("categories_tags", [])
    category = "Packaged Food"
    if categories:
        category = categories[0].replace("en:", "").replace("-", " ").title()

    raw_ing = (
        off_prod.get("ingredients_text") 
        or off_prod.get("ingredients_text_en") 
        or ""
    )
    nutriments = off_prod.get("nutriments", {})

    parsed_ing = []
    if raw_ing:
        parsed_ing = [nlp_service.analyze_ingredient(p).dict() for p in nlp_service.parse_raw_ingredients(raw_ing)]

    image_url = (
        off_prod.get("image_url")
        or off_prod.get("image_front_url")
        or off_prod.get("image_front_small_url")
        or "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
    )

    serving_size_val = None
    try:
        serving_size_val = float(off_prod.get("serving_quantity") or 100.0)
    except Exception:
        serving_size_val = 100.0

    serving_desc = off_prod.get("serving_size") or f"{serving_size_val}g"

    # Nutrition per serving
    cals_s = nutriments.get("energy-kcal_serving") or nutriments.get("energy-kcal_100g")
    prot_s = nutriments.get("proteins_serving") or nutriments.get("proteins_100g")
    fat_s = nutriments.get("fat_serving") or nutriments.get("fat_100g")
    sat_s = nutriments.get("saturated-fat_serving") or nutriments.get("saturated-fat_100g")
    carb_s = nutriments.get("carbohydrates_serving") or nutriments.get("carbohydrates_100g")
    sug_s = nutriments.get("sugars_serving") or nutriments.get("sugars_100g")
    fib_s = nutriments.get("fiber_serving") or nutriments.get("fiber_100g")
    sod_s = nutriments.get("sodium_serving") or nutriments.get("sodium_100g")
    if sod_s is not None and sod_s < 5:  # convert g to mg if needed
        sod_s = sod_s * 1000.0

    # Nutrition per 100g
    cals_100 = nutriments.get("energy-kcal_100g")
    prot_100 = nutriments.get("proteins_100g")
    fat_100 = nutriments.get("fat_100g")
    sat_100 = nutriments.get("saturated-fat_100g")
    carb_100 = nutriments.get("carbohydrates_100g")
    sug_100 = nutriments.get("sugars_100g")
    fib_100 = nutriments.get("fiber_100g")
    sod_100 = nutriments.get("sodium_100g")
    if sod_100 is not None and sod_100 < 5:
        sod_100 = sod_100 * 1000.0

    declared_allergens = [
        a.replace("en:", "").replace("-", " ").title() 
        for a in off_prod.get("allergens_tags", [])
    ]
    may_contain = [
        a.replace("en:", "").replace("-", " ").title() 
        for a in off_prod.get("traces_tags", [])
    ]

    new_prod = {
        "id": f"prod-{barcode}",
        "barcode": barcode,
        "name": p_name,
        "brand": brand,
        "category": category,
        "image_url": image_url,
        "serving_size": serving_size_val,
        "serving_unit": "g",
        "serving_description": serving_desc,
        "servings_per_container": 1.0,
        "nutrition_per_serving": {
            "calories": float(cals_s) if cals_s is not None else 0.0,
            "protein_g": float(prot_s) if prot_s is not None else 0.0,
            "fat_total_g": float(fat_s) if fat_s is not None else 0.0,
            "saturated_fat_g": float(sat_s) if sat_s is not None else 0.0,
            "trans_fat_g": 0.0,
            "carbohydrates_g": float(carb_s) if carb_s is not None else 0.0,
            "sugars_g": float(sug_s) if sug_s is not None else 0.0,
            "added_sugars_g": 0.0,
            "fiber_g": float(fib_s) if fib_s is not None else 0.0,
            "sodium_mg": float(sod_s) if sod_s is not None else 0.0,
            "cholesterol_mg": 0.0
        },
        "nutrition_per_100g": {
            "calories": float(cals_100) if cals_100 is not None else 0.0,
            "protein_g": float(prot_100) if prot_100 is not None else 0.0,
            "fat_total_g": float(fat_100) if fat_100 is not None else 0.0,
            "saturated_fat_g": float(sat_100) if sat_100 is not None else 0.0,
            "trans_fat_g": 0.0,
            "carbohydrates_g": float(carb_100) if carb_100 is not None else 0.0,
            "sugars_g": float(sug_100) if sug_100 is not None else 0.0,
            "added_sugars_g": 0.0,
            "fiber_g": float(fib_100) if fib_100 is not None else 0.0,
            "sodium_mg": float(sod_100) if sod_100 is not None else 0.0,
            "cholesterol_mg": 0.0
        },
        "ingredients_raw": raw_ing or "Ingredients not provided in public database.",
        "ingredients_list": parsed_ing,
        "declared_allergens": declared_allergens,
        "may_contain_allergens": may_contain,
        "formulation_version": "1.0",
        "last_reformulation_date": "2025-01-01",
        "formulation_history": [],
        "provenance": "Open Food Facts API",
        "data_quality_score": 90.0 if raw_ing and cals_100 is not None else 72.0
    }
    return new_prod

@router.get("")
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if category and category != "All":
        query["category"] = category
    
    local_products = db.find("products", query, limit=limit)
    if search:
        s_lower = search.lower().strip()
        filtered = [
            p for p in local_products 
            if s_lower in p.get("name", "").lower() 
            or s_lower in p.get("brand", "").lower() 
            or s_lower in p.get("category", "").lower()
            or s_lower in p.get("barcode", "").lower()
        ]

        # If not enough local products found, query Open Food Facts API live
        if len(filtered) < 3:
            try:
                headers = {"User-Agent": "LabelLens - Web & Mobile Food Intelligence - Version 1.0"}
                async with httpx.AsyncClient(timeout=4.0, headers=headers) as client:
                    resp = await client.get(
                        f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={s_lower}&search_simple=1&action=process&json=1&page_size=8"
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        products_list = data.get("products", [])
                        for off_p in products_list:
                            code = off_p.get("code") or off_p.get("_id")
                            if code and not any(p.get("barcode") == code for p in filtered):
                                mapped = map_openfoodfacts_product(off_p, str(code))
                                db.insert_one("products", mapped)
                                filtered.append(mapped)
            except Exception as e:
                logger.error(f"Open Food Facts search error: {e}")

        return filtered[:limit]
    
    return local_products

@router.get("/barcode/{barcode}")
async def lookup_barcode(barcode: str):
    clean_code = barcode.strip()
    # 1. Search local DB first
    product = db.find_one("products", {"barcode": clean_code})
    if product:
        return {"source": "database", "product": product}

    # 2. Live Open Food Facts API lookup
    try:
        headers = {"User-Agent": "LabelLens - Web & Mobile Food Intelligence - Version 1.0"}
        async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
            resp = await client.get(f"https://world.openfoodfacts.org/api/v2/product/{clean_code}.json")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1 and "product" in data:
                    new_prod = map_openfoodfacts_product(data["product"], clean_code)
                    db.insert_one("products", new_prod)
                    return {"source": "open_food_facts", "product": new_prod}
    except Exception as e:
        logger.error(f"Open Food Facts barcode lookup error: {e}")

    # Honest 404 response
    raise HTTPException(
        status_code=404, 
        detail=f"Product with barcode '{barcode}' was not found in local database or Open Food Facts. You can scan its packaging to create a verified record."
    )

@router.get("/{product_id}")
def get_product(product_id: str):
    product = db.find_one("products", {"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/{product_id}/formulation-changes")
def get_formulation_changes(product_id: str):
    product = db.find_one("products", {"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = product.get("formulation_history", [])
    if not history:
        return {
            "has_formulation_changes": False,
            "message": "No recorded formulation changes. This product is running its initial tracked formulation.",
            "current_version": product.get("formulation_version", "1.0")
        }

    previous = history[0]
    return recommendation_service.detect_formulation_changes(product, previous)

@router.post("/{product_id}/calculate-serving")
def calculate_serving(product_id: str, req: ServingCalculationRequest):
    product = db.find_one("products", {"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return recommendation_service.calculate_custom_serving(product, req.target_serving_size, req.target_serving_unit)
