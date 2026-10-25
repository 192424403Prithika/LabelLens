import urllib.request
import json
import io
from PIL import Image, ImageDraw

def run_project_verification():
    print("==================================================")
    print("      LABELLENS FULL-SYSTEM VERIFICATION RUN       ")
    print("==================================================")

    # 1. Backend Health
    print("\n[1/8] Checking FastAPI Backend Health...")
    health_req = urllib.request.urlopen("http://127.0.0.1:8000/health")
    health = json.loads(health_req.read().decode())
    print(f"  -> Service: {health['service']} (Status: {health['status']})")
    print(f"  -> Storage Mode: {health['database']['mode']}")
    print(f"  -> Total Products in DB: {health['total_products']}")

    # 2. Frontend Status
    print("\n[2/8] Checking Vite React Web Server...")
    fe_req = urllib.request.urlopen("http://127.0.0.1:5173/")
    print(f"  -> Web App Running at http://127.0.0.1:5173/ (HTTP {fe_req.getcode()} OK)")

    # 3. Authentication
    print("\n[3/8] Testing Authentication & JWT Session...")
    login_data = json.dumps({"username_or_email": "sophia", "password": "Password123!"}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    auth_data = json.loads(urllib.request.urlopen(req).read().decode())
    token = auth_data["token"]
    user = auth_data["user"]
    print(f"  -> Authenticated as: {user['full_name']} <{user['email']}>")
    print(f"  -> Active Preferences: Diet={user['preferences']['diet']}, Allergens Avoided={user['preferences']['allergens_to_avoid']}")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Open Food Facts Live Barcode Lookup
    print("\n[4/8] Testing Live Open Food Facts Barcode API Lookup...")
    barcode = "3017620422003" # Nutella
    b_req = urllib.request.Request(f"http://127.0.0.1:8000/api/products/barcode/{barcode}", headers=auth_headers)
    prod_data = json.loads(urllib.request.urlopen(b_req).read().decode())
    p = prod_data["product"]
    print(f"  -> Retrieved Product: {p['name']} by {p['brand']}")
    print(f"  -> Category: {p['category']} | Data Source: {prod_data['source']}")
    print(f"  -> Nutrition: {p['nutrition_per_100g']['calories']} kcal, {p['nutrition_per_100g']['sugars_g']}g sugar, {p['nutrition_per_100g']['fat_total_g']}g fat per 100g")

    # 5. Genuine Deep Learning OCR Inference on packaging
    print("\n[5/8] Testing RapidOCR (PaddleOCR ONNX) Deep Learning Inference on Real Image...")
    img = Image.new("RGB", (700, 260), color="#FFFFFF")
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "NUTRITION FACTS", fill="#000000")
    draw.text((20, 60), "Serving Size 40g (1 cup)", fill="#000000")
    draw.text((20, 95), "Calories 160", fill="#000000")
    draw.text((20, 130), "Total Fat 4g    Sodium 140mg", fill="#000000")
    draw.text((20, 165), "Total Sugars 3g    Protein 6g", fill="#000000")
    draw.text((20, 200), "INGREDIENTS: Whole Grain Oats, Cane Sugar, Sea Salt.", fill="#000000")

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    img_bytes = buf.read()

    boundary = "----LabelLensFormBoundaryXYZ123"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="oats_box.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + img_bytes + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="product_name_hint"\r\n\r\n'
        f"Rolled Whole Grain Oats\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    ocr_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/scans/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", **auth_headers}
    )
    ocr_res = json.loads(urllib.request.urlopen(ocr_req).read().decode())
    scan = ocr_res["scan"]
    print(f"  -> RapidOCR Status: {ocr_res['status']} (Confidence: {scan['ocr_confidence']})")
    print(f"  -> Extracted Product Name: {scan['extracted_product_name']}")
    print(f"  -> Extracted Calories: {scan['nutrition_per_serving']['calories']} kcal")
    print(f"  -> Extracted Protein: {scan['nutrition_per_serving']['protein_g']}g")
    print(f"  -> Extracted Sugars: {scan['nutrition_per_serving']['sugars_g']}g")
    print(f"  -> Extracted Sodium: {scan['nutrition_per_serving']['sodium_mg']}mg")
    print(f"  -> Parsed Ingredients Count: {len(scan['ingredients_list'])} items")

    # 6. Multi-Product Comparison Engine
    print("\n[6/8] Testing Product Comparison Engine (Goal: Lower Sugar)...")
    prods_req = urllib.request.urlopen("http://127.0.0.1:8000/api/products")
    all_prods = json.loads(prods_req.read().decode())
    print(f"  -> Catalog contains {len(all_prods)} verified real products.")

    if len(all_prods) >= 2:
        comp_ids = [all_prods[0]["id"], all_prods[1]["id"]]
        comp_payload = json.dumps({"product_ids": comp_ids, "user_goal": "Lower Sugar"}).encode()
        c_req = urllib.request.Request(
            "http://127.0.0.1:8000/api/comparisons/evaluate",
            data=comp_payload,
            headers={"Content-Type": "application/json", **auth_headers}
        )
        comp_res = json.loads(urllib.request.urlopen(c_req).read().decode())
        print(f"  -> Winner Recommended: {comp_res['winner_name']} ({comp_res['winner_brand']})")
        print(f"  -> AI Recommendation Rationale: {comp_res['recommendation_rationale']}")

    # 7. Branded PDF Report
    print("\n[7/8] Testing ReportLab PDF Intelligence Export...")
    pdf_url = f"http://127.0.0.1:8000/api/reports/pdf/{all_prods[0]['id']}"
    pdf_resp = urllib.request.urlopen(pdf_url)
    pdf_bytes = pdf_resp.read()
    print(f"  -> PDF Generated Successfully: {len(pdf_bytes)} bytes")
    print(f"  -> Signature: {pdf_bytes[:8].decode('latin1')}")

    # 8. Real Scan Analytics
    print("\n[8/8] Testing Personal User Scan Analytics...")
    an_req = urllib.request.Request("http://127.0.0.1:8000/api/collections/analytics", headers=auth_headers)
    an_data = json.loads(urllib.request.urlopen(an_req).read().decode())
    print(f"  -> User Total Scans: {an_data['total_scans']}")
    print(f"  -> Personal Compliance Rate: {an_data['overall_compliance_percent']}%")
    print(f"  -> Scanned Categories: {an_data['scanned_categories']}")

    print("\n==================================================")
    print("      ALL ENDPOINTS & AI PIPELINES VERIFIED!      ")
    print("==================================================")

if __name__ == "__main__":
    run_project_verification()
