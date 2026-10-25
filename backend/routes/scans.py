import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from database import db
from models import OCRCorrectionRequest, NutritionFacts
from services.ocr_service import ocr_service
from services.nlp_service import nlp_service
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/api/scans", tags=["Scans"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_label_image(
    file: UploadFile = File(...),
    product_name_hint: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user_from_token)
):
    # Verify extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload JPG, PNG, or WEBP.")

    scan_id = f"scan-{uuid.uuid4().hex[:10]}"
    file_path = os.path.join(UPLOAD_DIR, f"{scan_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run genuine deep learning RapidOCR pipeline
    ocr_result = ocr_service.extract_text_and_structure(file_path, user_hint_name=product_name_hint)

    # Segment and parse ingredients
    raw_ing = ocr_result["ingredients_raw"]
    parsed_parts = nlp_service.parse_raw_ingredients(raw_ing)
    parsed_ingredients = [nlp_service.analyze_ingredient(p).dict() for p in parsed_parts]

    # Create scan record in database
    scan_record = {
        "id": scan_id,
        "user_id": current_user["id"],
        "original_filename": file.filename,
        "image_url": f"/uploads/{os.path.basename(file_path)}",
        "preprocessed_image_url": f"/uploads/{os.path.basename(ocr_result['preprocessed_image'])}",
        "raw_ocr_text": ocr_result["raw_text"],
        "ocr_confidence": ocr_result["confidence"],
        "ocr_word_count": ocr_result["word_count"],
        "data_quality_index": ocr_result["data_quality_index"],
        "uncertain_fields": ocr_result["uncertain_fields"],
        "extracted_product_name": product_name_hint or ocr_result.get("extracted_product_name") or "Scanned Product",
        "extracted_brand": ocr_result.get("extracted_brand") or "Scanned Brand",
        "serving_size": ocr_result["serving_size"],
        "serving_unit": ocr_result["serving_unit"],
        "serving_description": ocr_result["serving_description"],
        "nutrition_per_serving": ocr_result["nutrition"].dict(),
        "ingredients_raw": raw_ing,
        "ingredients_list": parsed_ingredients,
        "declared_allergens": ocr_result["declared_allergens"],
        "may_contain_allergens": ocr_result["may_contain_allergens"],
        "status": ocr_result.get("status", "completed"),
        "error_message": ocr_result.get("error_message"),
        "corrections_made": False,
        "original_extracted_data": {
            "nutrition": ocr_result["nutrition"].dict(),
            "ingredients_raw": raw_ing
        }
    }
    db.insert_one("scans", scan_record)

    # Also automatically create or link product record
    prod_id = f"prod-{scan_id}"
    new_product = {
        "id": prod_id,
        "barcode": f"SCAN_{uuid.uuid4().hex[:8].upper()}",
        "name": scan_record["extracted_product_name"],
        "brand": scan_record["extracted_brand"],
        "category": "Packaged Food",
        "image_url": scan_record["image_url"],
        "serving_size": scan_record["serving_size"],
        "serving_unit": scan_record["serving_unit"],
        "serving_description": scan_record["serving_description"],
        "servings_per_container": 1.0,
        "nutrition_per_serving": scan_record["nutrition_per_serving"],
        "nutrition_per_100g": scan_record["nutrition_per_serving"],
        "ingredients_raw": raw_ing,
        "ingredients_list": parsed_ingredients,
        "declared_allergens": scan_record["declared_allergens"],
        "may_contain_allergens": scan_record["may_contain_allergens"],
        "formulation_version": "1.0",
        "last_reformulation_date": "2026-10-25",
        "formulation_history": [],
        "provenance": "User Label Scan OCR",
        "data_quality_score": ocr_result["data_quality_index"]
    }
    db.insert_one("products", new_product)
    scan_record["product_id"] = prod_id
    db.update_one("scans", {"id": scan_id}, {"product_id": prod_id})

    return {
        "status": "success",
        "scan": scan_record,
        "product": new_product
    }

@router.post("/correct")
def correct_ocr_results(req: OCRCorrectionRequest, current_user: dict = Depends(get_current_user_from_token)):
    scan = db.find_one("scans", {"id": req.scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    updates = {"corrections_made": True}

    if req.corrected_product_name:
        updates["extracted_product_name"] = req.corrected_product_name
    if req.corrected_brand:
        updates["extracted_brand"] = req.corrected_brand
    if req.corrected_ingredients_raw:
        updates["ingredients_raw"] = req.corrected_ingredients_raw
        parts = nlp_service.parse_raw_ingredients(req.corrected_ingredients_raw)
        updates["ingredients_list"] = [nlp_service.analyze_ingredient(p).dict() for p in parts]
    if req.corrected_nutrition:
        updates["nutrition_per_serving"] = req.corrected_nutrition.dict()
    if req.corrected_serving_size:
        updates["serving_size"] = req.corrected_serving_size
    if req.corrected_serving_unit:
        updates["serving_unit"] = req.corrected_serving_unit

    db.update_one("scans", {"id": req.scan_id}, updates)

    # Update associated product if present
    prod_id = scan.get("product_id")
    if prod_id:
        prod_updates = {}
        if req.corrected_product_name: prod_updates["name"] = req.corrected_product_name
        if req.corrected_brand: prod_updates["brand"] = req.corrected_brand
        if req.corrected_nutrition: prod_updates["nutrition_per_serving"] = req.corrected_nutrition.dict()
        if req.corrected_ingredients_raw:
            prod_updates["ingredients_raw"] = req.corrected_ingredients_raw
            prod_updates["ingredients_list"] = updates.get("ingredients_list", [])
        db.update_one("products", {"id": prod_id}, prod_updates)

    # Log reviewed feedback for model evaluation
    db.insert_one("feedback", {
        "item_type": "ocr_correction",
        "scan_id": req.scan_id,
        "user_id": current_user["id"],
        "user_notes": req.feedback_notes or "User manually verified and corrected OCR output",
        "original_data": scan.get("original_extracted_data"),
        "corrected_data": updates
    })

    return {"status": "success", "message": "OCR correction saved and logged for model evaluation.", "updated_scan": db.find_one("scans", {"id": req.scan_id})}

@router.get("/history")
def get_scan_history(limit: int = 50, current_user: dict = Depends(get_current_user_from_token)):
    return db.find("scans", {"user_id": current_user["id"]}, limit=limit)

@router.get("/{scan_id}")
def get_scan_details(scan_id: str):
    scan = db.find_one("scans", {"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.delete("/{scan_id}")
def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user_from_token)):
    scan = db.find_one("scans", {"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")
    
    # Remove file from uploads if present
    if "image_url" in scan and scan["image_url"].startswith("/uploads/"):
        fname = scan["image_url"].replace("/uploads/", "")
        fpath = os.path.join(UPLOAD_DIR, fname)
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

    db.delete_one("scans", {"id": scan_id})
    return {"status": "success", "message": f"Scan '{scan_id}' deleted successfully"}
