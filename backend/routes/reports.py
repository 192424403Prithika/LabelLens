from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from database import db
from services.pdf_service import pdf_service

router = APIRouter(prefix="/api/reports", tags=["Downloadable Reports"])

@router.get("/pdf/{product_id}")
def download_product_report(product_id: str):
    product = db.find_one("products", {"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    pdf_bytes = pdf_service.generate_product_report(product)
    
    filename = f"LabelLens_Report_{product.get('name', 'Product').replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
