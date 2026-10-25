import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { colors } from './src/theme/colors';
import { mobileApi } from './src/api/client';
import { BottomNavBar } from './src/components/BottomNavBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ReviewCorrectionScreen } from './src/screens/ReviewCorrectionScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { PreferencesScreen } from './src/screens/PreferencesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [activeReviewScan, setActiveReviewScan] = useState<{ scan: any; product: any } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    setLoading(true);
    try {
      // 1. Load user profile
      const userProfile = await mobileApi.getMe().catch(() => null);
      if (userProfile) {
        setUser(userProfile);
      }

      // 2. Load products from backend (live Open Food Facts & verified scans)
      const prods = await mobileApi.getProducts().catch(() => []);
      setProducts(prods || []);
    } catch (err: any) {
      console.log('Bootstrap error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 3) {
          Alert.alert('Comparison Limit', 'You can compare up to 3 products simultaneously.');
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleScanCompleted = (scan: any, product: any) => {
    setActiveReviewScan({ scan, product });
  };

  const handleCorrectionSaved = (updatedProduct: any) => {
    setActiveReviewScan(null);
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === updatedProduct.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProduct;
        return next;
      }
      return [updatedProduct, ...prev];
    });
    setActiveProduct(updatedProduct);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      bootstrapApp();
      return;
    }
    setLoading(true);
    try {
      const results = await mobileApi.getProducts({ search: query.trim() });
      setProducts(results || []);
    } catch (err: any) {
      Alert.alert('Search', 'No products found matching query.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user && products.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.warmCream} />
        <ActivityIndicator size="large" color={colors.forestGreen} />
      </SafeAreaView>
    );
  }

  // Active Screen Renderer
  const renderCurrentScreen = () => {
    // 1. Review & Correction Workspace
    if (activeReviewScan) {
      return (
        <ReviewCorrectionScreen
          scan={activeReviewScan.scan}
          product={activeReviewScan.product}
          onBack={() => setActiveReviewScan(null)}
          onSaved={handleCorrectionSaved}
        />
      );
    }

    // 2. Product Detail Inspection
    if (activeProduct) {
      return (
        <ProductDetailScreen
          product={activeProduct}
          onBack={() => setActiveProduct(null)}
          onAddToCompare={handleToggleCompare}
          isInCompare={compareList.includes(activeProduct.id)}
        />
      );
    }

    // 3. Tab Screens
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            user={user}
            products={products}
            onOpenScan={() => setCurrentTab('scan')}
            onOpenBarcode={() => setCurrentTab('scan')}
            onSelectProduct={(p) => setActiveProduct(p)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSearch={handleSearch}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            onBack={() => setCurrentTab('home')}
            onScanComplete={handleScanCompleted}
          />
        );
      case 'compare':
        return (
          <CompareScreen
            compareList={compareList}
            allProducts={products}
            onRemoveFromCompare={(id) => handleToggleCompare(id)}
            onInspectProduct={(p) => setActiveProduct(p)}
          />
        );
      case 'saved':
        return (
          <SavedScreen
            onInspectProduct={(p) => setActiveProduct(p)}
          />
        );
      case 'preferences':
        return (
          <PreferencesScreen
            user={user}
            onPreferencesUpdated={(updated) => setUser(updated)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onLogout={() => {
              setUser(null);
              bootstrapApp();
            }}
            onUserDeleted={() => {
              setUser(null);
              setProducts([]);
              bootstrapApp();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.warmCream} />
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      {!activeProduct && !activeReviewScan && currentTab !== 'scan' && (
        <BottomNavBar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setActiveProduct(null);
            setActiveReviewScan(null);
            setCurrentTab(tab);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  content: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
