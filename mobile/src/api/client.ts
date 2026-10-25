import { Platform } from 'react-native';

// In Expo/React Native, Android Emulator uses 10.0.2.2 to access host machine localhost, while iOS/Web uses 127.0.0.1
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:8000`;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Request to ${endpoint} failed with status ${response.status}`);
  }
  return response.json();
}

export const mobileApi = {
  // Authentication
  async register(data: { username: string; email: string; password: string; full_name?: string }) {
    const res = await request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setAuthToken(res.token);
    return res;
  },

  async login(username_or_email: string, password: string) {
    const res = await request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password })
    });
    setAuthToken(res.token);
    return res;
  },

  async getMe() {
    return request<any>('/api/auth/me');
  },

  async updatePreferences(preferences: any) {
    return request<any>('/api/auth/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
  },

  async deleteAccount() {
    return request<any>('/api/auth/delete-account', {
      method: 'DELETE'
    });
  },

  async exportUserData() {
    return request<any>('/api/auth/export-data');
  },

  // Products
  async getProducts(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return request<any[]>(`/api/products?${query.toString()}`);
  },

  async getProduct(productId: string) {
    return request<any>(`/api/products/${productId}`);
  },

  async lookupBarcode(barcode: string) {
    return request<{ source: string; product: any }>(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  },

  async calculateCustomServing(productId: string, size: number, unit: string) {
    return request<any>(`/api/products/${productId}/calculate-serving`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, target_serving_size: size, target_serving_unit: unit })
    });
  },

  // Scans & Real OCR
  async uploadScan(formData: FormData) {
    return request<{ status: string; scan: any; product: any }>('/api/scans/upload', {
      method: 'POST',
      body: formData
    });
  },

  async correctScan(data: any) {
    return request<any>('/api/scans/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getScanHistory() {
    return request<any[]>('/api/scans/history');
  },

  async deleteScan(scanId: string) {
    return request<any>(`/api/scans/${scanId}`, {
      method: 'DELETE'
    });
  },

  // Comparison
  async compareProducts(productIds: string[], userGoal: string) {
    return request<any>('/api/comparisons/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds, user_goal: userGoal })
    });
  },

  // Collections & Saved
  async getCollections(name?: string) {
    const q = name ? `?collection_name=${encodeURIComponent(name)}` : '';
    return request<any[]>(`/api/collections${q}`);
  },

  async saveProduct(productId: string, collectionName: string = 'Favorites', notes: string = '') {
    return request<any>('/api/collections/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, collection_name: collectionName, notes })
    });
  },

  async toggleShoppingItem(savedId: string, completed: boolean) {
    return request<any>(`/api/collections/${savedId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
  },

  async deleteSavedProduct(savedId: string) {
    return request<any>(`/api/collections/${savedId}`, {
      method: 'DELETE'
    });
  },

  // Analytics
  async getAnalytics() {
    return request<any>('/api/collections/analytics');
  }
};
