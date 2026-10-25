import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Bookmark, 
  ShieldAlert, 
  ShieldCheck, 
  Calculator, 
  History, 
  Sparkles, 
  BookOpen, 
  Star, 
  ThumbsUp, 
  CheckCircle2, 
  AlertTriangle,
  Scale,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Layers,
  Heart
} from 'lucide-react';
import { api } from '../api';
import { ProductIntelligence, UserProfile } from '../types';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
  user: UserProfile | null;
  onNavigateProduct: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  isCompared: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
  user,
  onNavigateProduct,
  onToggleCompare,
  isCompared
}) => {
  const [data, setData] = useState<ProductIntelligence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Serving size calculator state (Feature #8)
  const [customServingSize, setCustomServingSize] = useState<number>(100);
  const [customServingUnit, setCustomServingUnit] = useState<string>('g');
  const [scaledNutrition, setScaledNutrition] = useState<any>(null);
  const [isCalculatingServing, setIsCalculatingServing] = useState<boolean>(false);

  // Formulation changes state (Feature #7)
  const [formulationChanges, setFormulationChanges] = useState<any>(null);
  const [showFormulationModal, setShowFormulationModal] = useState<boolean>(false);

  // Collections state (Feature #11)
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Feedback state (Feature #15)
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  useEffect(() => {
    loadProductIntelligence();
  }, [productId]);

  const loadProductIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProductIntelligence(productId);
      setData(res);
      setCustomServingSize(res.product.serving_size || 100);
      setCustomServingUnit(res.product.serving_unit || 'g');
      setScaledNutrition(res.product.nutrition_per_serving);

      // Check formulation changes
      const fRes = await api.getFormulationChanges(productId);
      setFormulationChanges(fRes);
    } catch (err: any) {
      setError(err.message || "Failed to load product intelligence");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateServing = async (size: number, unit: string) => {
    setCustomServingSize(size);
    setCustomServingUnit(unit);
    try {
      setIsCalculatingServing(true);
      const res = await api.calculateServing(productId, size, unit);
      setScaledNutrition(res.calculated_nutrition);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingServing(false);
    }
  };

  const handleSaveToCollection = async (collectionName = 'Favorites') => {
    try {
      await api.saveToCollection(productId, collectionName);
      setIsSaved(true);
      setSaveToast(`Saved to ${collectionName}!`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackComment.trim()) return;
    try {
      await api.submitFeedback({
        item_type: 'ingredient_explanation',
        item_id: productId,
        rating,
        comment: feedbackComment
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--cream-300)', borderTopColor: 'var(--forest-700)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '1rem', color: 'var(--forest-900)' }}>Synthesizing Deep Product Intelligence...</h3>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>Analyzing NLP ingredient categories & cross-checking allergens</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }} className="card">
        <AlertTriangle size={36} color="var(--orange-600)" style={{ margin: '0 auto 1rem' }} />
        <h3>Failed to load product details</h3>
        <p style={{ color: 'var(--slate-600)', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button onClick={onBack} className="btn btn-primary">Return to Catalog</button>
      </div>
    );
  }

  const { product, allergen_crosscheck, preference_match, smart_alternatives, data_quality_report } = data;
  const nut = scaledNutrition || product.nutrition_per_serving;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          onClick={onBack}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Compare toggle */}
          <button
            onClick={() => onToggleCompare(product.id)}
            className="btn btn-secondary"
            style={{ 
              backgroundColor: isCompared ? 'var(--orange-100)' : 'var(--white)',
              color: isCompared ? 'var(--orange-700)' : 'var(--slate-700)',
              borderColor: isCompared ? 'var(--orange-400)' : 'var(--slate-200)',
              fontSize: '0.85rem',
              padding: '0.45rem 0.85rem'
            }}
          >
            <Layers size={16} />
            {isCompared ? 'Queued in Compare' : 'Add to Compare'}
          </button>

          {/* Save to Favorites */}
          <button
            onClick={() => handleSaveToCollection('Favorites')}
            className="btn btn-secondary"
            style={{ 
              backgroundColor: isSaved ? 'var(--forest-100)' : 'var(--white)',
              color: isSaved ? 'var(--forest-800)' : 'var(--slate-700)',
              fontSize: '0.85rem',
              padding: '0.45rem 0.85rem'
            }}
          >
            <Bookmark size={16} />
            {isSaved ? 'Saved to Favorites' : 'Save Product'}
          </button>

          {/* Add to Shopping List */}
          <button
            onClick={() => handleSaveToCollection('Shopping List')}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
          >
            <Heart size={16} /> Add to Shopping List
          </button>

          {/* Downloadable PDF Report (Feature #12) */}
          <a
            href={api.getPdfReportUrl(product.id)}
            download
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem', textDecoration: 'none' }}
          >
            <Download size={16} />
            Download PDF Report (Feature #12)
          </a>
        </div>
      </div>

      {saveToast && (
        <div style={{
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success-text)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--success-border)',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          ✓ {saveToast}
        </div>
      )}

      {/* Hero Product Banner */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '2rem', alignItems: 'center' }}>
          <img 
            src={product.image_url} 
            alt={product.name}
            style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-forest">{product.category}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Barcode: {product.barcode}</span>
              
              {/* Formulation Change Badge (Feature #7) */}
              {formulationChanges?.has_formulation_changes && (
                <button
                  onClick={() => setShowFormulationModal(true)}
                  className="badge badge-orange"
                  style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <History size={12} /> Formulation Changed (v{formulationChanges.current_version})
                </button>
              )}
            </div>

            <h1 style={{ fontSize: '2rem', color: 'var(--forest-900)', marginBottom: '0.35rem' }}>
              {product.name}
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--forest-700)', fontWeight: 600, marginBottom: '0.75rem' }}>
              {product.brand}
            </p>

            {/* AI Data Quality & Provenance Indicator (Feature #14) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--forest-700)' }}>
                <ShieldCheck size={16} /> AI Confidence: {product.data_quality_score}%
              </span>
              <span>•</span>
              <span>Data Provenance: {data_quality_report.provenance}</span>
              <span>•</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                {data_quality_report.action_required}
              </span>
            </div>
          </div>

          {/* Preference Suitability Score Ring */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            backgroundColor: preference_match.status === 'EXCELLENT_MATCH' ? 'var(--forest-50)' : preference_match.status === 'STRONG_CONFLICT' ? 'var(--danger-bg)' : 'var(--cream-100)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${preference_match.status === 'EXCELLENT_MATCH' ? 'var(--forest-400)' : preference_match.status === 'STRONG_CONFLICT' ? 'var(--danger-border)' : 'var(--cream-300)'}`,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: preference_match.status === 'EXCELLENT_MATCH' ? 'var(--forest-700)' : preference_match.status === 'STRONG_CONFLICT' ? 'var(--danger-text)' : 'var(--orange-700)'
            }}>
              {preference_match.suitability_score}%
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-700)' }}>
              {preference_match.status.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              Against Your Profile
            </div>
          </div>
        </div>
      </div>

      {/* ALLERGEN CROSS-CHECK ALERT SECTION (Feature #3) */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderLeft: '5px solid var(--orange-600)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <ShieldAlert size={22} color="var(--orange-600)" />
          <h3 style={{ fontSize: '1.2rem' }}>Allergen Cross-Check & Advisory (Feature #3)</h3>
          <span className="badge badge-orange">Distinguishes Confirmed Label vs Hidden OCR</span>
        </div>

        {allergen_crosscheck.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {allergen_crosscheck.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.warning_level === 'HIGH' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                  border: `1px solid ${item.warning_level === 'HIGH' ? 'var(--danger-border)' : 'var(--warning-border)'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: item.warning_level === 'HIGH' ? 'var(--danger-text)' : 'var(--warning-text)'
                    }}>
                      {item.allergen}
                    </span>
                    <span className="badge" style={{
                      backgroundColor: item.warning_level === 'HIGH' ? '#fecaca' : '#fef08a',
                      color: item.warning_level === 'HIGH' ? '#991b1b' : '#854d0e',
                      fontSize: '0.7rem'
                    }}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', lineHeight: 1.4 }}>
                    {item.explanation}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    <b>Evidence Origin:</b> {item.source_text} (Confidence: {Math.round(item.confidence * 100)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--forest-700)', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            No major declared allergens identified in extracted text.
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Nutrition & Ingredients */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.75rem', alignItems: 'start', marginBottom: '2rem' }}>
        {/* COLUMN 1: NUTRITION FACTS & SERVING SIZE CALCULATOR (Feature #8) */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Nutrition Facts</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>FDA Standard</span>
          </div>

          {/* Interactive Serving-Size Calculator Widget (Feature #8) */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--cream-100)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--cream-300)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Calculator size={16} color="var(--forest-700)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--forest-900)' }}>
                Serving-Size Calculator (Feature #8)
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
              Dynamic portion scaling with transparent unit conversions.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                value={customServingSize}
                onChange={(e) => handleCalculateServing(Number(e.target.value), customServingUnit)}
                style={{
                  width: '80px',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />
              <select
                value={customServingUnit}
                onChange={(e) => handleCalculateServing(customServingSize, e.target.value)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--white)'
                }}
              >
                <option value="g">grams (g)</option>
                <option value="ml">milliliters (ml)</option>
                <option value="oz">ounces (oz)</option>
                <option value="serving">servings</option>
              </select>
            </div>

            {/* Quick portion buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
              {[
                { label: '50g', size: 50, unit: 'g' },
                { label: '100g (Std)', size: 100, unit: 'g' },
                { label: '1 Serving', size: 1, unit: 'serving' },
                { label: '2 Servings', size: 2, unit: 'serving' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCalculateServing(p.size, p.unit)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--slate-300)',
                    backgroundColor: customServingSize === p.size && customServingUnit === p.unit ? 'var(--forest-subtle)' : 'var(--white)',
                    color: '#000000',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scaled Nutrition Facts Box */}
          <div style={{
            border: '2px solid var(--slate-900)',
            padding: '0.75rem',
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>Nutrition Facts</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', borderBottom: '6px solid var(--slate-900)', paddingBottom: '4px' }}>
              Serving amount: {customServingSize} {customServingUnit}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '3px solid var(--slate-900)', padding: '6px 0' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Calories</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>{intOrZero(nut.calories)}</span>
            </div>

            <div style={{ fontSize: '0.75rem', textAlign: 'right', fontWeight: 700, borderBottom: '1px solid var(--slate-300)', padding: '3px 0' }}>
              % Daily Value*
            </div>

            {[
              { label: 'Total Fat', val: `${nut.fat_total_g}g`, bold: true },
              { label: '  Saturated Fat', val: `${nut.saturated_fat_g}g`, indent: true },
              { label: 'Cholesterol', val: `${nut.cholesterol_mg}mg`, bold: true },
              { label: 'Sodium', val: `${intOrZero(nut.sodium_mg)}mg`, bold: true, alert: nut.sodium_mg > (user?.preferences?.max_sodium_mg || 250) },
              { label: 'Total Carbohydrate', val: `${nut.carbohydrates_g}g`, bold: true },
              { label: '  Dietary Fiber', val: `${nut.fiber_g}g`, indent: true, good: nut.fiber_g >= 3 },
              { label: '  Total Sugars', val: `${nut.sugars_g}g`, indent: true, alert: nut.sugars_g > (user?.preferences?.max_sugar_g || 10) },
              { label: '    Includes Added Sugars', val: `${nut.added_sugars_g}g`, indentDouble: true },
              { label: 'Protein', val: `${nut.protein_g}g`, bold: true, good: nut.protein_g >= 5 },
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--slate-200)',
                  fontSize: '0.85rem',
                  fontWeight: row.bold ? 700 : 400,
                  paddingLeft: row.indentDouble ? '1.5rem' : row.indent ? '0.75rem' : '0',
                  color: row.alert ? 'var(--orange-700)' : row.good ? 'var(--forest-700)' : 'inherit'
                }}
              >
                <span>{row.label}</span>
                <span>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: AI INGREDIENT UNDERSTANDING & EVIDENCE TABLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Preference Goal Matching Card (Feature #4) */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Scale size={20} color="var(--forest-700)" />
              <h3 style={{ fontSize: '1.15rem' }}>Personalized Preference & Watchlist Evaluation (Feature #4)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Conflicts */}
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.4rem' }}>
                  Threshold Warnings & Conflicts:
                </div>
                {preference_match.conflicts.length > 0 ? (
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--orange-800)' }}>
                    {preference_match.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--forest-700)', fontWeight: 600 }}>
                    ✓ No conflicting ingredients or threshold breaches
                  </span>
                )}
              </div>

              {/* Highlights */}
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--forest-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-900)', marginBottom: '0.4rem' }}>
                  Positive Matches & Highlights:
                </div>
                {preference_match.positive_highlights.length > 0 ? (
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--forest-800)' }}>
                    {preference_match.positive_highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>Standard grocery profile</span>
                )}
              </div>
            </div>
          </div>

          {/* AI INGREDIENT LIST TABLE */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>AI Ingredient Understanding & Evidence</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  Normalized ingredients, functional categories, and scientific evidence references.
                </p>
              </div>
              <span className="badge badge-forest">{product.ingredients_list?.length || 0} Ingredients Detected</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(product.ingredients_list || []).map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    backgroundColor: 'var(--white)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest-900)' }}>
                        {ing.clean_name || ing.name}
                      </span>
                      <span className="badge badge-forest" style={{ fontSize: '0.65rem' }}>
                        {ing.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                      Confidence: {Math.round(ing.confidence * 100)}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', lineHeight: 1.45, marginBottom: '0.4rem' }}>
                    {ing.explanation}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    <span><b>Evidence Citation:</b> {ing.evidence_source}</span>
                    {ing.synonyms?.length > 0 && (
                      <span><b>Synonyms:</b> {ing.synonyms.join(', ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SMART ALTERNATIVE RECOMMENDATIONS (Feature #5) */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', borderTop: '4px solid var(--forest-600)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={20} color="var(--forest-700)" />
              <h3 style={{ fontSize: '1.3rem' }}>Smart Alternative Recommendations (Feature #5)</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
              Similar packaged food alternatives ranked by category, nutrition optimization, and your preferences.
            </p>
          </div>
          <span className="badge badge-forest">Evidence-Based Reasons</span>
        </div>

        {smart_alternatives && smart_alternatives.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {smart_alternatives.map((alt) => (
              <div
                key={alt.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--forest-500)',
                  backgroundColor: 'var(--forest-50)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img 
                    src={alt.image_url} 
                    alt={alt.name} 
                    style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--forest-700)', fontWeight: 600 }}>{alt.brand}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--forest-900)' }}>{alt.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{alt.category}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-800)', marginBottom: '0.25rem' }}>
                    Why this is recommended:
                  </div>
                  <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--slate-700)' }}>
                    {alt.recommendation_reasons.map((r, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{r}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onNavigateProduct(alt.id)}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem', fontSize: '0.8rem', width: '100%' }}
                >
                  Inspect Alternative <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            No immediate alternative foods found in this exact category.
          </p>
        )}
      </div>

      {/* RECOMMENDATION FEEDBACK & EVALUATION WIDGET (Feature #15) */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--cream-100)', border: '1px solid var(--cream-300)' }}>
        <h4 style={{ fontSize: '1rem', color: 'var(--forest-900)', marginBottom: '0.35rem' }}>
          Evaluate Explanation & Recommendations (Feature #15)
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
          Help evaluate and benchmark future model versions by rating the accuracy and plain-language clarity of this analysis.
        </p>

        {feedbackSubmitted ? (
          <div style={{ color: 'var(--forest-800)', fontWeight: 700, fontSize: '0.875rem' }}>
            ✓ Thank you! Your evaluation review has been logged to the research benchmark dataset.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: star <= rating ? 'var(--orange-500)' : 'var(--slate-300)',
                    padding: '2px'
                  }}
                >
                  <Star size={18} fill={star <= rating ? 'var(--orange-500)' : 'none'} />
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Share feedback on explanations or suggest corrections..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.85rem'
                }}
              />
              <button
                onClick={handleSubmitFeedback}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Submit Review
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Formulation Change Details Modal (Feature #7) */}
      {showFormulationModal && formulationChanges && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Formulation Change Tracker (Feature #7)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
              Detected changes between <b>v{formulationChanges.previous_version} ({formulationChanges.previous_date})</b> and <b>v{formulationChanges.current_version} ({formulationChanges.current_date})</b>:
            </p>

            {formulationChanges.nutrition_deltas?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Nutrient Changes:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                  {formulationChanges.nutrition_deltas.map((d: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.5rem', backgroundColor: 'var(--cream-100)', borderRadius: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{d.nutrient.replace('_', ' ')}</span>
                      <span>
                        {d.previous} → <b>{d.current}</b> ({d.diff > 0 ? `+${d.diff}` : d.diff})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowFormulationModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Close Snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function intOrZero(val: any): number {
  return typeof val === 'number' ? Math.round(val) : 0;
}
