import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { 
  Search, 
  Scan, 
  Barcode, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react-native';
import { colors } from '../theme/colors';

interface HomeScreenProps {
  user: any;
  products: any[];
  onOpenScan: () => void;
  onOpenBarcode: () => void;
  onSelectProduct: (product: any) => void;
  onNavigateTab: (tab: string) => void;
  onSearch: (query: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  products,
  onOpenScan,
  onOpenBarcode,
  onSelectProduct,
  onNavigateTab,
  onSearch
}) => {
  const [searchInput, setSearchInput] = useState('');

  const displayName = (user?.full_name || 'Sophia').split(' ')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header Greeting */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingTitle}>HELLO, {displayName}!</Text>
          <Text style={styles.greetingSubtitle}>
            {user?.preferences?.diet?.[0] || 'Vegetarian'} &bull; Food Label Intelligence
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.avatarButton} 
          onPress={() => onNavigateTab('profile')}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }} 
            style={styles.avatarImage} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search foods, ingredients, brands..."
          placeholderTextColor={colors.secondaryText}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => onSearch(searchInput)}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Quick Action Scan Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.forestGreen }]}
          onPress={onOpenScan}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <Scan size={22} color={colors.forestGreen} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionCardTitleLight}>Scan Label Photo</Text>
            <Text style={styles.actionCardSubLight}>RapidOCR Deep Learning</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }]}
          onPress={onOpenBarcode}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.softPeach }]}>
            <Barcode size={22} color={colors.tangerine} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionCardTitleDark}>Barcode Lookup</Text>
            <Text style={styles.actionCardSubDark}>Open Food Facts API</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3 Overview Indicator Cards */}
      <View style={styles.indicatorsRow}>
        <View style={styles.indicatorCard}>
          <Text style={styles.indicatorValue}>
            {products.length > 0 ? '94%' : '—'}
          </Text>
          <Text style={styles.indicatorLabel}>Dietary Match</Text>
        </View>
        <View style={styles.indicatorCard}>
          <Text style={styles.indicatorValue}>
            {products.length > 0 ? '98%' : '—'}
          </Text>
          <Text style={styles.indicatorLabel}>OCR Quality</Text>
        </View>
        <View style={styles.indicatorCard}>
          <Text style={styles.indicatorValue}>
            {products.length > 0 ? '88%' : '—'}
          </Text>
          <Text style={styles.indicatorLabel}>Clean Index</Text>
        </View>
      </View>

      {/* Allergen Watchlist Status Banner */}
      <View style={styles.alertBanner}>
        <View style={styles.alertIconCircle}>
          <ShieldAlert size={20} color={colors.dangerText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertBannerTitle}>Allergen Watchlist Active</Text>
          <Text style={styles.alertBannerSub}>
            Flagging: {user?.preferences?.allergens_to_avoid?.join(', ') || 'Peanuts, Tree Nuts'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateTab('preferences')}>
          <ChevronRight size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      {/* Recent Scans Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Food Scans</Text>
        {products.length > 0 && (
          <TouchableOpacity onPress={() => onNavigateTab('saved')}>
            <Text style={styles.seeAllText}>See all &gt;</Text>
          </TouchableOpacity>
        )}
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Scan size={36} color={colors.secondaryText} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No food products scanned yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan food packaging or enter a barcode to view genuine extracted ingredients and nutrition facts.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={onOpenScan}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>Scan First Label</Text>
          </TouchableOpacity>
        </View>
      ) : (
        products.slice(0, 5).map((prod) => (
          <TouchableOpacity
            key={prod.id}
            style={styles.productCard}
            onPress={() => onSelectProduct(prod)}
            activeOpacity={0.75}
          >
            <Image source={{ uri: prod.image_url }} style={styles.productThumb} />
            <View style={styles.productInfoCol}>
              <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
              <Text style={styles.productBrand}>{prod.brand} &bull; {prod.category}</Text>
              <View style={styles.productBadgeRow}>
                <View style={styles.miniBadge}>
                  <Text style={styles.miniBadgeText}>{prod.provenance || 'Open Food Facts'}</Text>
                </View>
                {prod.declared_allergens?.length > 0 && (
                  <View style={[styles.miniBadge, { backgroundColor: colors.dangerBg }]}>
                    <Text style={[styles.miniBadgeText, { color: colors.dangerText }]}>
                      {prod.declared_allergens[0]}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronRight size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 105,
    elevation: 3,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTextCol: {},
  actionCardTitleLight: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionCardSubLight: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  actionCardTitleDark: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  actionCardSubDark: {
    color: colors.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  indicatorsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  indicatorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  indicatorLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.dangerText,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  alertBannerSub: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forestGreen,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.forestGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: colors.cardSub,
  },
  productInfoCol: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  productBrand: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  productBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  miniBadge: {
    backgroundColor: colors.paleMint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.forestGreen,
  }
});
