from typing import List, Dict, Any, Optional
from models import Product, DietaryPreferences, NutritionFacts
from services.semantic_service import semantic_service

class RecommendationService:
    def __init__(self):
        pass

    def evaluate_product_preferences(self, product: Dict[str, Any], preferences: DietaryPreferences) -> Dict[str, Any]:
        """
        Evaluates a product against user-defined preferences and nutrient thresholds.
        Returns match status, conflict points, watchlist hits, and overall suitability score.
        """
        ingredients_raw = product.get("ingredients_raw", "").lower()
        ingredients_list = product.get("ingredients_list", [])
        declared_allergens = [a.lower() for a in product.get("declared_allergens", [])]
        may_contain = [a.lower() for a in product.get("may_contain_allergens", [])]
        nutrition = product.get("nutrition_per_serving") or product.get("nutrition_per_100g", {})
        if isinstance(nutrition, NutritionFacts):
            nutrition = nutrition.dict()

        conflicts = []
        warnings = []
        positive_highlights = []
        watchlist_matches = []

        # 1. Dietary Compliance
        diet_list = preferences.diet or []
        for diet in diet_list:
            if diet == "Vegan":
                non_vegan = ["milk", "whey", "casein", "butter", "cheese", "egg", "honey", "gelatin", "lard", "beef", "chicken"]
                found = [nv for nv in non_vegan if nv in ingredients_raw]
                if found:
                    conflicts.append(f"Not Vegan: contains {', '.join(found[:3])}")
            elif diet == "Vegetarian":
                non_veg = ["gelatin", "lard", "beef", "pork", "chicken", "fish", "carmine"]
                found = [nv for nv in non_veg if nv in ingredients_raw]
                if found:
                    conflicts.append(f"Not Vegetarian: contains {', '.join(found[:3])}")
            elif diet == "Gluten-Free":
                gluten_terms = ["wheat", "barley", "rye", "malt", "spelt", "durum"]
                found = [gt for gt in gluten_terms if gt in ingredients_raw]
                if found or any("wheat" in a for a in declared_allergens):
                    conflicts.append(f"Contains Gluten ({', '.join(found) if found else 'declared allergen'})")

        # 2. Allergen check against user allergen preferences
        for user_allergen in preferences.allergens_to_avoid:
            ua_lower = user_allergen.lower()
            if any(ua_lower in da for da in declared_allergens):
                conflicts.append(f"Contains your flagged allergen: {user_allergen}")
            elif any(ua_lower in mc for mc in may_contain):
                warnings.append(f"Precautionary alert: May contain {user_allergen} (shared equipment)")
            elif ua_lower in ingredients_raw:
                conflicts.append(f"Ingredient list includes {user_allergen}")

        # 3. Watchlist Items Check
        # Avoid items
        for item in preferences.avoid_ingredients:
            matched = False
            for ing in ingredients_list:
                ing_name = ing.get("clean_name", ing.get("name", ""))
                score, reason = semantic_service.compute_semantic_match_score(item, ing_name, ing.get("synonyms", []))
                if score >= 0.75:
                    conflicts.append(f"Contains avoided ingredient: {item} ({reason})")
                    watchlist_matches.append({"type": "avoid", "item": item, "matched_with": ing_name, "score": score})
                    matched = True
                    break
            if not matched and item.lower() in ingredients_raw:
                conflicts.append(f"Contains avoided ingredient: {item}")
                watchlist_matches.append({"type": "avoid", "item": item, "matched_with": item, "score": 1.0})

        # Monitor items
        for item in preferences.monitor_ingredients:
            matched = False
            for ing in ingredients_list:
                ing_name = ing.get("clean_name", ing.get("name", ""))
                score, reason = semantic_service.compute_semantic_match_score(item, ing_name, ing.get("synonyms", []))
                if score >= 0.75:
                    warnings.append(f"Monitored ingredient present: {item} ({reason})")
                    watchlist_matches.append({"type": "monitor", "item": item, "matched_with": ing_name, "score": score})
                    matched = True
                    break
            if not matched and item.lower() in ingredients_raw:
                warnings.append(f"Monitored ingredient present: {item}")
                watchlist_matches.append({"type": "monitor", "item": item, "matched_with": item, "score": 1.0})

        # Find items (positive)
        for item in preferences.find_ingredients:
            matched = False
            for ing in ingredients_list:
                ing_name = ing.get("clean_name", ing.get("name", ""))
                score, reason = semantic_service.compute_semantic_match_score(item, ing_name, ing.get("synonyms", []))
                if score >= 0.75:
                    positive_highlights.append(f"Contains desired ingredient: {item}")
                    watchlist_matches.append({"type": "find", "item": item, "matched_with": ing_name, "score": score})
                    matched = True
                    break
            if not matched and item.lower() in ingredients_raw:
                positive_highlights.append(f"Contains desired ingredient: {item}")
                watchlist_matches.append({"type": "find", "item": item, "matched_with": item, "score": 1.0})

        # 4. Nutritional Threshold Evaluation
        threshold_evaluations = []
        
        # Max Sugar
        if preferences.max_sugar_g is not None:
            sugar_val = nutrition.get("sugars_g", 0.0)
            if sugar_val > preferences.max_sugar_g:
                conflicts.append(f"High Sugar: {sugar_val}g exceeds your goal of {preferences.max_sugar_g}g")
                threshold_evaluations.append({"field": "sugars_g", "status": "CONFLICT", "actual": sugar_val, "target": preferences.max_sugar_g, "unit": "g"})
            else:
                positive_highlights.append(f"Sugar compliant: {sugar_val}g (within {preferences.max_sugar_g}g)")
                threshold_evaluations.append({"field": "sugars_g", "status": "MATCH", "actual": sugar_val, "target": preferences.max_sugar_g, "unit": "g"})

        # Max Sodium
        if preferences.max_sodium_mg is not None:
            sodium_val = nutrition.get("sodium_mg", 0.0)
            if sodium_val > preferences.max_sodium_mg:
                conflicts.append(f"High Sodium: {sodium_val}mg exceeds your goal of {preferences.max_sodium_mg}mg")
                threshold_evaluations.append({"field": "sodium_mg", "status": "CONFLICT", "actual": sodium_val, "target": preferences.max_sodium_mg, "unit": "mg"})
            else:
                positive_highlights.append(f"Sodium compliant: {sodium_val}mg (within {preferences.max_sodium_mg}mg)")
                threshold_evaluations.append({"field": "sodium_mg", "status": "MATCH", "actual": sodium_val, "target": preferences.max_sodium_mg, "unit": "mg"})

        # Min Fiber
        if preferences.min_fiber_g is not None:
            fiber_val = nutrition.get("fiber_g", 0.0)
            if fiber_val < preferences.min_fiber_g:
                warnings.append(f"Low Fiber: {fiber_val}g is below your target of {preferences.min_fiber_g}g")
                threshold_evaluations.append({"field": "fiber_g", "status": "BELOW_TARGET", "actual": fiber_val, "target": preferences.min_fiber_g, "unit": "g"})
            else:
                positive_highlights.append(f"Good fiber content: {fiber_val}g")
                threshold_evaluations.append({"field": "fiber_g", "status": "MATCH", "actual": fiber_val, "target": preferences.min_fiber_g, "unit": "g"})

        # Min Protein
        if preferences.min_protein_g is not None:
            prot_val = nutrition.get("protein_g", 0.0)
            if prot_val < preferences.min_protein_g:
                warnings.append(f"Moderate protein: {prot_val}g vs {preferences.min_protein_g}g target")
                threshold_evaluations.append({"field": "protein_g", "status": "BELOW_TARGET", "actual": prot_val, "target": preferences.min_protein_g, "unit": "g"})
            else:
                positive_highlights.append(f"Protein rich: {prot_val}g")
                threshold_evaluations.append({"field": "protein_g", "status": "MATCH", "actual": prot_val, "target": preferences.min_protein_g, "unit": "g"})

        # Compute composite suitability score (0-100)
        base_score = 80.0
        base_score -= len(conflicts) * 20.0
        base_score -= len(warnings) * 7.0
        base_score += len(positive_highlights) * 6.0
        suitability_score = max(5.0, min(100.0, base_score))

        status = "COMPLIANT"
        if len(conflicts) >= 2 or suitability_score < 40:
            status = "STRONG_CONFLICT"
        elif len(conflicts) == 1 or suitability_score < 65:
            status = "CAUTION"
        elif suitability_score >= 80:
            status = "EXCELLENT_MATCH"

        return {
            "status": status,
            "suitability_score": round(suitability_score, 1),
            "conflicts": conflicts,
            "warnings": warnings,
            "positive_highlights": positive_highlights,
            "watchlist_matches": watchlist_matches,
            "threshold_evaluations": threshold_evaluations
        }

    def recommend_alternatives(self, target_product: Dict[str, Any], all_products: List[Dict[str, Any]], preferences: Optional[DietaryPreferences] = None) -> List[Dict[str, Any]]:
        """
        Suggests smarter, healthier alternatives in the same or adjacent category with transparent reasoning.
        """
        cat = target_product.get("category", "").lower()
        t_id = target_product.get("id")
        t_nut = target_product.get("nutrition_per_serving") or target_product.get("nutrition_per_100g", {})
        if isinstance(t_nut, NutritionFacts):
            t_nut = t_nut.dict()

        candidates = [p for p in all_products if p.get("id") != t_id]
        scored_candidates = []

        for p in candidates:
            score = 0.0
            reasons = []
            p_cat = p.get("category", "").lower()
            p_nut = p.get("nutrition_per_serving") or p.get("nutrition_per_100g", {})
            if isinstance(p_nut, NutritionFacts):
                p_nut = p_nut.dict()

            # Same or compatible category
            if p_cat == cat:
                score += 4.0
            elif any(k in p_cat for k in cat.split()):
                score += 2.0
            else:
                score += 0.5

            # Sugar improvement
            t_sugar = t_nut.get("sugars_g", 0.0)
            p_sugar = p_nut.get("sugars_g", 0.0)
            if p_sugar < t_sugar:
                diff_sugar = t_sugar - p_sugar
                pct_sugar = round((diff_sugar / max(1.0, t_sugar)) * 100)
                if pct_sugar >= 20:
                    score += 3.0
                    reasons.append(f"{pct_sugar}% less sugar ({p_sugar}g vs {t_sugar}g)")

            # Fiber improvement
            t_fiber = t_nut.get("fiber_g", 0.0)
            p_fiber = p_nut.get("fiber_g", 0.0)
            if p_fiber > t_fiber:
                diff_fiber = p_fiber - t_fiber
                score += 2.5
                reasons.append(f"+{round(diff_fiber, 1)}g more dietary fiber ({p_fiber}g vs {t_fiber}g)")

            # Protein improvement
            t_prot = t_nut.get("protein_g", 0.0)
            p_prot = p_nut.get("protein_g", 0.0)
            if p_prot > t_prot:
                diff_prot = p_prot - t_prot
                score += 2.0
                reasons.append(f"+{round(diff_prot, 1)}g higher protein")

            # Sodium improvement
            t_sod = t_nut.get("sodium_mg", 0.0)
            p_sod = p_nut.get("sodium_mg", 0.0)
            if p_sod < t_sod and (t_sod - p_sod) >= 50:
                score += 2.0
                reasons.append(f"{round(t_sod - p_sod)}mg lower sodium")

            # Check preference compliance if preferences supplied
            if preferences:
                pref_eval = self.evaluate_product_preferences(p, preferences)
                score += (pref_eval["suitability_score"] / 20.0)
                if pref_eval["status"] == "EXCELLENT_MATCH":
                    reasons.append("Matches your saved dietary preferences")

            if reasons and score > 4.0:
                cand_copy = dict(p)
                cand_copy["alternative_score"] = round(score, 2)
                cand_copy["recommendation_reasons"] = reasons
                cand_copy["primary_advantage"] = reasons[0] if reasons else "Nutritionally balanced"
                scored_candidates.append(cand_copy)

        scored_candidates.sort(key=lambda x: x["alternative_score"], reverse=True)
        return scored_candidates[:3]

    def compare_products(self, products: List[Dict[str, Any]], preferences: Optional[DietaryPreferences] = None, user_goal: str = "Healthiest Overall") -> Dict[str, Any]:
        """
        Deep comparison of 2 or 3 products side-by-side with delta analysis, charts data, and evidence-grounded recommendation.
        """
        if not products:
            return {}

        nutrients_tracked = [
            {"key": "calories", "name": "Calories", "unit": "kcal", "lower_is_better": True},
            {"key": "sugars_g", "name": "Sugars", "unit": "g", "lower_is_better": True},
            {"key": "added_sugars_g", "name": "Added Sugars", "unit": "g", "lower_is_better": True},
            {"key": "fiber_g", "name": "Fiber", "unit": "g", "lower_is_better": False},
            {"key": "protein_g", "name": "Protein", "unit": "g", "lower_is_better": False},
            {"key": "saturated_fat_g", "name": "Saturated Fat", "unit": "g", "lower_is_better": True},
            {"key": "sodium_mg", "name": "Sodium", "unit": "mg", "lower_is_better": True},
        ]

        # Standardize nutrition
        product_summaries = []
        for p in products:
            nut = p.get("nutrition_per_serving") or p.get("nutrition_per_100g", {})
            if isinstance(nut, NutritionFacts):
                nut = nut.dict()
            
            pref_eval = self.evaluate_product_preferences(p, preferences) if preferences else {"suitability_score": 75, "conflicts": []}
            
            product_summaries.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "brand": p.get("brand"),
                "image_url": p.get("image_url"),
                "serving_description": p.get("serving_description", "1 serving"),
                "nutrition": nut,
                "ingredients_count": len(p.get("ingredients_list", [])),
                "declared_allergens": p.get("declared_allergens", []),
                "suitability_score": pref_eval["suitability_score"],
                "preference_conflicts": pref_eval["conflicts"],
                "data_quality_score": p.get("data_quality_score", 90.0)
            })

        # Matrix for charts and tables
        matrix = []
        for n in nutrients_tracked:
            row = {
                "nutrient": n["name"],
                "unit": n["unit"],
                "values": {}
            }
            vals = []
            for p in product_summaries:
                val = p["nutrition"].get(n["key"], 0.0)
                row["values"][p["id"]] = val
                vals.append((val, p["id"]))
            
            # Identify best value for this nutrient
            if n["lower_is_better"]:
                best = min(vals, key=lambda x: x[0])
            else:
                best = max(vals, key=lambda x: x[0])
            row["best_product_id"] = best[1]
            matrix.append(row)

        # Determine winner based on user goal
        winner = None
        winner_score = -9999.0
        reasons = []

        for p in product_summaries:
            score = 0.0
            nut = p["nutrition"]
            
            if user_goal == "Lowest Sugar":
                score = 100.0 - (nut.get("sugars_g", 0.0) * 5.0)
            elif user_goal == "High Protein":
                score = (nut.get("protein_g", 0.0) * 8.0) - (nut.get("sugars_g", 0.0) * 2.0)
            elif user_goal == "Lowest Sodium":
                score = 100.0 - (nut.get("sodium_mg", 0.0) / 5.0)
            elif user_goal == "Cleanest Ingredients":
                score = (100.0 - (p["ingredients_count"] * 2.5)) + (p["suitability_score"] * 0.5)
            else:  # Healthiest Overall
                score = (
                    (nut.get("protein_g", 0.0) * 4.0) +
                    (nut.get("fiber_g", 0.0) * 6.0) -
                    (nut.get("sugars_g", 0.0) * 4.0) -
                    (nut.get("saturated_fat_g", 0.0) * 5.0) -
                    (nut.get("sodium_mg", 0.0) / 40.0) +
                    (p["suitability_score"] * 0.3)
                )

            if score > winner_score:
                winner_score = score
                winner = p

        # Build transparent explanation
        if winner:
            other = [p for p in product_summaries if p["id"] != winner["id"]]
            if other:
                w_nut = winner["nutrition"]
                o_nut = other[0]["nutrition"]
                w_sug = w_nut.get("sugars_g", 0.0)
                o_sug = o_nut.get("sugars_g", 0.0)
                w_fib = w_nut.get("fiber_g", 0.0)
                o_fib = o_nut.get("fiber_g", 0.0)

                if w_sug < o_sug:
                    reasons.append(f"{round(o_sug - w_sug, 1)}g less sugar per serving")
                if w_fib > o_fib:
                    reasons.append(f"{round(w_fib - o_fib, 1)}g more dietary fiber")
                if winner["suitability_score"] >= 80:
                    reasons.append(f"High preference alignment ({winner['suitability_score']}% match)")
                if len(winner["preference_conflicts"]) == 0:
                    reasons.append("Zero personal dietary or allergen conflicts")

        return {
            "products": product_summaries,
            "comparison_matrix": matrix,
            "user_goal": user_goal,
            "winner_id": winner["id"] if winner else None,
            "winner_name": winner["name"] if winner else None,
            "winner_brand": winner["brand"] if winner else None,
            "recommendation_rationale": (
                f"Selected as top match for '{user_goal}'. Key factors: " + "; ".join(reasons)
                if reasons else f"Selected as top match for {user_goal} based on overall nutritional balance."
            )
        }

    def calculate_custom_serving(self, product: Dict[str, Any], target_size: float, target_unit: str) -> Dict[str, Any]:
        """
        Recalculates nutrient amounts for an arbitrary portion size with unit conversions.
        """
        base_size = product.get("serving_size", 100.0)
        base_unit = product.get("serving_unit", "g").lower()
        base_nut = product.get("nutrition_per_serving") or product.get("nutrition_per_100g", {})
        if isinstance(base_nut, NutritionFacts):
            base_nut = base_nut.dict()

        # Convert target to base units if needed (approximate conversions for typical food densities)
        scale_factor = 1.0
        if target_unit.lower() == base_unit:
            scale_factor = target_size / max(1.0, base_size)
        elif target_unit.lower() == "oz" and base_unit == "g":
            scale_factor = (target_size * 28.3495) / max(1.0, base_size)
        elif target_unit.lower() == "serving":
            scale_factor = target_size
        else:
            scale_factor = target_size / max(1.0, base_size)

        scaled_nutrition = {}
        for k, v in base_nut.items():
            if isinstance(v, (int, float)):
                scaled_nutrition[k] = round(v * scale_factor, 1)
            else:
                scaled_nutrition[k] = v

        return {
            "product_id": product.get("id"),
            "product_name": product.get("name"),
            "target_serving_size": target_size,
            "target_serving_unit": target_unit,
            "scale_factor": round(scale_factor, 3),
            "calculated_nutrition": scaled_nutrition,
            "base_serving": f"{base_size} {base_unit}"
        }

    def detect_formulation_changes(self, current: Dict[str, Any], historical: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identifies supported formulation changes between product versions:
        changes in ingredients, allergens, nutrition values, or serving size.
        """
        curr_nut = current.get("nutrition_per_serving", {})
        hist_nut = historical.get("nutrition_per_serving", {})
        if isinstance(curr_nut, NutritionFacts): curr_nut = curr_nut.dict()
        if isinstance(hist_nut, NutritionFacts): hist_nut = hist_nut.dict()

        nutrition_deltas = []
        for key in ["calories", "sugars_g", "sodium_mg", "protein_g", "fiber_g", "saturated_fat_g"]:
            c_val = curr_nut.get(key, 0.0)
            h_val = hist_nut.get(key, 0.0)
            if abs(c_val - h_val) > 0.1:
                nutrition_deltas.append({
                    "nutrient": key,
                    "previous": h_val,
                    "current": c_val,
                    "diff": round(c_val - h_val, 1)
                })

        curr_ing = set([i.lower().strip() for i in current.get("ingredients_raw", "").split(",")])
        hist_ing = set([i.lower().strip() for i in historical.get("ingredients_raw", "").split(",")])

        added_ingredients = list(curr_ing - hist_ing)
        removed_ingredients = list(hist_ing - curr_ing)

        curr_all = set(current.get("declared_allergens", []))
        hist_all = set(historical.get("declared_allergens", []))
        allergen_changes = {
            "added": list(curr_all - hist_all),
            "removed": list(hist_all - curr_all)
        }

        has_changes = bool(nutrition_deltas or added_ingredients or removed_ingredients or allergen_changes["added"] or allergen_changes["removed"])

        return {
            "has_formulation_changes": has_changes,
            "previous_version": historical.get("formulation_version", "1.0"),
            "current_version": current.get("formulation_version", "2.0"),
            "previous_date": historical.get("last_reformulation_date", "2024-01-15"),
            "current_date": current.get("last_reformulation_date", "2025-06-20"),
            "nutrition_deltas": nutrition_deltas,
            "added_ingredients": added_ingredients[:5],
            "removed_ingredients": removed_ingredients[:5],
            "allergen_changes": allergen_changes
        }

recommendation_service = RecommendationService()
