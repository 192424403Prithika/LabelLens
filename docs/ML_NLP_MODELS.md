# LabelLens — Machine Learning & Natural Language Processing Models

**Specification Version:** 1.0.0  
**Domains Covered:** Ingredient Taxonomy Classification, Regulatory Evidence Retrieval, and Semantic Vector Matching.

---

## 1. Regulatory Ingredient Classification Engine

The NLP parser (`backend/services/nlp_service.py`) maps raw text extractions to an explicit 10-class regulatory taxonomy:

1. **Sweeteners**: Cane Sugar, High Fructose Corn Syrup, Sucralose, Stevia, Aspartame, Maltodextrin.
2. **Preservatives**: Sodium Benzoate, Potassium Sorbate, Calcium Propionate, BHT, Sodium Nitrite.
3. **Emulsifiers & Stabilizers**: Soy Lecithin, Mono- and Diglycerides, Polysorbate 80, Xanthan Gum.
4. **Leavening Agents**: Sodium Bicarbonate (Baking Soda), Monocalcium Phosphate, Ammonium Carbonate.
5. **Colorants**: Titanium Dioxide, Red 40, Yellow 5, Caramel Color, Beet Juice Extract.
6. **Flavor Enhancers & Additives**: Monosodium Glutamate (MSG), Disodium Inosinate, Natural & Artificial Flavors.
7. **Thickeners & Gelling Agents**: Guar Gum, Carrageenan, Pectin, Modified Food Starch.
8. **Vitamins & Minerals**: Ferrous Sulfate, Niacinamide, Folic Acid, Ascorbic Acid (Vitamin C).
9. **Whole Foods**: Whole Wheat Flour, Rolled Oats, Cane Sugar, Sea Salt, Cocoa Butter.
10. **Other / Unclassified**: Novel ingredients flagged as `needs_review: true`.

---

## 2. Regulatory Evidence Grounding

Every classified ingredient includes citations from verified public food authorities:
- **US Food and Drug Administration (FDA)**: Title 21 Code of Federal Regulations (`21 CFR §182 / §184 - GRAS: Generally Recognized As Safe`).
- **European Food Safety Authority (EFSA)**: E-Number Directives (e.g., E322 Lecithins, E211 Sodium Benzoate, E500 Carbonates).

---

## 3. Semantic Vector Similarity (`all-MiniLM-L6-v2`)

To match user ingredient watchlists against packaging synonyms that differ in phrasing (e.g. `"Palm Kernel Oil"` vs. `"Fractionated Palm Oil"`, or `"Dextrose"` vs. `"Corn Sugar"`):

1. **Embedding Generation**: Ingests normalized tokens into `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense float vectors.
2. **Vector Similarity Metric**:
   $$\text{Cosine Similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$
3. **Hybrid Decision Boundary**:
   - $\text{Similarity} \ge 0.88$: High-certainty semantic synonym match.
   - $0.72 \le \text{Similarity} < 0.88$: Flagged as `POSSIBLE_MATCH` with warning.
   - $\text{Similarity} < 0.72$: Excluded to prevent false-positive allergen alarms.

---

## 4. Benchmark & Evaluation Metrics

The evaluation module (`backend/routes/evaluation.py` and `evaluation_service.py`) reports reproducible benchmarks:
- **Exact String vs. Semantic Embedding Matching**: Measures Precision, Recall, and F1.
- **NDCG@3**: Normalized Discounted Cumulative Gain evaluating recommendation relevance across user dietary goals.
- **Inference Latency**: Average elapsed CPU time per text segment.
