from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import ComparisonRequest, DietaryPreferences, SemanticSearchQuery
from services.recommendation_service import recommendation_service
from services.semantic_service import semantic_service
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/api/comparisons", tags=["Comparisons & Semantic Search"])

@router.post("")
@router.post("/evaluate")
def evaluate_comparison(req: ComparisonRequest, current_user: dict = Depends(get_current_user_from_token)):
    if len(req.product_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 products to compare.")
    if len(req.product_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 3 products can be compared simultaneously.")

    products = []
    for pid in req.product_ids:
        p = db.find_one("products", {"id": pid})
        if p:
            products.append(p)

    if len(products) < 2:
        raise HTTPException(status_code=404, detail="One or more specified products could not be found.")

    prefs = DietaryPreferences(**(current_user.get("preferences", {}))) if current_user else None

    comparison_result = recommendation_service.compare_products(products, preferences=prefs, user_goal=req.user_goal or "Healthiest Overall")

    # Record comparison event in database
    comp_record = {
        "user_id": current_user["id"],
        "product_ids": req.product_ids,
        "user_goal": req.user_goal,
        "winner_id": comparison_result.get("winner_id"),
        "winner_name": comparison_result.get("winner_name"),
        "result": comparison_result
    }
    inserted = db.insert_one("comparisons", comp_record)
    comparison_result["comparison_id"] = inserted.get("id")

    return comparison_result

@router.get("")
def list_comparisons(limit: int = 50, current_user: dict = Depends(get_current_user_from_token)):
    return db.find("comparisons", {"user_id": current_user["id"]}, limit=limit)

@router.get("/{comparison_id}")
def get_comparison(comparison_id: str):
    comp = db.find_one("comparisons", {"id": comparison_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Comparison record not found")
    return comp

@router.delete("/{comparison_id}")
def delete_comparison(comparison_id: str, current_user: dict = Depends(get_current_user_from_token)):
    comp = db.find_one("comparisons", {"id": comparison_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Comparison record not found")
    db.delete_one("comparisons", {"id": comparison_id})
    return {"status": "success", "message": f"Comparison '{comparison_id}' deleted successfully"}

@router.post("/semantic-search")
def semantic_search(req: SemanticSearchQuery):
    all_prods = db.find("products", limit=100)
    matched = semantic_service.semantic_product_search(req.query, all_prods)
    return {
        "query": req.query,
        "total_results": len(matched),
        "products": matched
    }
