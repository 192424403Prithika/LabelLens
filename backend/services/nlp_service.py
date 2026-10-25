import re
from typing import List, Dict, Any, Tuple
from models import IngredientDetail, AllergenCheckItem

# Common food allergens recognized by FDA and EFSA
COMMON_ALLERGENS = {
    "Milk": ["milk", "dairy", "whey", "casein", "caseinate", "butter", "lactose", "cream", "cheese", "ghee", "yogurt"],
    "Eggs": ["egg", "eggs", "albumin", "ovalbumin", "yolk", "egg whites", "lysozyme", "mayonnaise"],
    "Peanuts": ["peanut", "peanuts", "arachis oil", "groundnuts"],
    "Tree Nuts": ["almond", "almonds", "cashew", "cashews", "walnut", "walnuts", "pecan", "pecans", "pistachio", "hazelnut", "brazil nut", "macadamia"],
    "Wheat": ["wheat", "gluten", "flour", "durum", "semolina", "spelt", "farina", "bulgur", "graham flour"],
    "Soy": ["soy", "soya", "soybean", "soybeans", "soy lecithin", "tofu", "edamame", "miso", "tamari"],
    "Fish": ["fish", "cod", "salmon", "tuna", "anchovy", "tilapia", "bass", "fish gelatin"],
    "Shellfish": ["shrimp", "crab", "lobster", "prawn", "krill", "crawfish", "scallop", "clam", "mussel", "oyster"],
    "Sesame": ["sesame", "sesame seeds", "tahini", "sesame oil"],
    "Sulfites": ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide", "sodium metabisulfite"]
}

# Extensive ingredient reference knowledge base
INGREDIENT_KNOWLEDGE_BASE = {
    "high fructose corn syrup": {
        "category": "Sweetener",
        "clean_name": "High Fructose Corn Syrup",
        "explanation": "A liquid sweetener made from cornstarch that contains glucose and fructose. Heavily consumed in processed foods and linked to increased liver fat and metabolic strain.",
        "evidence_source": "FDA 21 CFR 184.1866; American Journal of Clinical Nutrition",
        "synonyms": ["HFCS", "glucose-fructose syrup", "isoglucose", "maize syrup"],
        "allergen_potential": "Corn",
        "health_notes": "Added sugar with high glycemic impact. Avoid for low-sugar or diabetic-friendly diets."
    },
    "maltodextrin": {
        "category": "Thickener / Carbohydrate",
        "clean_name": "Maltodextrin",
        "explanation": "A plant-derived polysaccharide used as a food additive to improve texture, bulk, and shelf life. Has a very high glycemic index (105-110).",
        "evidence_source": "FDA GRAS Notice No. GRN 000787; EFSA Journal 2014",
        "synonyms": ["dextrin", "modified corn starch"],
        "allergen_potential": None,
        "health_notes": "Spikes blood sugar rapidly despite not tasting excessively sweet."
    },
    "soy lecithin": {
        "category": "Emulsifier",
        "clean_name": "Soy Lecithin",
        "explanation": "A natural emulsifier derived from soybeans that prevents oil and water from separating, creating a smooth, homogenous texture.",
        "evidence_source": "EFSA ANS Panel 2016; FDA 21 CFR 184.1400",
        "synonyms": ["E322", "lecithin", "phosphatidylcholine"],
        "allergen_potential": "Soy",
        "health_notes": "Generally safe for non-soy-allergic individuals; tiny traces of soy protein may remain."
    },
    "xanthan gum": {
        "category": "Thickener",
        "clean_name": "Xanthan Gum",
        "explanation": "A polysaccharide produced through the fermentation of simple sugars by Xanthomonas campestris bacteria. Thickens sauces, dressings, and gluten-free baked goods.",
        "evidence_source": "EFSA Journal 2017; FDA 21 CFR 172.695",
        "synonyms": ["E415", "corn sugar gum"],
        "allergen_potential": None,
        "health_notes": "Water-soluble dietary fiber; may cause mild digestive changes in large quantities."
    },
    "sodium benzoate": {
        "category": "Preservative",
        "clean_name": "Sodium Benzoate",
        "explanation": "A widely used chemical preservative that inhibits mold, yeast, and bacterial growth in acidic foods like salad dressings, fruit juices, and condiments.",
        "evidence_source": "WHO Concise International Chemical Assessment Document 26; FDA 21 CFR 184.1733",
        "synonyms": ["E211", "benzoate of soda"],
        "allergen_potential": None,
        "health_notes": "When combined with ascorbic acid (vitamin C) under heat or light, trace benzene may form."
    },
    "potassium sorbate": {
        "category": "Preservative",
        "clean_name": "Potassium Sorbate",
        "explanation": "A potassium salt of sorbic acid that prevents microbial growth, fermentation, and yeast spoilage in cheeses, wines, and baked goods.",
        "evidence_source": "EFSA ANS Panel 2015; FDA 21 CFR 182.3640",
        "synonyms": ["E202", "sorbate"],
        "allergen_potential": None,
        "health_notes": "Generally considered non-toxic and metabolizes into water and CO2 in the body."
    },
    "titanium dioxide": {
        "category": "Colorant",
        "clean_name": "Titanium Dioxide",
        "explanation": "A white mineral pigment used to brighten candies, chewing gum, and pastries. Banned as a food additive in the European Union due to genotoxicity concerns.",
        "evidence_source": "EFSA Safety Assessment 2021; EU Regulation 2022/63",
        "synonyms": ["E171", "CI 77891", "pigment white 6"],
        "allergen_potential": None,
        "health_notes": "Banned in EU. Under review by FDA. Avoid where possible."
    },
    "sucralose": {
        "category": "Sweetener",
        "clean_name": "Sucralose",
        "explanation": "A zero-calorie artificial sweetener made by chlorinating sucrose. It is approximately 600 times sweeter than table sugar.",
        "evidence_source": "FDA Final Rule 1998; EFSA Food Additives Panel 2016",
        "synonyms": ["Splenda", "E955", "trichlorogalactosucrose"],
        "allergen_potential": None,
        "health_notes": "Does not raise blood glucose directly, but ongoing research evaluates impacts on gut microbiome."
    },
    "aspartame": {
        "category": "Sweetener",
        "clean_name": "Aspartame",
        "explanation": "A low-calorie artificial sweetener composed of phenylalanine, aspartic acid, and methanol, commonly found in diet beverages.",
        "evidence_source": "WHO IARC & JECFA Assessment 2023; FDA 21 CFR 172.804",
        "synonyms": ["NutraSweet", "Equal", "E951"],
        "allergen_potential": "Phenylketonuria (PKU)",
        "health_notes": "Dangerous for individuals with Phenylketonuria (PKU) who cannot metabolize phenylalanine."
    },
    "palm oil": {
        "category": "Fat / Oil",
        "clean_name": "Palm Oil",
        "explanation": "An edible vegetable oil derived from the mesocarp of the fruit of the oil palm. High in saturated palmitic acid and often scrutinized for environmental and cardiovascular effects.",
        "evidence_source": "WHO Guidelines on Saturated Fat Intake; American Heart Association 2020",
        "synonyms": ["fractionated palm oil", "palmate", "palmitate", "elaeis guineensis"],
        "allergen_potential": None,
        "health_notes": "Contains ~50% saturated fat. Monitored for cardiovascular health and deforestation sustainability."
    },
    "monosodium glutamate": {
        "category": "Flavor Enhancer",
        "clean_name": "Monosodium Glutamate",
        "explanation": "The sodium salt of glutamic acid, an amino acid that imparts a savory 'umami' flavor to soups, snacks, and seasoning blends.",
        "evidence_source": "FDA GRAS Status; European Food Safety Authority 2017",
        "synonyms": ["MSG", "E621", "sodium glutamate", "yeast extract", "hydrolyzed protein"],
        "allergen_potential": None,
        "health_notes": "Safe for general population; sensitive individuals may experience transient headaches."
    },
    "ascorbic acid": {
        "category": "Vitamin / Antioxidant",
        "clean_name": "Ascorbic Acid (Vitamin C)",
        "explanation": "An essential micronutrient and natural antioxidant that prevents oxidation, preserves food color, and boosts nutritional value.",
        "evidence_source": "NIH Office of Dietary Supplements; FDA 21 CFR 182.3013",
        "synonyms": ["vitamin C", "E300", "L-ascorbate"],
        "allergen_potential": None,
        "health_notes": "Beneficial essential nutrient with proven antioxidant properties."
    },
    "whole grain oats": {
        "category": "Whole Food",
        "clean_name": "Whole Grain Oats",
        "explanation": "Unrefined oat kernels containing the germ, endosperm, and bran. Rich in soluble beta-glucan fiber proven to help lower LDL cholesterol.",
        "evidence_source": "FDA Health Claim 21 CFR 101.81; European Journal of Clinical Nutrition",
        "synonyms": ["rolled oats", "oat groats", "steel cut oats"],
        "allergen_potential": "Gluten (if cross-contaminated)",
        "health_notes": "Heart-healthy complex carbohydrate with low glycemic response."
    },
    "cane sugar": {
        "category": "Sweetener",
        "clean_name": "Cane Sugar",
        "explanation": "Sucrose extracted from sugar cane stalks. Composed of 50% glucose and 50% fructose.",
        "evidence_source": "USDA Dietary Guidelines for Americans 2020-2025",
        "synonyms": ["sugar", "sucrose", "evaporated cane juice"],
        "allergen_potential": None,
        "health_notes": "High caloric density without micro-nutrients. Contributes to tooth decay and metabolic strain."
    },
    "almonds": {
        "category": "Whole Food / Nut",
        "clean_name": "Almonds",
        "explanation": "Nutrient-dense tree nuts rich in monounsaturated fats, dietary fiber, vitamin E, and plant-based protein.",
        "evidence_source": "USDA FoodData Central; American Heart Association",
        "synonyms": ["almond flour", "almond meal", "prunus dulcis"],
        "allergen_potential": "Tree Nuts",
        "health_notes": "Heart-healthy nut, major declared allergen."
    },
    "chia seeds": {
        "category": "Whole Food / Superfood",
        "clean_name": "Chia Seeds",
        "explanation": "Edible seeds of Salvia hispanica rich in alpha-linolenic acid (ALA) omega-3 fatty acids, soluble fiber, and antioxidants.",
        "evidence_source": "EFSA Journal 2019; Harvard T.H. Chan School of Public Health",
        "synonyms": ["salvia hispanica"],
        "allergen_potential": None,
        "health_notes": "Excellent source of fiber, plant omega-3, and minerals."
    }
}

class NLPService:
    def __init__(self):
        self.kb = INGREDIENT_KNOWLEDGE_BASE
        self.allergens = COMMON_ALLERGENS

    def normalize_ingredient_name(self, raw_name: str) -> str:
        name = raw_name.strip()
        # Remove parenthetical comments for base lookup, but keep original
        name = re.sub(r'[\*\†\‡\(\)\[\]]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def parse_raw_ingredients(self, raw_text: str) -> List[str]:
        """Split raw ingredients string into individual ingredient chunks respecting parentheses."""
        if not raw_text:
            return []
        
        # Remove leading "Ingredients:" label if present
        text = re.sub(r'^(ingredients|contains|made with)\s*:\s*', '', raw_text.strip(), flags=re.IGNORECASE)
        
        # Split by comma or semicolon, but not within parentheses
        parts = []
        current = []
        depth = 0
        for char in text:
            if char in "([{":
                depth += 1
                current.append(char)
            elif char in ")]}":
                depth = max(0, depth - 1)
                current.append(char)
            elif (char == ',' or char == ';') and depth == 0:
                chunk = "".join(current).strip()
                if chunk:
                    parts.append(chunk)
                current = []
            else:
                current.append(char)
        if current:
            chunk = "".join(current).strip()
            if chunk:
                parts.append(chunk)
        return parts

    def analyze_ingredient(self, raw_ingredient: str) -> IngredientDetail:
        cleaned = self.normalize_ingredient_name(raw_ingredient).lower()
        
        # Exact or partial match in KB
        matched_kb = None
        for key, entry in self.kb.items():
            if key in cleaned or cleaned in key:
                matched_kb = entry
                break
            # Check synonyms
            for syn in entry.get("synonyms", []):
                if syn.lower() in cleaned:
                    matched_kb = entry
                    break
            if matched_kb:
                break
        
        if matched_kb:
            return IngredientDetail(
                name=raw_ingredient.strip(),
                clean_name=matched_kb["clean_name"],
                category=matched_kb["category"],
                explanation=matched_kb["explanation"],
                evidence_source=matched_kb["evidence_source"],
                confidence=0.96,
                is_uncertain=False,
                synonyms=matched_kb.get("synonyms", []),
                allergen_potential=matched_kb.get("allergen_potential"),
                health_notes=matched_kb.get("health_notes")
            )
        
        # Heuristic / rule-based classification
        category = self.heuristic_classify(cleaned)
        explanation = self.generate_plain_explanation(raw_ingredient, category)
        return IngredientDetail(
            name=raw_ingredient.strip(),
            clean_name=raw_ingredient.strip().title(),
            category=category,
            explanation=explanation,
            evidence_source="LabelLens NLP Linguistic Pattern & Codex Alimentarius Standard",
            confidence=0.82,
            is_uncertain=True if len(raw_ingredient.strip()) < 3 else False,
            synonyms=[],
            allergen_potential=None,
            health_notes=None
        )

    def heuristic_classify(self, cleaned: str) -> str:
        if any(w in cleaned for w in ["sugar", "syrup", "dextrose", "fructose", "sucralose", "aspartame", "stevia", "erythritol"]):
            return "Sweetener"
        if any(w in cleaned for w in ["sorbate", "benzoate", "bht", "bha", "propionate", "nitrite", "sulfite"]):
            return "Preservative"
        if any(w in cleaned for w in ["lecithin", "polysorbate", "mono- and diglycerides", "stearoyl"]):
            return "Emulsifier"
        if any(w in cleaned for w in ["flavor", "flavour", "extract", "vanillin", "spice", "seasoning"]):
            return "Flavoring"
        if any(w in cleaned for w in ["gum", "starch", "pectin", "carrageenan", "agar", "gelatin", "cellulose"]):
            return "Thickener / Stabilizer"
        if any(w in cleaned for w in ["color", "colour", "lake", "caramel color", "red 40", "yellow 5", "blue 1"]):
            return "Colorant"
        if any(w in cleaned for w in ["baking powder", "baking soda", "yeast", "ammonium bicarbonate"]):
            return "Leavening Agent"
        if any(w in cleaned for w in ["vitamin", "iron", "calcium", "niacin", "folic acid", "zinc", "ascorbic"]):
            return "Vitamin / Mineral"
        if any(w in cleaned for w in ["oil", "fat", "butter", "shortening"]):
            return "Fat / Oil"
        return "Whole Food / Primary Ingredient"

    def generate_plain_explanation(self, name: str, category: str) -> str:
        templates = {
            "Sweetener": f"{name} is added to impart sweetness or modify caloric content.",
            "Preservative": f"{name} is an additive used to retard oxidation or inhibit microbial growth, extending freshness.",
            "Emulsifier": f"{name} helps blend ingredients that usually separate (like oil and water) into a uniform mixture.",
            "Flavoring": f"{name} provides specific aromatic qualities to boost or round out the taste profile.",
            "Thickener / Stabilizer": f"{name} gives body, viscosity, and consistency to the product texture.",
            "Colorant": f"{name} standardizes or enhances the visual color of the product.",
            "Fat / Oil": f"{name} contributes dietary fats, mouthfeel, and cooking stability.",
            "Vitamin / Mineral": f"{name} fortifies the food with essential micronutrients.",
            "Whole Food / Primary Ingredient": f"{name} is a base food ingredient providing core macronutrients and structure."
        }
        return templates.get(category, f"{name} serves a functional role in the recipe.")

    def crosscheck_allergens(self, ingredients_raw: str, declared_allergens: List[str], may_contain: List[str]) -> List[AllergenCheckItem]:
        results: List[AllergenCheckItem] = []
        text_lower = ingredients_raw.lower()
        
        # 1. Check declared allergens first (Confirmed label text)
        for allergen in declared_allergens:
            results.append(AllergenCheckItem(
                allergen=allergen,
                status="DECLARED",
                source_text="Confirmed in label allergen statement ('Contains')",
                confidence=0.99,
                warning_level="HIGH",
                explanation=f"Explicitly declared on the product label as an allergen. Individuals with {allergen} allergy must avoid this product."
            ))

        # 2. Check may contain / advisory statements
        for allergen in may_contain:
            if not any(r.allergen.lower() == allergen.lower() for r in results):
                results.append(AllergenCheckItem(
                    allergen=allergen,
                    status="CROSS_CONTAMINATION_RISK",
                    source_text="Found in precautionary statement ('May contain' or 'Manufactured on shared equipment')",
                    confidence=0.90,
                    warning_level="MEDIUM",
                    explanation=f"Product may share equipment or facility with {allergen}. Caution advised for severe allergy sufferers."
                ))

        # 3. Check ingredient text for hidden / undeclared allergen keywords
        for allergen, keywords in self.allergens.items():
            if any(r.allergen.lower() == allergen.lower() for r in results):
                continue  # already flagged as declared or cross-contamination
            
            matched_kw = []
            for kw in keywords:
                # Use word boundaries
                if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                    matched_kw.append(kw)
            
            if matched_kw:
                results.append(AllergenCheckItem(
                    allergen=allergen,
                    status="POSSIBLE_MATCH",
                    source_text=f"Detected matching term(s) in ingredient list: '{', '.join(matched_kw)}'",
                    confidence=0.88,
                    warning_level="HIGH",
                    explanation=f"Ingredient text contains references ('{matched_kw[0]}') indicating presence of {allergen}, even if not separately highlighted."
                ))

        return results

nlp_service = NLPService()
