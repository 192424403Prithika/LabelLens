import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Barcode, 
  RotateCw, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Save, 
  ArrowRight, 
  Camera, 
  Sparkles,
  FileText,
  Search,
  Eye
} from 'lucide-react';
import { api, getAssetUrl } from '../api';
import { ScanRecord, Product } from '../types';

interface ScanViewProps {
  onScanCompleted: (productId: string) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({ onScanCompleted }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'barcode'>('upload');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [contrastFilter, setContrastFilter] = useState<boolean>(true);
  const [productHint, setProductHint] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrStep, setOcrStep] = useState<number>(0);
  const [scanResult, setScanResult] = useState<{ scan: ScanRecord; product: Product } | null>(null);

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isBarcodeLoading, setIsBarcodeLoading] = useState<boolean>(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Correction state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editIngredients, setEditIngredients] = useState<string>('');
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editSugars, setEditSugars] = useState<number>(0);
  const [editSodium, setEditSodium] = useState<number>(0);
  const [correctionFeedback, setCorrectionFeedback] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = [
    { name: 'Rolled Oats Nutrition & Ingredients', hint: 'Rolled Whole Grain Oats', url: getAssetUrl('/uploads/scan-0b92d8c6cf.jpg') },
    { name: 'Britannia Marie Gold Packaging Label', hint: 'Britannia Marie Gold Biscuits', url: getAssetUrl('/uploads/scan-57258072c2.jpg') },
    { name: 'Multi-Nutrient Nutrition Panel (443 kcal)', hint: 'Energy & Vitamin Packaging Label', url: getAssetUrl('/uploads/scan-e36ecdc8dd.jpg') }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  const handleSelectSample = async (sample: typeof sampleImages[0]) => {
    setProductHint(sample.hint);
    setPreviewUrl(sample.url);
    // Convert image url to a File object for real OCR processing pipeline
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], `${sample.hint.replace(/\s+/g, '_')}_label.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setScanResult(null);
    } catch (err) {
      console.error("Sample fetch error", err);
    }
  };

  const handleStartOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setOcrStep(1); // Preprocessing

    setTimeout(() => setOcrStep(2), 500); // OCR Text Extraction
    setTimeout(() => setOcrStep(3), 1100); // Structured Layout Analysis
    setTimeout(() => setOcrStep(4), 1600); // NLP Classification

    try {
      const result = await api.uploadScan(selectedFile, productHint);
      setTimeout(() => {
        setIsProcessing(false);
        setScanResult(result);
        setEditName(result.scan.extracted_product_name);
        setEditIngredients(result.scan.ingredients_raw);
        setEditCalories(result.scan.nutrition_per_serving?.calories || 0);
        setEditSugars(result.scan.nutrition_per_serving?.sugars_g || 0);
        setEditSodium(result.scan.nutrition_per_serving?.sodium_mg || 0);
      }, 2100);
    } catch (err: any) {
      setIsProcessing(false);
      alert("Extraction error: " + err.message);
    }
  };

  const handleSaveCorrection = async () => {
    if (!scanResult) return;
    try {
      const res = await api.correctScan({
        scan_id: scanResult.scan.id,
        corrected_product_name: editName,
        corrected_ingredients_raw: editIngredients,
        corrected_nutrition: {
          ...scanResult.scan.nutrition_per_serving,
          calories: editCalories,
          sugars_g: editSugars,
          sodium_mg: editSodium
        },
        feedback_notes: correctionFeedback || "User verified and saved corrected values"
      });

      setSaveMessage("Corrections saved and submitted to model evaluation benchmark!");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      alert("Failed to save correction: " + err.message);
    }
  };

  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setIsBarcodeLoading(true);
    setBarcodeError(null);

    try {
      const res = await api.lookupBarcode(code);
      setIsBarcodeLoading(false);
      onScanCompleted(res.product.id);
    } catch (err: any) {
      setIsBarcodeLoading(false);
      setBarcodeError(`No product found with barcode ${code}. You can scan its packaging image instead.`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--forest-900)' }}>Smart Food-Label Scanner</h2>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Upload packaged food labels or look up barcodes to extract evidence-grounded nutrition and ingredient data.
        </p>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--cream-100)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem',
          marginTop: '1.25rem',
          border: '1px solid var(--cream-300)'
        }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'upload' ? 'var(--forest-subtle)' : 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Upload size={16} />
            Label Photo OCR
          </button>
          <button
            onClick={() => setActiveTab('barcode')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'barcode' ? 'var(--forest-subtle)' : 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Barcode size={16} />
            Barcode Scanner (Feature #1)
          </button>
        </div>
      </div>

      {/* TAB 1: Image Upload & OCR */}
      {activeTab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: '1.75rem', alignItems: 'start' }}>
          {/* Upload Dropzone */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Upload Product Packaging</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
              Supports JPG, PNG, WEBP. For optimal OCR, ensure ingredients and nutrition table are in focus.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--forest-500)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--forest-50)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.25rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forest-100)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--forest-50)'}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <Camera size={24} color="#000000" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--forest-900)' }}>
                Click to browse or drag label image here
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.35rem' }}>
                Max file size: 10MB • Auto-enhanced preprocessing
              </div>
            </div>

            {/* Quick Sample Selector */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.65rem' }}>
                Or select a realistic sample packaging label:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sampleImages.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleSelectSample(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--slate-200)',
                      backgroundColor: 'var(--cream-50)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span className="badge badge-forest" style={{ fontSize: '0.65rem' }}>Load Sample</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Preview & Preprocessing Controls */}
          {previewUrl && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Image Preview & Tools</h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                    title="Rotate image 90 degrees"
                  >
                    <RotateCw size={14} /> Rotate
                  </button>
                  <button
                    onClick={() => setContrastFilter(!contrastFilter)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', backgroundColor: contrastFilter ? 'var(--forest-100)' : 'transparent' }}
                    title="Toggle high-contrast OCR filter"
                  >
                    <Sliders size={14} /> {contrastFilter ? 'Enhanced' : 'Normal'}
                  </button>
                </div>
              </div>

              {/* Viewport */}
              <div style={{
                height: '240px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '1rem'
              }}>
                <img
                  src={previewUrl}
                  alt="Label preview"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${rotation}deg)`,
                    filter: contrastFilter ? 'contrast(130%) brightness(105%)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
                {contrastFilter && (
                  <span className="badge badge-forest" style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.7rem' }}>
                    Contrast Filter Active
                  </span>
                )}
              </div>

              {/* OCR Step Status Indicator */}
              {isProcessing && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--cream-100)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <Sparkles size={16} color="var(--orange-600)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--forest-900)' }}>
                      Executing Deep Learning Extraction Pipeline:
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ color: ocrStep >= 1 ? 'var(--forest-800)' : 'var(--slate-400)', fontWeight: ocrStep === 1 ? 700 : 500 }}>
                      {ocrStep >= 1 ? '✓' : '○'} 1. OpenCV Image Preprocessing & Thresholding
                    </div>
                    <div style={{ color: ocrStep >= 2 ? 'var(--forest-800)' : 'var(--slate-400)', fontWeight: ocrStep === 2 ? 700 : 500 }}>
                      {ocrStep >= 2 ? '✓' : '○'} 2. PaddleOCR Optical Character Recognition (Confidence Scoring)
                    </div>
                    <div style={{ color: ocrStep >= 3 ? 'var(--forest-800)' : 'var(--slate-400)', fontWeight: ocrStep === 3 ? 700 : 500 }}>
                      {ocrStep >= 3 ? '✓' : '○'} 3. Structured Layout Segmentation (Ingredients vs Nutrition)
                    </div>
                    <div style={{ color: ocrStep >= 4 ? 'var(--forest-800)' : 'var(--slate-400)', fontWeight: ocrStep === 4 ? 700 : 500 }}>
                      {ocrStep >= 4 ? '✓' : '○'} 4. NLP Ingredient Classification & Evidence Retrieval
                    </div>
                  </div>
                </div>
              )}

              {/* Trigger Button */}
              {!scanResult && (
                <button
                  onClick={handleStartOCR}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                >
                  <Eye size={18} />
                  {isProcessing ? 'Analyzing Food Label...' : 'Run LabelLens AI Extraction'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Barcode Scanner & Product Lookup (Feature #1) */}
      {activeTab === 'barcode' && (
        <div className="card" style={{ padding: '2rem', maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--orange-100)',
              color: 'var(--orange-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Barcode size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Barcode Search & External Lookup</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                Searches MongoDB and automatically queries the Open Food Facts API if not yet cataloged.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Enter barcode number (e.g., 016000275270)..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--slate-200)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
            />
            <button
              onClick={() => handleBarcodeLookup()}
              disabled={isBarcodeLoading}
              className="btn btn-accent"
              style={{ padding: '0.75rem 1.4rem' }}
            >
              <Search size={18} />
              {isBarcodeLoading ? 'Searching...' : 'Lookup'}
            </button>
          </div>

          {barcodeError && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger-border)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              {barcodeError}
            </div>
          )}

          {/* Quick test barcodes */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
              Or try verified barcode numbers:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {[
                { code: '016000275270', name: 'Cheerios Honey Nut Cereal' },
                { code: '894700010045', name: 'Chobani Vanilla Greek Yogurt' },
                { code: '7394376616037', name: 'Oatly Barista Oat Milk' },
                { code: '016000264601', name: 'Nature Valley Granola Bars' }
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => { setBarcodeInput(item.code); handleBarcodeLookup(item.code); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--slate-200)',
                    backgroundColor: 'var(--cream-50)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest-800)' }}>{item.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Code: {item.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POST-SCAN EXTRACTION REVIEW & MANUAL CORRECTION (Feature #6) */}
      {scanResult && (
        <div className="card" style={{ marginTop: '2rem', padding: '1.75rem', border: '2px solid var(--forest-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-success">OCR Extraction Complete</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)', fontWeight: 600 }}>
                  Confidence: {Math.round(scanResult.scan.ocr_confidence * 100)}% ({scanResult.scan.ocr_word_count} tokens)
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>
                {scanResult.scan.extracted_product_name}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              >
                <Edit3 size={15} />
                {isEditing ? 'Cancel Edit' : 'Correct OCR Fields (Feature #6)'}
              </button>
              <button
                onClick={() => onScanCompleted(scanResult.product.id)}
                className="btn btn-accent"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Inspect Intelligence <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {saveMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success-border)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ✓ {saveMessage}
            </div>
          )}

          {/* Form for manual OCR correction */}
          {isEditing ? (
            <div style={{
              backgroundColor: 'var(--cream-100)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)'
            }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--forest-900)' }}>
                Edit & Refine Extracted Values
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Product Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Calories (kcal)</label>
                  <input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Sugars (g)</label>
                  <input
                    type="number"
                    value={editSugars}
                    onChange={(e) => setEditSugars(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Sodium (mg)</label>
                  <input
                    type="number"
                    value={editSodium}
                    onChange={(e) => setEditSodium(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>Ingredients Raw Text</label>
                <textarea
                  rows={3}
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px', fontFamily: 'inherit', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                  Correction Notes (Logs to Model Evaluation Dataset)
                </label>
                <input
                  type="text"
                  placeholder="e.g., OCR misread 'Salt' as 'Sa1t' and '12g' sugar as '15g'..."
                  value={correctionFeedback}
                  onChange={(e) => setCorrectionFeedback(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--slate-300)', marginTop: '2px' }}
                />
              </div>

              <button
                onClick={handleSaveCorrection}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Save size={15} />
                Save Corrections & Log to Benchmark
              </button>
            </div>
          ) : (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Serving Size</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{scanResult.scan.serving_description || '100g'}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Calories</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{scanResult.scan.nutrition_per_serving?.calories || 0} kcal</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Total Fat</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{scanResult.scan.nutrition_per_serving?.fat_total_g || 0}g</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Total Sugars</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{scanResult.scan.nutrition_per_serving?.sugars_g || 0}g</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--cream-100)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Sodium</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{scanResult.scan.nutrition_per_serving?.sodium_mg || 0} mg</div>
                </div>
              </div>

              {scanResult.scan.declared_allergens && scanResult.scan.declared_allergens.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'var(--danger-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--danger-border)',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger-text)' }}>Declared Allergens:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger-text)' }}>
                    {scanResult.scan.declared_allergens.join(', ')}
                  </span>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                <b>Extracted Ingredients:</b> {scanResult.scan.ingredients_raw}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
