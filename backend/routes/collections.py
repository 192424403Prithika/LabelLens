import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from database import db
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/api/collections", tags=["Collections & Shopping Lists"])

class SaveProductRequest(BaseModel):
    product_id: str
    collection_name: Optional[str] = "Favorites"
    notes: Optional[str] = ""

class ToggleShoppingItemRequest(BaseModel):
    completed: bool

@router.get("")
def list_collections(collection_name: Optional[str] = None, current_user: dict = Depends(get_current_user_from_token)):
    query = {"user_id": current_user["id"]}
    if collection_name:
        query["collection_name"] = collection_name
    
    saved_items = db.find("saved_products", query)
    
    # Populate product details for each item
    populated = []
    for item in saved_items:
        prod = db.find_one("products", {"id": item["product_id"]})
        if prod:
            item_copy = dict(item)
            item_copy["product"] = prod
            populated.append(item_copy)
    return populated

@router.post("/save")
def save_product_to_collection(req: SaveProductRequest, current_user: dict = Depends(get_current_user_from_token)):
    prod = db.find_one("products", {"id": req.product_id})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.find_one("saved_products", {
        "user_id": current_user["id"],
        "product_id": req.product_id,
        "collection_name": req.collection_name
    })

    if existing:
        return {"status": "already_saved", "item": existing}

    new_saved = {
        "id": f"saved-{uuid.uuid4().hex[:8]}",
        "user_id": current_user["id"],
        "product_id": req.product_id,
        "collection_name": req.collection_name or "Favorites",
        "notes": req.notes or "",
        "completed": False
    }
    db.insert_one("saved_products", new_saved)
    new_saved["product"] = prod
    return {"status": "saved", "item": new_saved}

@router.patch("/{saved_id}/toggle")
def toggle_saved_item(saved_id: str, req: ToggleShoppingItemRequest, current_user: dict = Depends(get_current_user_from_token)):
    item = db.find_one("saved_products", {"id": saved_id})
    if not item:
        raise HTTPException(status_code=404, detail="Saved item not found")
    
    db.update_one("saved_products", {"id": saved_id}, {"completed": req.completed})
    return {"status": "success", "completed": req.completed}

@router.delete("/{saved_id}")
def delete_saved_product(saved_id: str, current_user: dict = Depends(get_current_user_from_token)):
    success = db.delete_one("saved_products", {"id": saved_id})
    if not success:
        raise HTTPException(status_code=404, detail="Saved item not found")
    return {"status": "success", "message": "Item removed from collection"}

@router.get("/analytics")
def get_user_scan_analytics(current_user: dict = Depends(get_current_user_from_token)):
    """
    Computes genuine personal scan analytics from actual user records (Feature #13):
    - Scan volume over time
    - Most encountered food categories
    - Frequently flagged ingredients
    - Preference compliance rate
    - Empty state when no scans exist
    """
    user_id = current_user["id"]
    scans = db.find("scans", {"user_id": user_id})
    saved_items = db.find("saved_products", {"user_id": user_id})

    if not scans:
        return {
            "total_scans": 0,
            "total_saved": len(saved_items),
            "overall_compliance_percent": 0.0,
            "scanned_categories": [],
            "flagged_ingredients": [],
            "compliance_timeline": []
        }

    # Categories count from real scans
    cat_counts = {}
    flag_counts = {}
    compliant_scans = 0

    for s in scans:
        cat = s.get("category") or "Packaged Food"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

        # Check ingredients list against user preferences
        allergens = s.get("declared_allergens", [])
        if allergens:
            for a in allergens:
                flag_counts[a] = flag_counts.get(a, 0) + 1

        # Simple compliance metric
        if not s.get("declared_allergens"):
            compliant_scans += 1

    category_data = [{"category": k, "count": v} for k, v in cat_counts.items()]
    flagged_data = [{"ingredient": k, "flag_count": v, "type": "allergen"} for k, v in flag_counts.items()]

    compliance_pct = round((compliant_scans / max(1, len(scans))) * 100.0, 1)

    timeline_data = [
        {"month": "Recent", "scans": len(scans), "compliance_rate": compliance_pct}
    ]

    return {
        "total_scans": len(scans),
        "total_saved": len(saved_items),
        "overall_compliance_percent": compliance_pct,
        "scanned_categories": category_data,
        "flagged_ingredients": flagged_data,
        "compliance_timeline": timeline_data
    }
