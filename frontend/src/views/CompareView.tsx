import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../api';
import { Product, ComparisonResult } from '../types';

interface CompareViewProps {
  compareList: string[];
  allProducts: Product[];
  onRemoveFromCompare: (productId: string) => void;
  onAddToCompare: (productId: string) => void;
  onInspectProduct: (productId: string) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  compareList,
  allProducts,
  onRemoveFromCompare,
  onAddToCompare,
  onInspectProduct
}) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('Healthiest Overall');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const goals = [
    'Healthiest Overall',
    'Lowest Sugar',
    'High Protein',
    'Lowest Sodium',
    'Cleanest Ingredients'
  ];

  useEffect(() => {
    if (compareList.length >= 2) {
      runComparison();
    } else {
      setComparisonResult(null);
    }
  }, [compareList, selectedGoal]);

  const runComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.compareProducts(compareList, selectedGoal);
      setComparisonResult(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for Recharts
  const chartData: Array<Record<string, any>> = [
    { nutrient: 'Sugars (g)' },
    { nutrient: 'Protein (g)' },
    { nutrient: 'Fiber (g)' },
    { nutrient: 'Sat Fat (g)' },
  ];

  if (comparisonResult) {
    comparisonResult.products.forEach((p, idx) => {
      chartData[0][p.name] = p.nutrition?.sugars_g || 0;
      chartData[1][p.name] = p.nutrition?.protein_g || 0;
      chartData[2][p.name] = p.nutrition?.fiber_g || 0;
      chartData[3][p.name] = p.nutrition?.saturated_fat_g || 0;
    });
  }

  const barColors = ['#1b4332', '#ea580c', '#52b788', '#f59e0b'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-orange">Multi-Product Intelligence (Feature #9)</span>
        </div>
        <h2 style={{ fontSize: '2rem', color: 'var(--forest-900)' }}>Intelligent Product Comparison</h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
          Compare up to 3 packaged foods across actual nutrition, ingredient simplicity, and your personalized dietary goals.
        </p>

        {/* Goal selector */}
        <div style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {goals.map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: selectedGoal === goal ? 700 : 500,
                backgroundColor: selectedGoal === goal ? 'var(--forest-subtle)' : 'var(--cream-100)',
                color: '#000000',
                border: '1px solid',
                borderColor: selectedGoal === goal ? 'var(--forest-deep)' : 'var(--cream-300)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Goal: {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Products Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {compareList.map((pid) => {
          const p = allProducts.find((item) => item.id === pid);
          if (!p) return null;
          return (
            <div
              key={pid}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--white)',
                position: 'relative'
              }}
            >
              <img
                src={p.image_url}
                alt={p.name}
                style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--forest-700)', fontWeight: 600 }}>{p.brand}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
              </div>
              <button
                onClick={() => onRemoveFromCompare(pid)}
                title="Remove from comparison"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        {/* Add more slot */}
        {compareList.length < 3 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--slate-300)',
              backgroundColor: 'var(--cream-50)',
              color: 'var(--slate-500)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div>Select {3 - compareList.length} more product{3 - compareList.length > 1 ? 's' : ''} to compare</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Use catalog compare buttons or search</div>
            </div>
          </div>
        )}
      </div>

      {compareList.length < 2 && (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <Layers size={40} color="var(--forest-700)" style={{ margin: '0 auto 1rem' }} />
          <h3>Select At Least 2 Products To Compare</h3>
          <p style={{ color: 'var(--slate-600)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>
            Choose products from the library below or return to the dashboard to compare nutrition deltas:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            {allProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onAddToCompare(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--cream-100)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img src={p.image_url} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{p.brand}</div>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* AI Winner Recommendation Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--forest-subtle) 0%, #d8ebd9 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem 2rem',
            color: '#000000',
            border: '1px solid rgba(45, 90, 67, 0.25)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-gold)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(244, 180, 63, 0.3)'
            }}>
              <Trophy size={28} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-orange" style={{ color: '#000000' }}>Top Recommended Match</span>
                <span style={{ fontSize: '0.8rem', color: '#000000', opacity: 0.85 }}>For Goal: {comparisonResult.user_goal}</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#000000', marginBottom: '0.35rem' }}>
                {comparisonResult.winner_name} ({comparisonResult.winner_brand})
              </h3>
              <p style={{ fontSize: '0.925rem', color: '#000000', lineHeight: 1.5 }}>
                {comparisonResult.recommendation_rationale}
              </p>
            </div>

            <button
              onClick={() => onInspectProduct(comparisonResult.winner_id)}
              className="btn btn-accent"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', flexShrink: 0 }}
            >
              Inspect Winner <ArrowRight size={16} />
            </button>
          </div>

          {/* Visual Nutrition Comparison Chart (Recharts) */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BarChart2 size={20} color="var(--forest-700)" />
              <h3 style={{ fontSize: '1.25rem' }}>Nutrient Comparison Chart (g per serving)</h3>
            </div>

            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nutrient" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <Legend />
                  {comparisonResult.products.map((p, idx) => (
                    <Bar key={p.id} dataKey={p.name} fill={barColors[idx % barColors.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Side-by-Side Matrix Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--cream-100)', borderBottom: '1px solid var(--cream-300)' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Detailed Difference Matrix</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                Values highlighted in green indicate the best performing nutrient amount.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--cream-50)', borderBottom: '2px solid var(--slate-200)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Metric</th>
                    {comparisonResult.products.map((p) => (
                      <th key={p.id} style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        <div>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 500 }}>{p.serving_description}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Suitability score row */}
                  <tr style={{ borderBottom: '1px solid var(--slate-200)', backgroundColor: 'var(--forest-50)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--forest-900)' }}>
                      Personal Match Score
                    </td>
                    {comparisonResult.products.map((p) => (
                      <td key={p.id} style={{ padding: '0.75rem 1rem', fontWeight: 800, color: p.suitability_score >= 80 ? 'var(--forest-700)' : 'var(--orange-700)' }}>
                        {p.suitability_score}%
                      </td>
                    ))}
                  </tr>

                  {/* Nutrients rows */}
                  {comparisonResult.comparison_matrix.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {row.nutrient} ({row.unit})
                      </td>
                      {comparisonResult.products.map((p) => {
                        const val = row.values[p.id];
                        const isBest = row.best_product_id === p.id;
                        return (
                          <td 
                            key={p.id} 
                            style={{ 
                              padding: '0.75rem 1rem', 
                              fontWeight: isBest ? 700 : 400,
                              backgroundColor: isBest ? 'var(--success-bg)' : 'transparent',
                              color: isBest ? 'var(--success-text)' : 'inherit'
                            }}
                          >
                            {val} {row.unit} {isBest && ' ★'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Declared Allergens row */}
                  <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Declared Allergens</td>
                    {comparisonResult.products.map((p) => (
                      <td key={p.id} style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                        {p.declared_allergens?.length > 0 ? (
                          <span className="badge badge-warning">{p.declared_allergens.join(', ')}</span>
                        ) : (
                          <span className="badge badge-success">None declared</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
