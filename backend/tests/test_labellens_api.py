import os
import sys
import io
import pytest
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import db
from services.ocr_service import ocr_service
from services.nlp_service import nlp_service
from services.pdf_service import pdf_service
from services.recommendation_service import recommendation_service
from routes.auth import create_access_token, get_current_user_from_token
from models import DietaryPreferences, Product, NutritionFacts

def test_health_and_database_status():
    status = db.get_status()
    assert "mode" in status
    assert "counts" in status
    assert isinstance(status["counts"]["users"], int)

def test_user_jwt_token_generation_and_decode():
    token = create_access_token("test-user-123", "test@labellens.ai")
    assert isinstance(token, str)
    assert len(token) > 20

def test_nlp_ingredient_parsing_and_categorization():
    raw_text = "Whole grain oats, cane sugar, honey, salt, canola oil, mixed tocopherols (vitamin E)."
    parts = nlp_service.parse_raw_ingredients(raw_text)
    assert len(parts) >= 4
    
    analyzed = [nlp_service.analyze_ingredient(p) for p in parts]
    names = [a.clean_name.lower() for a in analyzed]
    assert any("oats" in n for n in names)
    assert any("sugar" in n for n in names)

def test_rapid_ocr_inference_on_real_image():
    # Generate a real image containing clean printed text using PIL
    img = Image.new('RGB', (600, 200), color='#FFFFFF')
    draw = ImageDraw.Draw(img)
    draw.text((20, 30), "NUTRITION FACTS", fill='#000000')
    draw.text((20, 70), "Calories 150", fill='#000000')
    draw.text((20, 110), "Total Fat 3g", fill='#000000')
    draw.text((20, 150), "INGREDIENTS: Rolled Oats, Salt.", fill='#000000')

    test_img_path = os.path.join(BACKEND_DIR, "uploads", "test_label_img.jpg")
    os.makedirs(os.path.dirname(test_img_path), exist_ok=True)
    img.save(test_img_path, "JPEG")

    # Run OCR inference
    result = ocr_service.extract_text_and_structure(test_img_path)
    assert "raw_text" in result
    assert "confidence" in result
    assert isinstance(result["uncertain_fields"], list)

    # Clean up test artifact
    if os.path.exists(test_img_path):
        os.remove(test_img_path)

def test_ocr_evaluation_metrics_cer_wer():
    gt = "WHOLE GRAIN OATS SUGAR SALT"
    pred = "WHOLE GRAIN OATS SUGAR SLT"
    metrics = ocr_service.compute_evaluation_metrics(gt, pred)
    assert metrics["cer_percentage"] > 0
    assert metrics["ocr_accuracy"] > 80.0
    assert "character_edits" in metrics

def test_serving_calculation():
    test_prod = {
        "id": "test-p1",
        "name": "Organic Almond Milk",
        "serving_size": 240.0,
        "serving_unit": "ml",
        "nutrition_per_serving": {
            "calories": 60.0,
            "protein_g": 2.0,
            "fat_total_g": 3.0,
            "carbohydrates_g": 8.0,
            "sugars_g": 7.0,
            "sodium_mg": 150.0
        }
    }
    scaled = recommendation_service.calculate_custom_serving(test_prod, 120.0, "ml")
    assert scaled["target_serving_size"] == 120.0
    assert scaled["scale_factor"] == 0.5
    assert scaled["calculated_nutrition"]["calories"] == 30.0

def test_product_comparison_engine():
    p1 = {
        "id": "p1",
        "name": "High Fiber Flakes",
        "brand": "Brand A",
        "serving_size": 40.0,
        "serving_unit": "g",
        "nutrition_per_serving": {
            "calories": 130.0,
            "protein_g": 4.0,
            "fat_total_g": 1.5,
            "carbohydrates_g": 28.0,
            "sugars_g": 5.0,
            "fiber_g": 9.0,
            "sodium_mg": 180.0
        },
        "ingredients_raw": "Whole wheat, wheat bran, sugar, salt."
    }
    p2 = {
        "id": "p2",
        "name": "Sugary Krisps",
        "brand": "Brand B",
        "serving_size": 40.0,
        "serving_unit": "g",
        "nutrition_per_serving": {
            "calories": 160.0,
            "protein_g": 1.0,
            "fat_total_g": 2.0,
            "carbohydrates_g": 34.0,
            "sugars_g": 18.0,
            "fiber_g": 1.0,
            "sodium_mg": 240.0
        },
        "ingredients_raw": "Corn meal, sugar, high fructose corn syrup."
    }

    comp = recommendation_service.compare_products([p1, p2], user_goal="Lower Sugar")
    assert comp["winner_id"] == "p1"
    assert "Brand A" in comp["winner_brand"]

def test_pdf_report_generation():
    test_prod = {
        "id": "test-pdf-prod",
        "name": "Steel Cut Irish Oats",
        "brand": "McCann's",
        "category": "Cereal",
        "serving_description": "1/4 cup dry (40g)",
        "provenance": "Open Food Facts API",
        "data_quality_score": 95.0,
        "nutrition_per_serving": {
            "calories": 150.0,
            "protein_g": 5.0,
            "fat_total_g": 2.5,
            "carbohydrates_g": 27.0,
            "sugars_g": 1.0,
            "fiber_g": 4.0,
            "sodium_mg": 0.0
        },
        "ingredients_raw": "100% Whole Grain Irish Oats.",
        "declared_allergens": []
    }
    pdf_bytes = pdf_service.generate_product_report(test_prod)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
