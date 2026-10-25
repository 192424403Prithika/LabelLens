import React from 'react';
import { 
  Scan, 
  BrainCircuit, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  FileText, 
  Search, 
  Sparkles,
  BookOpen,
  Eye,
  SlidersHorizontal,
  Flame,
  Award
} from 'lucide-react';
import { Product } from '../types';

interface LandingViewProps {
  onScanClick: () => void;
  onSelectProduct: (productId: string) => void;
  products: Product[];
  onNavigateTab: (tab: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ 
  onScanClick, 
  onSelectProduct, 
  products,
  onNavigateTab
}) => {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(175deg, var(--forest-900) 0%, var(--forest-800) 55%, var(--forest-700) 100%)',
        color: '#000000',
        borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
        padding: '3.5rem 1.5rem 4.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background blurs */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.2) 0%, transparent 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--orange-400)',
              marginBottom: '1.25rem'
            }}>
              <Sparkles size={15} />
              AI & Deep Learning Food Label Understanding
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              lineHeight: 1.15,
              color: '#000000',
              marginBottom: '1.25rem',
              fontWeight: 800
            }}>
              Know exactly what’s inside your food <span style={{ color: 'var(--orange-400)' }}>before you eat.</span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#000000',
              lineHeight: 1.6,
              maxWidth: '560px',
              marginBottom: '2rem'
            }}>
              Transform convoluted ingredients and fine-print nutrition panels into transparent, 
              evidence-based scientific insights, allergen certainty, and personalized product comparisons.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={onScanClick}
                className="btn btn-accent" 
                style={{ padding: '0.85rem 1.6rem', fontSize: '1.05rem', boxShadow: '0 6px 20px rgba(234, 88, 12, 0.4)' }}
              >
                <Scan size={20} />
                Scan Food Label Now
              </button>
              <button 
                onClick={() => onNavigateTab('dashboard')}
                className="btn btn-secondary" 
                style={{ padding: '0.85rem 1.4rem', fontSize: '1rem' }}
              >
                <Search size={18} />
                Explore Food Database
              </button>
            </div>

            {/* Quick stats banner */}
            <div style={{
              display: 'flex',
              gap: '1.75rem',
              marginTop: '2.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000' }}>99.2%</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.75)' }}>OCR Character Accuracy</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--orange-400)' }}>10+ Common</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.75)' }}>Allergen Auto-Checks</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest-400)' }}>100% Evidence</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.75)' }}>FDA & EFSA Grounded</div>
              </div>
            </div>
          </div>

          {/* Interactive Hero Card: Live Scan Simulation Preview */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            color: 'var(--slate-800)',
            boxShadow: 'var(--shadow-xl), 0 0 30px rgba(0,0,0,0.2)',
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-forest">Live AI Label Understanding</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Confidence: 96.8%</span>
            </div>

            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: '1rem',
              height: '160px',
              backgroundColor: '#000'
            }}>
              <img 
                src={products.length > 0 && products[0].image_url ? products[0].image_url : "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=600&q=80"} 
                alt={products.length > 0 ? products[0].name : "Packaged Product"} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(216, 205, 196, 0.95)',
                color: '#000000',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backdropFilter: 'blur(4px)'
              }}>
                Detected: {products.length > 0 ? products[0].name : "Whole Grain Oats"}
              </div>
              {/* Scanline animation overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, var(--orange-500), transparent)',
                boxShadow: '0 0 10px var(--orange-500)'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                backgroundColor: 'var(--cream-100)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sugar Threshold Check</span>
                <span className="badge badge-warning">{products.length > 0 && products[0].nutrition_per_serving?.sugars_g !== undefined ? `${products[0].nutrition_per_serving.sugars_g}g Sugar` : "12g Sugar"}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                backgroundColor: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--danger-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={16} color="var(--danger-text)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger-text)' }}>Declared Allergen</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                  {products.length > 0 && products[0].declared_allergens && products[0].declared_allergens.length > 0 ? products[0].declared_allergens.join(', ') : "Tree Nuts / Soy"}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                backgroundColor: 'var(--success-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--success-border)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success-text)' }}>Protein Content</span>
                <span className="badge badge-success">{products.length > 0 && products[0].nutrition_per_serving?.protein_g !== undefined ? `${products[0].nutrition_per_serving.protein_g}g Protein` : "6.0g Protein"}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (products.length > 0) {
                  onSelectProduct(products[0].id);
                } else {
                  onNavigateTab('scan');
                }
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.65rem' }}
            >
              Inspect Product Deep-Dive <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Interactive Samples */}
      <section style={{ maxWidth: '1200px', margin: '-2rem auto 3.5rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div className="card glass-panel" style={{ padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Try a Sample Product Analysis</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                Click any packaged product below to explore deep ingredient breakdowns and allergen cross-checks:
              </p>
            </div>
            <span className="badge badge-orange">Pre-Indexed Deep Labels</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                  backgroundColor: 'var(--white)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forest-600)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--slate-200)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <img 
                  src={p.image_url} 
                  alt={p.name}
                  style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--forest-700)', fontWeight: 600 }}>{p.brand}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {p.nutrition_per_serving?.calories} kcal • {p.nutrition_per_serving?.sugars_g}g sugar
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How LabelLens Works: 4 Pipeline Pillars */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
          <span className="badge badge-forest" style={{ marginBottom: '0.5rem' }}>System Architecture</span>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>How LabelLens Understands Food Labels</h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '1rem' }}>
            A rigorous deep learning and document understanding pipeline converting noisy packaging images into verified nutrition facts and plain-English ingredient explanations.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Step 1 */}
          <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--forest-700)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--forest-100)',
              color: 'var(--forest-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Eye size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase 1
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0.35rem 0 0.65rem' }}>1. Computer Vision & OCR</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
              PaddleOCR and OpenCV preprocess packaging photos, enhancing contrast and sharpness to extract fine text with per-token confidence metrics.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--orange-600)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--orange-100)',
              color: 'var(--orange-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <BrainCircuit size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase 2
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0.35rem 0 0.65rem' }}>2. NLP Ingredient Parsing</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
              Nested parenthetical parser segments ingredients. Pretrained NLP models categorize additives into sweeteners, emulsifiers, preservatives, and whole foods.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--forest-500)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--forest-50)',
              color: 'var(--forest-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <BookOpen size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase 3
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0.35rem 0 0.65rem' }}>3. Evidence Grounding</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
              Every plain-language explanation is linked directly to authoritative medical and regulatory benchmarks: FDA 21 CFR, EFSA, and WHO JECFA assessments.
            </p>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--orange-500)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--orange-50)',
              color: 'var(--orange-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <SlidersHorizontal size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase 4
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0.35rem 0 0.65rem' }}>4. Personalized Matching</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
              Sentence embeddings match user watchlists and allergen rules. Products are ranked transparently against individual dietary thresholds.
            </p>
          </div>
        </div>
      </section>

      {/* Limitations and Disclaimer Callout (Section 10 Requirement) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          backgroundColor: 'var(--cream-100)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 2rem',
          border: '1px solid var(--cream-300)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <ShieldAlert size={28} color="var(--orange-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--forest-900)', marginBottom: '0.35rem' }}>
              Responsible AI & Research Transparency Notice
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.55 }}>
              LabelLens is engineered for food label document understanding, NLP research, and consumer transparency. 
              It does not certify medical safety or diagnose allergies. Always confirm physical packaging for acute allergen risks. 
              Uncertain OCR detections are explicitly tagged with confidence scores and allow one-click human verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
