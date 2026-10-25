import { 
  Product, 
  ScanRecord, 
  ProductIntelligence, 
  ComparisonResult, 
  UserProfile, 
  DietaryPreferences, 
  EvaluationMetrics 
} from './types';

const RAW_API_URL = (import.meta.env.VITE_API_BASE_URL as string || '').trim();
export const API_BASE = RAW_API_URL 
  ? (RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/api`) 
  : '/api';

export function getAssetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (RAW_API_URL) {
    const origin = RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return `${origin}${url.startsWith('/') ? url : '/' + url}`;
  }
  return url;
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Products
  async getProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return fetchJson<Product[]>(`${API_BASE}/products?${query.toString()}`);
  },

  async getProduct(id: string): Promise<Product> {
    return fetchJson<Product>(`${API_BASE}/products/${id}`);
  },

  async lookupBarcode(barcode: string): Promise<{ source: string; product: Product }> {
    return fetchJson<{ source: string; product: Product }>(`${API_BASE}/products/barcode/${encodeURIComponent(barcode)}`);
  },

  async getFormulationChanges(productId: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/products/${productId}/formulation-changes`);
  },

  async calculateServing(productId: string, size: number, unit: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/products/${productId}/calculate-serving`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, target_serving_size: size, target_serving_unit: unit })
    });
  },

  // Scans & OCR
  async uploadScan(file: File, hintName?: string): Promise<{ status: string; scan: ScanRecord; product: Product }> {
    const formData = new FormData();
    formData.append('file', file);
    if (hintName) formData.append('product_name_hint', hintName);

    return fetchJson<{ status: string; scan: ScanRecord; product: Product }>(`${API_BASE}/scans/upload`, {
      method: 'POST',
      body: formData
    });
  },

  async correctScan(data: any): Promise<{ status: string; message: string; updated_scan: ScanRecord }> {
    return fetchJson<any>(`${API_BASE}/scans/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getScanHistory(): Promise<ScanRecord[]> {
    return fetchJson<ScanRecord[]>(`${API_BASE}/scans/history`);
  },

  async getScan(id: string): Promise<ScanRecord> {
    return fetchJson<ScanRecord>(`${API_BASE}/scans/${id}`);
  },

  // Intelligence
  async getProductIntelligence(productId: string): Promise<ProductIntelligence> {
    return fetchJson<ProductIntelligence>(`${API_BASE}/analyses/product/${productId}`);
  },

  // Comparisons & Semantic Search
  async compareProducts(productIds: string[], userGoal: string): Promise<ComparisonResult> {
    return fetchJson<ComparisonResult>(`${API_BASE}/comparisons/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds, user_goal: userGoal })
    });
  },

  async semanticSearch(query: string): Promise<{ query: string; total_results: number; products: any[] }> {
    return fetchJson<any>(`${API_BASE}/comparisons/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
  },

  // User & Preferences
  async getCurrentUser(): Promise<UserProfile> {
    return fetchJson<UserProfile>(`${API_BASE}/auth/me`);
  },

  async updatePreferences(preferences: DietaryPreferences): Promise<any> {
    return fetchJson<any>(`${API_BASE}/auth/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
  },

  // Collections & Analytics
  async getCollections(name?: string): Promise<any[]> {
    const q = name ? `?collection_name=${encodeURIComponent(name)}` : '';
    return fetchJson<any[]>(`${API_BASE}/collections${q}`);
  },

  async saveToCollection(productId: string, collectionName = 'Favorites', notes = ''): Promise<any> {
    return fetchJson<any>(`${API_BASE}/collections/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, collection_name: collectionName, notes })
    });
  },

  async removeFromCollection(savedId: string): Promise<any> {
    return fetchJson<any>(`${API_BASE}/collections/${savedId}`, {
      method: 'DELETE'
    });
  },

  async getAnalytics(): Promise<any> {
    return fetchJson<any>(`${API_BASE}/collections/analytics`);
  },

  // Research Evaluation & Feedback
  async getEvaluationMetrics(): Promise<EvaluationMetrics> {
    return fetchJson<EvaluationMetrics>(`${API_BASE}/evaluation/metrics`);
  },

  async submitFeedback(data: { item_type: string; item_id?: string; rating: number; comment: string; suggested_correction?: string }): Promise<any> {
    return fetchJson<any>(`${API_BASE}/evaluation/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Report URL
  getPdfReportUrl(productId: string): string {
    return `${API_BASE}/reports/pdf/${productId}`;
  }
};
