import math
import re
from typing import List, Dict, Any, Tuple

class SemanticService:
    def __init__(self):
        # Semantic keyword weights for natural language food search
        self.intent_keywords = {
            "high fiber": {"field": "fiber_g", "direction": "high", "weight": 2.0},
            "more fiber": {"field": "fiber_g", "direction": "high", "weight": 2.0},
            "low sugar": {"field": "sugars_g", "direction": "low", "weight": 2.5},
            "less sugar": {"field": "sugars_g", "direction": "low", "weight": 2.5},
            "no added sugar": {"field": "added_sugars_g", "direction": "low", "weight": 2.5},
            "high protein": {"field": "protein_g", "direction": "high", "weight": 2.0},
            "low sodium": {"field": "sodium_mg", "direction": "low", "weight": 2.0},
            "low calorie": {"field": "calories", "direction": "low", "weight": 1.5},
            "low fat": {"field": "fat_total_g", "direction": "low", "weight": 1.5},
            "low saturated fat": {"field": "saturated_fat_g", "direction": "low", "weight": 1.5},
        }

    def tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b\w+\b', text) if len(w) > 2]

    def compute_jaccard_similarity(self, s1: str, s2: str) -> float:
        set1 = set(self.tokenize(s1))
        set2 = set(self.tokenize(s2))
        if not set1 or not set2:
            return 0.0
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union

    def compute_semantic_match_score(self, item_name: str, candidate_name: str, synonyms: List[str] = None) -> Tuple[float, str]:
        """
        Calculates semantic match score between watchlist term and ingredient name.
        Uses exact match, substring, synonym expansion, and token similarity.
        """
        i_clean = item_name.strip().lower()
        c_clean = candidate_name.strip().lower()

        # Exact match
        if i_clean == c_clean:
            return 1.0, "Exact match"

        # Direct containment
        if i_clean in c_clean or c_clean in i_clean:
            return 0.95, "Direct substring match"

        # Synonym check
        if synonyms:
            for syn in synonyms:
                s_clean = syn.strip().lower()
                if s_clean == c_clean or s_clean in c_clean or c_clean in s_clean:
                    return 0.92, f"Matched known synonym '{syn}'"

        # Token overlap
        jaccard = self.compute_jaccard_similarity(i_clean, c_clean)
        if jaccard >= 0.5:
            return round(0.70 + (jaccard * 0.25), 2), f"Token similarity ({round(jaccard*100)}%)"

        return 0.0, "No semantic match"

    def semantic_product_search(self, query: str, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Natural language product search that extracts dietary intents, category keywords, and nutrient goals.
        Example query: 'breakfast cereal with more fiber and less sugar'
        """
        q_lower = query.lower().strip()
        scored_products = []

        # Identify nutritional intent modifiers
        active_modifiers = []
        for phrase, meta in self.intent_keywords.items():
            if phrase in q_lower:
                active_modifiers.append(meta)

        # Remove recognized modifiers to extract base category/product terms
        cleaned_query = q_lower
        for phrase in self.intent_keywords.keys():
            cleaned_query = cleaned_query.replace(phrase, "")
        query_tokens = set(self.tokenize(cleaned_query))

        for p in products:
            score = 0.0
            reasons = []

            # 1. Category / Name / Brand lexical match
            p_text = f"{p.get('name', '')} {p.get('brand', '')} {p.get('category', '')}".lower()
            p_tokens = set(self.tokenize(p_text))
            
            common_tokens = query_tokens.intersection(p_tokens)
            if query_tokens:
                token_overlap = len(common_tokens) / len(query_tokens)
                if token_overlap > 0:
                    score += token_overlap * 3.0
                    reasons.append(f"Matches query terms: {', '.join(common_tokens)}")

            # If user queried a specific food category e.g. 'cereal', prioritize that category
            if any(t in p_text for t in query_tokens):
                score += 1.0

            # 2. Evaluate nutritional modifiers
            nutrition = p.get("nutrition_per_100g") or p.get("nutrition_per_serving", {})
            for mod in active_modifiers:
                field = mod["field"]
                direction = mod["direction"]
                weight = mod["weight"]
                val = nutrition.get(field, 0.0)

                if direction == "high":
                    # E.g. fiber > 5g per 100g is good
                    if field == "fiber_g":
                        if val >= 6.0:
                            score += weight * 1.5
                            reasons.append(f"High fiber ({val}g/100g)")
                        elif val >= 3.0:
                            score += weight
                            reasons.append(f"Good fiber source ({val}g/100g)")
                    elif field == "protein_g":
                        if val >= 10.0:
                            score += weight * 1.5
                            reasons.append(f"High protein ({val}g/100g)")
                        elif val >= 5.0:
                            score += weight
                elif direction == "low":
                    # E.g. sugar < 5g per 100g is low
                    if "sugar" in field:
                        if val <= 5.0:
                            score += weight * 1.5
                            reasons.append(f"Low sugar ({val}g/100g)")
                        elif val <= 10.0:
                            score += weight
                    elif field == "sodium_mg":
                        if val <= 140.0:
                            score += weight * 1.5
                            reasons.append(f"Low sodium ({val}mg/100g)")
                        elif val <= 300.0:
                            score += weight

            # Bonus for high data quality
            score += (p.get("data_quality_score", 90.0) / 100.0) * 0.5

            if score > 0.5 or not query_tokens:
                item_copy = dict(p)
                item_copy["semantic_score"] = round(score, 2)
                item_copy["semantic_match_reasons"] = reasons
                scored_products.append(item_copy)

        scored_products.sort(key=lambda x: x["semantic_score"], reverse=True)
        return scored_products

semantic_service = SemanticService()
