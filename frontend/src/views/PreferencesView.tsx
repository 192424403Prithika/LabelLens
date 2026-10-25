import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Plus, 
  X, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Heart,
  HelpCircle
} from 'lucide-react';
import { UserProfile, DietaryPreferences } from '../types';
import { api } from '../api';

interface PreferencesViewProps {
  user: UserProfile | null;
  onPreferencesUpdated: (prefs: DietaryPreferences) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({ user, onPreferencesUpdated }) => {
  const currentPrefs: DietaryPreferences = user?.preferences || {
    diet: ['Vegetarian'],
    allergens_to_avoid: ['Peanuts', 'Tree Nuts'],
    avoid_ingredients: ['High Fructose Corn Syrup', 'Palm Oil', 'Titanium Dioxide'],
    monitor_ingredients: ['Cane Sugar', 'Canola Oil'],
    find_ingredients: ['Whole Grain Oats', 'Chia Seeds'],
    max_sugar_g: 10,
    max_sodium_mg: 200,
    max_sat_fat_g: 2.5,
    min_protein_g: 4,
    min_fiber_g: 3
  };

  const [diet, setDiet] = useState<string[]>(currentPrefs.diet || []);
  const [allergens, setAllergens] = useState<string[]>(currentPrefs.allergens_to_avoid || []);
  const [avoidList, setAvoidList] = useState<string[]>(currentPrefs.avoid_ingredients || []);
  const [monitorList, setMonitorList] = useState<string[]>(currentPrefs.monitor_ingredients || []);
  const [findList, setFindList] = useState<string[]>(currentPrefs.find_ingredients || []);

  const [maxSugar, setMaxSugar] = useState<number | ''>(currentPrefs.max_sugar_g ?? 10);
  const [maxSodium, setMaxSodium] = useState<number | ''>(currentPrefs.max_sodium_mg ?? 200);
  const [maxSatFat, setMaxSatFat] = useState<number | ''>(currentPrefs.max_sat_fat_g ?? 2.5);
  const [minProtein, setMinProtein] = useState<number | ''>(currentPrefs.min_protein_g ?? 4);
  const [minFiber, setMinFiber] = useState<number | ''>(currentPrefs.min_fiber_g ?? 3);

  // New tag input states
  const [newAvoid, setNewAvoid] = useState<string>('');
  const [newMonitor, setNewMonitor] = useState<string>('');
  const [newFind, setNewFind] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const availableDiets = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher', 'Low-FODMAP'];
  const commonAllergens = ['Milk', 'Eggs', 'Peanuts', 'Tree Nuts', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Sulfites'];

  const toggleDiet = (item: string) => {
    setDiet(prev => prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]);
  };

  const toggleAllergen = (item: string) => {
    setAllergens(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
  };

  const handleAddTag = (listType: 'avoid' | 'monitor' | 'find', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (listType === 'avoid') {
      if (!avoidList.includes(trimmed)) setAvoidList([...avoidList, trimmed]);
      setNewAvoid('');
    } else if (listType === 'monitor') {
      if (!monitorList.includes(trimmed)) setMonitorList([...monitorList, trimmed]);
      setNewMonitor('');
    } else if (listType === 'find') {
      if (!findList.includes(trimmed)) setFindList([...findList, trimmed]);
      setNewFind('');
    }
  };

  const handleRemoveTag = (listType: 'avoid' | 'monitor' | 'find', tag: string) => {
    if (listType === 'avoid') setAvoidList(avoidList.filter(t => t !== tag));
    if (listType === 'monitor') setMonitorList(monitorList.filter(t => t !== tag));
    if (listType === 'find') setFindList(findList.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const updated: DietaryPreferences = {
      diet,
      allergens_to_avoid: allergens,
      avoid_ingredients: avoidList,
      monitor_ingredients: monitorList,
      find_ingredients: findList,
      max_sugar_g: maxSugar === '' ? null : Number(maxSugar),
      max_sodium_mg: maxSodium === '' ? null : Number(maxSodium),
      max_sat_fat_g: maxSatFat === '' ? null : Number(maxSatFat),
      min_protein_g: minProtein === '' ? null : Number(minProtein),
      min_fiber_g: minFiber === '' ? null : Number(minFiber),
    };

    try {
      await api.updatePreferences(updated);
      onPreferencesUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert("Error saving preferences: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-forest">Personalized Food Lens</span>
        </div>
        <h2 style={{ fontSize: '2rem', color: 'var(--forest-900)' }}>My Preferences & Ingredient Watchlist</h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
          Customize your dietary patterns, flagged allergens, ingredients to monitor, and nutritional thresholds.
        </p>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success-text)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--success-border)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          Your food preferences and thresholds have been saved successfully!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 1. Dietary Patterns */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>1. Dietary Patterns</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Products will be automatically screened for compliance with selected diets.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availableDiets.map((d) => {
              const active = diet.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDiet(d)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? 'var(--forest-subtle)' : 'var(--cream-50)',
                    color: '#000000',
                    border: '1px solid',
                    borderColor: active ? 'var(--forest-deep)' : 'var(--slate-200)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {active ? '✓ ' : '+ '} {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Flagged Allergens to Avoid */}
        <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--danger-text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ShieldAlert size={20} color="var(--danger-text)" />
            <h3 style={{ fontSize: '1.2rem' }}>2. Flagged Allergens to Avoid</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Triggers high-priority alerts whenever declared on package or detected via ingredient OCR matching.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {commonAllergens.map((alg) => {
              const active = allergens.includes(alg);
              return (
                <button
                  key={alg}
                  onClick={() => toggleAllergen(alg)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? 'var(--danger-bg)' : 'var(--white)',
                    color: active ? 'var(--danger-text)' : 'var(--slate-700)',
                    border: '1px solid',
                    borderColor: active ? 'var(--danger-border)' : 'var(--slate-200)',
                    cursor: 'pointer'
                  }}
                >
                  {active ? '⚠️ ' : '+ '} {alg}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Personalized Ingredient Watchlist (Feature #2) */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sparkles size={20} color="var(--forest-700)" />
            <h3 style={{ fontSize: '1.2rem' }}>3. Personalized Ingredient Watchlists (Feature #2)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
            Track specific food additives, sugars, or oils. Sentence embeddings automatically expand known synonyms (e.g. HFCS = glucose-fructose syrup).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Avoid List */}
            <div style={{ backgroundColor: 'var(--cream-100)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--orange-800)', marginBottom: '0.5rem' }}>
                Avoid (Strict Conflicts)
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Palm Oil..."
                  value={newAvoid}
                  onChange={(e) => setNewAvoid(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('avoid', newAvoid)}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                />
                <button onClick={() => handleAddTag('avoid', newAvoid)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {avoidList.map((tag) => (
                  <span key={tag} className="badge badge-orange" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    {tag}
                    <X size={12} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleRemoveTag('avoid', tag)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Monitor List */}
            <div style={{ backgroundColor: 'var(--cream-100)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                Monitor (Mild Warnings)
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Cane Sugar..."
                  value={newMonitor}
                  onChange={(e) => setNewMonitor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('monitor', newMonitor)}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontSize: '0.85rem' }}
                />
                <button onClick={() => handleAddTag('monitor', newMonitor)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {monitorList.map((tag) => (
                  <span key={tag} className="badge badge-forest" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    {tag}
                    <X size={12} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleRemoveTag('monitor', tag)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Find List */}
            <div style={{ backgroundColor: 'var(--forest-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--forest-800)', marginBottom: '0.5rem' }}>
                Find (Desired Nutrients)
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Probiotics..."
                  value={newFind}
                  onChange={(e) => setNewFind(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('find', newFind)}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid var(--forest-300)', fontSize: '0.85rem' }}
                />
                <button onClick={() => handleAddTag('find', newFind)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {findList.map((tag) => (
                  <span key={tag} className="badge badge-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    {tag}
                    <X size={12} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleRemoveTag('find', tag)} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Nutrient Goal Thresholds (Feature #4) */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>4. Nutrient Goal Thresholds (Feature #4)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
            Set maximum ceilings or minimum targets per serving. Products exceeding these limits will display goal conflict alerts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Max Sugar</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '4px' }}>
                <input
                  type="number"
                  value={maxSugar}
                  onChange={(e) => setMaxSugar(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>grams</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Max Sodium</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '4px' }}>
                <input
                  type="number"
                  value={maxSodium}
                  onChange={(e) => setMaxSodium(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>mg</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Max Saturated Fat</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '4px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={maxSatFat}
                  onChange={(e) => setMaxSatFat(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>grams</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Min Fiber Goal</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '4px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={minFiber}
                  onChange={(e) => setMinFiber(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>grams</span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Min Protein Goal</label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '4px' }}>
                <input
                  type="number"
                  value={minProtein}
                  onChange={(e) => setMinProtein(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>grams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-accent"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
          >
            <Save size={18} />
            {isSaving ? 'Saving Preferences...' : 'Save My Food Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
