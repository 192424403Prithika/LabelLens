import os
import sys
from contextlib import asynccontextmanager

# Ensure current script folder is on sys.path regardless of execution directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import db
from seed_data import seed_database
from routes import auth, products, scans, analyses, comparisons, collections, reports, evaluation

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LabelLens FastAPI service booting up...")
    seed_database()
    print("Startup complete. OpenAPI documentation ready at /docs")
    yield
    print("LabelLens FastAPI service shutting down...")

app = FastAPI(
    title="LabelLens API",
    description="Intelligent Food Label Understanding & Ingredient Comparison Deep Learning Pipeline",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOAD_DIR = os.path.join(CURRENT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(scans.router)
app.include_router(analyses.router)
app.include_router(comparisons.router)
app.include_router(collections.router)
app.include_router(reports.router)
app.include_router(evaluation.router)

@app.get("/")
def root():
    return {
        "app": "LabelLens",
        "description": "AI-Powered Food Label Understanding & Ingredient Comparison",
        "status": "online",
        "docs_url": "/docs",
        "database": db.get_status()
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "LabelLens Backend",
        "database": db.get_status(),
        "total_products": db.count("products"),
        "total_users": db.count("users"),
        "total_scans": db.count("scans")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
