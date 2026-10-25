export interface NutritionFacts {
  calories: number;
  protein_g: number;
  fat_total_g: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  carbohydrates_g: number;
  sugars_g: number;
  added_sugars_g: number;
  fiber_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  calcium_mg?: number;
  iron_mg?: number;
  potassium_mg?: number;
}

export interface IngredientDetail {
  name: string;
  clean_name: string;
  category: string;
  explanation: string;
  evidence_source: string;
  confidence: number;
  is_uncertain: boolean;
  synonyms: string[];
  allergen_potential?: string | null;
  health_notes?: string | null;
}

export interface AllergenCheckItem {
  allergen: string;
  status: 'DECLARED' | 'POSSIBLE_MATCH' | 'CROSS_CONTAMINATION_RISK' | 'SAFE';
  source_text: string;
  confidence: number;
  warning_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  explanation: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  serving_size: number;
  serving_unit: string;
  serving_description: string;
  servings_per_container?: number;
  nutrition_per_serving: NutritionFacts;
  nutrition_per_100g: NutritionFacts;
  ingredients_raw: string;
  ingredients_list: IngredientDetail[];
  declared_allergens: string[];
  may_contain_allergens: string[];
  formulation_version: string;
  last_reformulation_date?: string;
  formulation_history?: any[];
  data_quality_score: number;
  provenance?: string;
  created_at?: string;
}

export interface DietaryPreferences {
  diet: string[];
  allergens_to_avoid: string[];
  avoid_ingredients: string[];
  monitor_ingredients: string[];
  find_ingredients: string[];
  max_sugar_g: number | null;
  max_sodium_mg: number | null;
  max_sat_fat_g: number | null;
  min_protein_g: number | null;
  min_fiber_g: number | null;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  preferences: DietaryPreferences;
  created_at: string;
}

export interface ScanRecord {
  id: string;
  user_id: string;
  original_filename?: string;
  image_url: string;
  preprocessed_image_url?: string;
  raw_ocr_text: string;
  ocr_confidence: number;
  ocr_word_count: number;
  data_quality_index: number;
  uncertain_fields: string[];
  extracted_product_name: string;
  extracted_brand: string;
  serving_size: number;
  serving_unit: string;
  serving_description: string;
  nutrition_per_serving: NutritionFacts;
  ingredients_raw: string;
  ingredients_list: IngredientDetail[];
  declared_allergens: string[];
  may_contain_allergens: string[];
  status: string;
  corrections_made: boolean;
  product_id?: string;
  created_at: string;
}

export interface PreferenceEvaluation {
  status: 'EXCELLENT_MATCH' | 'COMPLIANT' | 'CAUTION' | 'STRONG_CONFLICT';
  suitability_score: number;
  conflicts: string[];
  warnings: string[];
  positive_highlights: string[];
  watchlist_matches: Array<{
    type: 'avoid' | 'monitor' | 'find';
    item: string;
    matched_with: string;
    score: number;
  }>;
  threshold_evaluations: Array<{
    field: string;
    status: 'MATCH' | 'CONFLICT' | 'BELOW_TARGET';
    actual: number;
    target: number;
    unit: string;
  }>;
}

export interface ProductIntelligence {
  product: Product;
  allergen_crosscheck: AllergenCheckItem[];
  preference_match: PreferenceEvaluation;
  smart_alternatives: Array<Product & { alternative_score: number; recommendation_reasons: string[]; primary_advantage: string }>;
  data_quality_report: {
    overall_confidence_percent: number;
    is_manually_verified: boolean;
    missing_fields: string[];
    provenance: string;
    action_required: string;
  };
}

export interface ComparisonResult {
  products: Array<{
    id: string;
    name: string;
    brand: string;
    image_url: string;
    serving_description: string;
    nutrition: NutritionFacts;
    ingredients_count: number;
    declared_allergens: string[];
    suitability_score: number;
    preference_conflicts: string[];
    data_quality_score: number;
  }>;
  comparison_matrix: Array<{
    nutrient: string;
    unit: string;
    values: Record<string, number>;
    best_product_id: string;
  }>;
  user_goal: string;
  winner_id: string;
  winner_name: string;
  winner_brand: string;
  recommendation_rationale: string;
}

export interface EvaluationMetrics {
  total_benchmark_samples: number;
  ocr_metrics: {
    without_preprocessing: { cer_percent: number; wer_percent: number; character_accuracy: number };
    with_preprocessing: { cer_percent: number; wer_percent: number; character_accuracy: number };
    cer_relative_reduction_percent: number;
  };
  nutrition_extraction_accuracy_percent: number;
  recommendation_ndcg_at_3: number;
  matching_approach_comparison: {
    exact_matching: { precision: number; recall: number; f1_score: number; note: string };
    semantic_embedding_matching: { precision: number; recall: number; f1_score: number; note: string };
  };
  sample_results: Array<{
    product: string;
    raw_cer: number;
    preprocessed_cer: number;
    cer_improvement: number;
    ndcg_at_3: number;
  }>;
  latency_benchmarks_ms: {
    image_preprocessing: number;
    ocr_inference: number;
    ingredient_nlp_parsing: number;
    semantic_search: number;
    end_to_end_pipeline: number;
  };
}
