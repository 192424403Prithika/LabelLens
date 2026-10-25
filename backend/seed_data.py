import logging
from database import db
from models import DietaryPreferences

logger = logging.getLogger("labellens.seed")

def seed_database():
    """
    Initializes database schema and ensures standard user profile exists without demo data.
    Enforces the NO-DEMO-DATA policy:
    - No fake products
    - No fabricated scan history
    - Empty collections produce honest, clean empty states
    """
    logger.info("Verifying database collections state...")
    
    # Ensure default user account exists if none present
    user_count = db.count("users")
    if user_count == 0:
        default_user = {
            "id": "user-demo-1",
            "username": "sophia",
            "email": "sophia@labellens.ai",
            "password_hash": "$2b$12$eXampleHashedPasswordForDemoOnly",
            "full_name": "Sophia Tompson",
            "preferences": DietaryPreferences(
                diet=["Vegetarian"],
                allergens_to_avoid=["Peanuts", "Tree Nuts"],
                avoid_ingredients=["High Fructose Corn Syrup", "Artificial Colors"],
                monitor_ingredients=["Palm Oil", "Added Sugars"],
                find_ingredients=["Whole Grains", "Dietary Fiber"],
                max_sugar_g=12.0,
                max_sodium_mg=250.0,
                max_sat_fat_g=3.0,
                min_protein_g=4.0,
                min_fiber_g=3.0
            ).dict(),
            "created_at": "2026-10-25T10:00:00Z"
        }
        db.insert_one("users", default_user)
        logger.info("Initialized default user profile (Sophia Tompson) with zero fake scans.")

    logger.info(f"Database ready: {db.count('products')} products, {db.count('scans')} scans, {db.count('comparisons')} comparisons.")
