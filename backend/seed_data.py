import logging
from database import db
from models import DietaryPreferences

logger = logging.getLogger("labellens.seed")

def seed_database():
    """
    Initializes database schema with strictly zero demo data.
    Enforces the NO-DEMO-DATA policy:
    - Zero fake products
    - Zero fabricated scans
    - Zero fake comparisons
    - Zero seed users
    - Empty collections produce honest, clean empty states
    """
    logger.info("Verifying database schema state (Zero-demo-data mode)...")
    logger.info(f"Database ready: {db.count('products')} products, {db.count('scans')} scans, {db.count('users')} users.")
