import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { 
  ArrowLeft, 
  Bookmark, 
  Layers, 
  ShieldAlert, 
  Scale, 
  Info, 
  CheckCircle 
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface ProductDetailScreenProps {
  product: any;
  onBack: () => void;
  onAddToCompare: (productId: string) => void;
  isInCompare: boolean;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onAddToCompare,
  isInCompare
}) => {
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [portionLabel, setPortionLabel] = useState('1 Serving');
  const [isSaved, setIsSaved] = useState(false);

  const nutrients = product?.nutrition_per_serving || product?.nutrition_per_100g || {};

  const handleSaveToFavorites = async () => {
    try {
      await mobileApi.saveProduct(product.id, 'Favorites', 'Saved from mobile detail');
      setIsSaved(true);
      Alert.alert('Saved', `${product.name} added to your Favorites collection.`);
    } catch (err: any) {
      Alert.alert('Info', 'Product is already saved in your favorites.');
      setIsSaved(true);
    }
  };

  const setPortion = (mult: number, label: string) => {
    setPortionMultiplier(mult);
    setPortionLabel(label);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity 
            onPress={() => onAddToCompare(product.id)}
            style={[styles.iconBtn, isInCompare && { backgroundColor: colors.paleMint }]}
          >
            <Layers size={20} color={isInCompare ? colors.forestGreen : colors.primaryText} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSaveToFavorites}
            style={[styles.iconBtn, isSaved && { backgroundColor: colors.paleMint }]}
          >
            <Bookmark size={20} color={isSaved ? colors.forestGreen : colors.primaryText} fill={isSaved ? colors.forestGreen : 'none'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Hero Image & Header */}
      <View style={styles.heroCard}>
        <Image source={{ uri: product.image_url }} style={styles.heroImage} resizeMode="contain" />
        <View style={styles.heroTextCol}>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>
          <View style={styles.provenanceBadge}>
            <Text style={styles.provenanceText}>{product.provenance || 'Open Food Facts'}</Text>
          </View>
        </View>
      </View>

      {/* Allergen Warning Banner if present */}
      {product.declared_allergens && product.declared_allergens.length > 0 && (
        <View style={styles.allergenAlert}>
          <ShieldAlert size={20} color={colors.dangerText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.allergenTitle}>Declared Allergen Alert</Text>
            <Text style={styles.allergenDesc}>
              This product contains: {product.declared_allergens.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Portion Size Calculator (Feature #8) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Scale size={18} color={colors.forestGreen} />
          <Text style={styles.cardTitle}>Portion Size Calculator</Text>
        </View>
        <Text style={styles.cardSub}>Scale nutrients by custom consumption portion:</Text>
        
        <View style={styles.portionRow}>
          {[
            { label: '0.5x', mult: 0.5 },
            { label: '1 Serving', mult: 1 },
            { label: '1.5x', mult: 1.5 },
            { label: '2 Servings', mult: 2 },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => setPortion(item.mult, item.label)}
              style={[styles.portionBtn, portionMultiplier === item.mult && styles.activePortionBtn]}
            >
              <Text style={[styles.portionBtnText, portionMultiplier === item.mult && styles.activePortionBtnText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nutrition Facts Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition Facts ({portionLabel})</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{Math.round((nutrients.calories || 0) * portionMultiplier)}</Text>
            <Text style={styles.nutritionName}>Calories (kcal)</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{((nutrients.protein_g || 0) * portionMultiplier).toFixed(1)}g</Text>
            <Text style={styles.nutritionName}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{((nutrients.fat_total_g || 0) * portionMultiplier).toFixed(1)}g</Text>
            <Text style={styles.nutritionName}>Total Fat</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{((nutrients.carbohydrates_g || 0) * portionMultiplier).toFixed(1)}g</Text>
            <Text style={styles.nutritionName}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{((nutrients.sugars_g || 0) * portionMultiplier).toFixed(1)}g</Text>
            <Text style={styles.nutritionName}>Total Sugars</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionNum}>{Math.round((nutrients.sodium_mg || 0) * portionMultiplier)}mg</Text>
            <Text style={styles.nutritionName}>Sodium</Text>
          </View>
        </View>
      </View>

      {/* Parsed Ingredients Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredients Analysis</Text>
        <Text style={styles.cardSub}>Extracted from label and categorized by function:</Text>

        {product.ingredients_list && product.ingredients_list.length > 0 ? (
          product.ingredients_list.map((ing: any, idx: number) => (
            <View key={idx} style={styles.ingRow}>
              <View style={styles.ingDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ingName}>{ing.clean_name || ing.name}</Text>
                <Text style={styles.ingExpl}>{ing.explanation || 'Food ingredient'}</Text>
              </View>
              <View style={styles.ingBadge}>
                <Text style={styles.ingBadgeText}>{ing.category || 'Nutrient'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.rawText}>{product.ingredients_raw || 'Ingredients not provided.'}</Text>
        )}
      </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  heroTextCol: {
    alignItems: 'center',
  },
  productBrand: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: 2,
  },
  provenanceBadge: {
    backgroundColor: colors.paleMint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  provenanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forestGreen,
  },
  allergenAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dangerBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  allergenTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dangerText,
  },
  allergenDesc: {
    fontSize: 12,
    color: colors.dangerText,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  cardSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
    marginBottom: 12,
  },
  portionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portionBtn: {
    flex: 1,
    backgroundColor: colors.cardSub,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  activePortionBtn: {
    backgroundColor: colors.forestGreen,
  },
  portionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText,
  },
  activePortionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nutritionItem: {
    width: '30%',
    backgroundColor: colors.cardSub,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  nutritionNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  nutritionName: {
    fontSize: 10,
    color: colors.secondaryText,
    marginTop: 2,
    textAlign: 'center',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tangerine,
  },
  ingName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  ingExpl: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1,
  },
  ingBadge: {
    backgroundColor: colors.paleMint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ingBadgeText: {
    fontSize: 10,
    color: colors.forestGreen,
    fontWeight: '600',
  },
  rawText: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
  }
});
