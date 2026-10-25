import React, { useState, useEffect } from 'react';
import { 
  History, 
  Bookmark, 
  BarChart3, 
  CheckSquare, 
  Square, 
  Trash2, 
  ArrowRight, 
  Download, 
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api';
import { ScanRecord } from '../types';

interface HistoryViewProps {
  onInspectProduct: (productId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onInspectProduct }) => {
  const [activeSubTab, setActiveSubTab] = useState<'collections' | 'scans' | 'analytics'>('collections');
  const [collections, setCollections] = useState<any[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Shopping list toggle
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [colData, scanData, anaData] = await Promise.all([
        api.getCollections(),
        api.getScanHistory(),
        api.getAnalytics()
      ]);
      setCollections(colData);
      setScans(scanData);
      setAnalytics(anaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (id: string) => {
    setCompletedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.removeFromCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Error removing item");
    }
  };

  const shoppingListItems = collections.filter(c => c.collection_name === 'Shopping List');
  const favoriteItems = collections.filter(c => c.collection_name !== 'Shopping List');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1150px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--forest-900)' }}>History, Collections & Analytics</h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
          Revisit previous scans, manage shopping lists, and visualize personal food preference trends.
        </p>

        {/* Sub-tab switcher */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--cream-100)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem',
          marginTop: '1.25rem',
          border: '1px solid var(--cream-300)'
        }}>
          <button
            onClick={() => setActiveSubTab('collections')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: activeSubTab === 'collections' ? 'var(--forest-subtle)' : 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Bookmark size={15} />
            Collections & Shopping Lists (Feature #11)
          </button>
          <button
            onClick={() => setActiveSubTab('scans')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: activeSubTab === 'scans' ? 'var(--forest-subtle)' : 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <History size={15} />
            Scan Timeline
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: activeSubTab === 'analytics' ? 'var(--forest-subtle)' : 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <BarChart3 size={15} />
            Personal Analytics (Feature #13)
          </button>
        </div>
      </div>

      {/* 1. COLLECTIONS & SHOPPING LISTS (Feature #11) */}
      {activeSubTab === 'collections' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Shopping List with interactive checkboxes */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Interactive Shopping List</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Check off items as you shop in the grocery aisle.
                </p>
              </div>
              <span className="badge badge-orange">{shoppingListItems.length} Items</span>
            </div>

            {shoppingListItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {shoppingListItems.map((item) => {
                  const done = completedItems[item.id] || false;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: done ? 'var(--cream-100)' : 'var(--white)',
                        border: '1px solid var(--slate-200)',
                        opacity: done ? 0.65 : 1
                      }}
                    >
                      <div 
                        onClick={() => handleToggleCheck(item.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
                      >
                        {done ? <CheckSquare size={18} color="var(--forest-700)" /> : <Square size={18} color="var(--slate-400)" />}
                        <div>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textDecoration: done ? 'line-through' : 'none',
                            color: 'var(--forest-900)'
                          }}>
                            {item.product?.name || 'Saved Item'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {item.product?.brand} • {item.notes || 'Added from LabelLens'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => onInspectProduct(item.product_id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.9rem' }}>
                Your shopping list is empty. Add products from the catalog or intelligence screens!
              </div>
            )}
          </div>

          {/* Saved Bookmarks & Custom Collections */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Saved Favorites</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Bookmarked products for comparison and reference.
                </p>
              </div>
              <span className="badge badge-forest">{favoriteItems.length} Products</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {favoriteItems.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                  No saved products yet. Bookmark favorite products from the catalog or comparison screen.
                </div>
              ) : (
                favoriteItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--slate-200)',
                      backgroundColor: 'var(--white)'
                    }}
                  >
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--forest-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        Collection: <b>{item.collection_name}</b>
                      </div>
                    </div>
                    <button
                      onClick={() => onInspectProduct(item.product_id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SCAN TIMELINE */}
      {activeSubTab === 'scans' && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Packaging Scan History</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1.5rem' }}>
            Chronological archive of photos, OCR text output, and manual field corrections.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scans.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  No scans recorded yet.
                </p>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Upload a food package photo or enter a barcode to start building your verified history.
                </p>
              </div>
            ) : (
              scans.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                  backgroundColor: 'var(--white)'
                }}
              >
                <img
                  src={s.image_url}
                  alt={s.extracted_product_name}
                  style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--forest-900)' }}>
                      {s.extracted_product_name || s.original_filename}
                    </span>
                    <span className="badge badge-success">OCR: {Math.round(s.ocr_confidence * 100)}%</span>
                    {s.corrections_made && (
                      <span className="badge badge-orange">Human Corrected</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                    Scanned on {new Date(s.created_at).toLocaleDateString()} • {s.ocr_word_count || 50} text tokens parsed
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '4px', maxWidth: '650px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <b>Raw snippet:</b> {s.raw_ocr_text.slice(0, 100)}...
                  </div>
                </div>

                {s.product_id && (
                  <button
                    onClick={() => onInspectProduct(s.product_id!)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    Open Deep-Dive <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )))}
          </div>
        </div>
      )}

      {/* 3. PERSONAL SCAN ANALYTICS (Feature #13) */}
      {activeSubTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Top KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--forest-700)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Scans Completed
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--forest-900)', marginTop: '4px' }}>
                {analytics.total_scans}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--forest-600)' }}>Across all packaged categories</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--orange-600)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Preference Compliance
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange-700)', marginTop: '4px' }}>
                {analytics.overall_compliance_percent}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--forest-600)' }}>↑ 12% improvement over 6 months</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--forest-500)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Saved In Collections
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--forest-900)', marginTop: '4px' }}>
                {analytics.total_saved}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Favorites & Shopping lists</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
            {/* Scanned Categories Distribution */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Most Scanned Food Categories</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
                Frequency of scanned packaging by food sector
              </p>
              <div style={{ height: '230px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.scanned_categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--forest-700)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Compliance Rate Timeline */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Dietary Compliance Timeline</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
                % of scanned foods matching your dietary thresholds
              </p>
              <div style={{ height: '230px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.compliance_timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                    <YAxis domain={[60, 100]} fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="compliance_rate" stroke="var(--orange-600)" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Frequently Flagged Ingredients Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Frequently Flagged Watchlist Ingredients</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
              Specific food additives and threshold breaches encountered most often in your scans.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {analytics.flagged_ingredients.map((f: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--cream-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.ingredient}</span>
                  <span className="badge badge-orange">{f.flag_count} times</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
