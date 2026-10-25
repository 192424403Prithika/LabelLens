from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class DietaryPreferences(BaseModel):
    diet: List[str] = Field(default_factory=lambda: ["Vegetarian"])  # Vegan, Vegetarian, Gluten-Free, Keto, Halal, Kosher, Dairy-Free
    allergens_to_avoid: List[str] = Field(default_factory=lambda: ["Peanuts", "Tree Nuts", "Milk", "Soy", "Wheat"])
    avoid_ingredients: List[str] = Field(default_factory=lambda: ["High Fructose Corn Syrup", "Palm Oil", "Artificial Colors", "Sodium Benzoate", "Titanium Dioxide"])
    monitor_ingredients: List[str] = Field(default_factory=lambda: ["Cane Sugar", "Natural Flavors", "Canola Oil"])
    find_ingredients: List[str] = Field(default_factory=lambda: ["Whole Grain Oats", "Chia Seeds", "Probiotics"])
    max_sugar_g: Optional[float] = 10.0
    max_sodium_mg: Optional[float] = 250.0
    max_sat_fat_g: Optional[float] = 3.0
    min_protein_g: Optional[float] = 5.0
    min_fiber_g: Optional[float] = 3.0

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: str = ""
    preferences: DietaryPreferences = Field(default_factory=DietaryPreferences)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = ""

class NutritionFacts(BaseModel):
    calories: float = 0.0
    protein_g: float = 0.0
    fat_total_g: float = 0.0
    saturated_fat_g: float = 0.0
    trans_fat_g: float = 0.0
    carbohydrates_g: float = 0.0
    sugars_g: float = 0.0
    added_sugars_g: float = 0.0
    fiber_g: float = 0.0
    sodium_mg: float = 0.0
    cholesterol_mg: float = 0.0
    calcium_mg: Optional[float] = 0.0
    iron_mg: Optional[float] = 0.0
    potassium_mg: Optional[float] = 0.0

class IngredientDetail(BaseModel):
    name: str
    clean_name: str
    category: str  # Sweetener, Preservative, Emulsifier, Flavoring, Whole Food, Vitamin/Mineral, Colorant, Leavening, Thickener, Other
    explanation: str
    evidence_source: str
    confidence: float = 0.95
    is_uncertain: bool = False
    synonyms: List[str] = Field(default_factory=list)
    allergen_potential: Optional[str] = None
    health_notes: Optional[str] = None

class AllergenCheckItem(BaseModel):
    allergen: str
    status: str  # 'DECLARED', 'POSSIBLE_MATCH', 'CROSS_CONTAMINATION_RISK', 'SAFE'
    source_text: str
    confidence: float
    warning_level: str  # 'HIGH', 'MEDIUM', 'LOW', 'NONE'
    explanation: str

class Product(BaseModel):
    id: str
    barcode: str
    name: str
    brand: str
    category: str
    image_url: str
    serving_size: float = 100.0
    serving_unit: str = "g"
    serving_description: str = "1 serving"
    servings_per_container: Optional[float] = 1.0
    nutrition_per_serving: NutritionFacts
    nutrition_per_100g: NutritionFacts
    ingredients_raw: str
    ingredients_list: List[IngredientDetail] = Field(default_factory=list)
    declared_allergens: List[str] = Field(default_factory=list)
    may_contain_allergens: List[str] = Field(default_factory=list)
    formulation_version: str = "1.0"
    last_reformulation_date: Optional[str] = None
    formulation_history: List[Dict[str, Any]] = Field(default_factory=list)
    data_quality_score: float = 95.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScanRecord(BaseModel):
    id: str
    user_id: str
    image_url: str
    raw_ocr_text: str
    ocr_confidence: float
    ocr_word_count: int
    detected_ingredients_text: str
    detected_nutrition_raw: Dict[str, Any]
    status: str = "completed"  # processing, completed, error, reviewed
    corrections_made: bool = False
    original_extracted_data: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OCRCorrectionRequest(BaseModel):
    scan_id: str
    corrected_product_name: Optional[str] = None
    corrected_brand: Optional[str] = None
    corrected_ingredients_raw: Optional[str] = None
    corrected_nutrition: Optional[NutritionFacts] = None
    corrected_serving_size: Optional[float] = None
    corrected_serving_unit: Optional[str] = None
    feedback_notes: Optional[str] = None

class ServingCalculationRequest(BaseModel):
    product_id: str
    target_serving_size: float
    target_serving_unit: str  # 'g', 'ml', 'serving', 'oz'

class SemanticSearchQuery(BaseModel):
    query: str
    dietary_filter: Optional[str] = None
    max_sugar: Optional[float] = None
    min_fiber: Optional[float] = None
    min_protein: Optional[float] = None
    max_sodium: Optional[float] = None

class ComparisonRequest(BaseModel):
    product_ids: List[str]
    user_goal: Optional[str] = "Healthiest Overall"  # "Lowest Sugar", "High Protein", "Lowest Sodium", "Cleanest Ingredients", "Allergen Free"

class UserFeedbackRequest(BaseModel):
    item_type: str  # 'ocr', 'ingredient_explanation', 'alternative_recommendation', 'general'
    item_id: Optional[str] = None
    rating: int  # 1 to 5
    comment: str
    suggested_correction: Optional[str] = None
