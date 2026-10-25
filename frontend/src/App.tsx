import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { ScanView } from './views/ScanView';
import { ProductDetailView } from './views/ProductDetailView';
import { CompareView } from './views/CompareView';
import { PreferencesView } from './views/PreferencesView';
import { HistoryView } from './views/HistoryView';
import { EvaluationView } from './views/EvaluationView';
import { api } from './api';
import type { Product, UserProfile, DietaryPreferences } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const [u, p] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getProducts().catch(() => [])
      ]);
      setUser(u);
      setProducts(p);
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromProduct = () => {
    setSelectedProductId(null);
  };

  const handleToggleCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products at a time. Please remove one first.");
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleTabChange = (tab: string) => {
    setSelectedProductId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanCompleted = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handlePreferencesUpdated = (prefs: DietaryPreferences) => {
    if (user) {
      setUser({ ...user, preferences: prefs });
    }
  };

  const handleHeaderSearch = (query: string) => {
    setSearchQuery(query);
    if (currentTab !== 'dashboard') {
      setCurrentTab('dashboard');
      setSelectedProductId(null);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Left Persistent Sidebar matching reference design */}
      <Sidebar 
        currentTab={selectedProductId ? '' : currentTab} 
        setCurrentTab={handleTabChange} 
        user={user} 
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header matching reference design */}
        <Header 
          user={user} 
          onSearch={handleHeaderSearch}
          onScanClick={() => handleTabChange('scan')}
        />

        {/* View Content */}
        <main style={{ flex: 1 }}>
          {selectedProductId ? (
            <ProductDetailView
              productId={selectedProductId}
              onBack={handleBackFromProduct}
              user={user}
              onNavigateProduct={handleSelectProduct}
              onToggleCompare={handleToggleCompare}
              isCompared={compareList.includes(selectedProductId)}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  products={products}
                  user={user}
                  onSelectProduct={handleSelectProduct}
                  onNavigateTab={handleTabChange}
                  compareList={compareList}
                  onToggleCompare={handleToggleCompare}
                  searchQuery={searchQuery}
                />
              )}

              {currentTab === 'landing' && (
                <LandingView
                  onScanClick={() => handleTabChange('scan')}
                  onSelectProduct={handleSelectProduct}
                  products={products}
                  onNavigateTab={handleTabChange}
                />
              )}

              {currentTab === 'scan' && (
                <ScanView
                  onScanCompleted={handleScanCompleted}
                />
              )}

              {currentTab === 'compare' && (
                <CompareView
                  compareList={compareList}
                  allProducts={products}
                  onRemoveFromCompare={(id) => setCompareList((prev) => prev.filter((x) => x !== id))}
                  onAddToCompare={(id) => handleToggleCompare(id)}
                  onInspectProduct={handleSelectProduct}
                />
              )}

              {currentTab === 'preferences' && (
                <PreferencesView
                  user={user}
                  onPreferencesUpdated={handlePreferencesUpdated}
                />
              )}

              {currentTab === 'history' && (
                <HistoryView
                  onInspectProduct={handleSelectProduct}
                />
              )}

              {currentTab === 'evaluation' && (
                <EvaluationView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
