from fastapi import APIRouter
from database import db
from models import UserFeedbackRequest
from services.evaluation_service import evaluation_service

router = APIRouter(prefix="/api/evaluation", tags=["Model Evaluation & Feedback"])

@router.get("/metrics")
def get_model_evaluation_metrics():
    """
    Returns verified research metrics for the deep learning & document understanding pipeline:
    - Character Error Rate (CER) and Word Error Rate (WER) before & after image preprocessing
    - Precision, Recall, F1 for exact string vs semantic embedding matching
    - NDCG@3 ranking accuracy for personalized recommendations
    - End-to-end pipeline latency benchmarks
    """
    return evaluation_service.run_benchmark_suite()

@router.post("/feedback")
def submit_user_feedback(req: UserFeedbackRequest):
    record = {
        "user_id": "user-demo-1",
        "item_type": req.item_type,
        "item_id": req.item_id,
        "rating": req.rating,
        "comment": req.comment,
        "suggested_correction": req.suggested_correction
    }
    db.insert_one("feedback", record)
    return {"status": "success", "message": "Feedback submitted successfully. Thank you for contributing to model evaluation!"}

@router.get("/feedback/list")
def list_feedback():
    return db.find("feedback", limit=50)
