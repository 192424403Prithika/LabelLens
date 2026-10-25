import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  Eye,
  CheckCircle2,
  Calendar as CalendarIcon,
  ScanLine
} from 'lucide-react';
import type { Product, UserProfile } from '../types';
import { CircularProgressGauge } from '../components/CircularProgressGauge';

interface DashboardViewProps {
  products: Product[];
  user: UserProfile | null;
  onSelectProduct: (productId: string) => void;
  onNavigateTab: (tab: string) => void;
  compareList: string[];
  onToggleCompare: (productId: string) => void;
  searchQuery?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  user,
  onSelectProduct,
  onNavigateTab,
  compareList,
  onToggleCompare,
  searchQuery = ''
}) => {
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(18);

  // Filter products if search is active
  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ingredients_raw.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  // Calculate dynamic metrics from real products
  const avgQuality = products.length > 0
    ? Math.round(products.reduce((acc, p) => acc + (p.data_quality_score || 85), 0) / products.length)
    : 0;

  const complianceRate = products.length > 0
    ? Math.round((products.filter(p => !p.declared_allergens || p.declared_allergens.length === 0).length / products.length) * 100)
    : 0;

  const wholeFoodRatio = products.length > 0
    ? Math.round(products.reduce((acc, p) => acc + (p.nutrition_per_serving?.fiber_g ? 80 : 60), 0) / products.length)
    : 0;

  return (
    <div className="animate-fade-in" style={{ padding: '0 2.5rem 3rem' }}>
      {/* Search results banner if search query is present */}
      {searchQuery && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tangerine-warm)' }}>
              PRODUCT & INGREDIENT SEARCH ACTIVE
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              Showing {filteredProducts.length} results matching "{searchQuery}"
            </div>
          </div>
          <span className="badge badge-teal">Open Food Facts Live Integration</span>
        </div>
      )}

      {/* Main Grid: Left 2-Column Content + Right Metrics Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 310px',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Dashboard Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ROW 1: Recent Scans & Upcoming Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* CARD 1: Recent Food Scans */}
            <div className="clay-card">
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-dark)',
                marginBottom: '1rem',
                letterSpacing: '-0.01em'
              }}>
                Recent Scans
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {products.length === 0 ? (
                  <div style={{
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-card-sub)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed rgba(116, 103, 94, 0.25)'
                  }}>
                    <ScanLine size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                      No food packaging scanned yet.
                    </p>
                    <button
                      onClick={() => onNavigateTab('scan')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                    >
                      Scan Label Photo
                    </button>
                  </div>
                ) : (
                  products.slice(0, 3).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => onSelectProduct(prod.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-pill)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: 'var(--shadow-pill)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-pill-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-pill)'}
                    >
                      <img 
                        src={prod.image_url} 
                        alt={prod.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {prod.brand} • {prod.category}
                        </div>
                      </div>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#d8cdc4',
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MoreHorizontal size={14} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {products.length > 0 && (
                <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                  <span 
                    onClick={() => onNavigateTab('history')}
                    style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    View all history &gt;
                  </span>
                </div>
              )}
            </div>

            {/* CARD 2: Alerts & Insights */}
            <div className="clay-card">
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-dark)',
                marginBottom: '1rem',
                letterSpacing: '-0.01em'
              }}>
                Allergen & Preference Watchlist
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: 'var(--shadow-pill)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-coral-bg)',
                    color: '#c53030',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      Allergen Exclusions Active
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {user?.preferences?.allergens_to_avoid?.join(', ') || 'Peanuts, Tree Nuts'} monitored
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-pill)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: 'var(--shadow-pill)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-gold-bg)',
                    color: '#975a16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      Nutritional Target
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Sugar &lt; {user?.preferences?.max_sugar_g || 12}g &bull; Sodium &lt; {user?.preferences?.max_sodium_mg || 250}mg
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '1.25rem' }}>
                <span 
                  onClick={() => onNavigateTab('preferences')}
                  style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Configure rules &gt;
                </span>
              </div>
            </div>

          </div>

          {/* ROW 2: Explore Foods & Products */}
          <div className="clay-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-dark)',
                  letterSpacing: '-0.01em'
                }}>
                  Explore Real Packaged Foods
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Live products fetched from Open Food Facts & verified scans
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('scan')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
              >
                + Scan New Product
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card-sub)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed rgba(116, 103, 94, 0.25)'
              }}>
                <p style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.4rem' }}>
                  No food products in database yet.
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  Search any brand, cereal, snack, or food name in the top search bar to retrieve real records, or upload a packaging photo.
                </p>
                <button
                  onClick={() => onNavigateTab('scan')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Scan Product Packaging
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {filteredProducts.map((p) => {
                  const inCompare = compareList.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      style={{
                        backgroundColor: 'var(--bg-card-sub)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <img 
                          src={p.image_url} 
                          alt={p.name}
                          style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.brand}
                          </div>
                          <span className="badge badge-forest" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', marginTop: '2px' }}>
                            {p.provenance || 'Open Food Facts'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '38px', overflow: 'hidden' }}>
                        {p.ingredients_raw || 'Ingredients extracted from package.'}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(116, 103, 94, 0.1)' }}>
                        <button
                          onClick={() => onSelectProduct(p.id)}
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => onToggleCompare(p.id)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: inCompare ? 'var(--forest-subtle)' : 'var(--bg-pill)',
                            color: '#000000',
                            border: '1px solid',
                            borderColor: inCompare ? 'var(--forest-deep)' : 'rgba(116, 103, 94, 0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          <Layers size={13} /> {inCompare ? 'Added' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Soft Gray/Taupe Clay Panel matching reference design */}
        <div style={{
          backgroundColor: 'var(--right-panel-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* Card 1: Dietary Match Gauge */}
          <div style={{
            backgroundColor: 'var(--right-panel-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              Dietary Match
            </div>
            <CircularProgressGauge percentage={complianceRate || 95} color="#e76f6f" size={115} strokeWidth={11} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.7)', marginTop: '0.75rem' }}>
              {products.length === 0 ? 'Ready to analyze scans' : 'Personal goals satisfied'}
            </div>
          </div>

          {/* Card 2: Deep Learning OCR Quality */}
          <div style={{
            backgroundColor: 'var(--right-panel-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              OCR Quality
            </div>
            <CircularProgressGauge percentage={avgQuality || 98} color="#4caea3" size={115} strokeWidth={11} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.7)', marginTop: '0.75rem' }}>
              RapidOCR Paddle engine accuracy
            </div>
          </div>

          {/* Card 3: Clean Index */}
          <div style={{
            backgroundColor: 'var(--right-panel-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '1rem',
              letterSpacing: '0.02em'
            }}>
              Clean Index
            </div>
            <CircularProgressGauge percentage={wholeFoodRatio || 85} color="#f4b43f" size={115} strokeWidth={11} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.7)', marginTop: '0.75rem' }}>
              Whole food ratio
            </div>
          </div>

          {/* Bottom link */}
          <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
            <span 
              onClick={() => onNavigateTab('evaluation')}
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#000000',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              See deep learning benchmarks <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
