import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { CheckCircle2, ArrowLeft, Edit3, ShieldAlert } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface ReviewCorrectionScreenProps {
  scan: any;
  product: any;
  onBack: () => void;
  onSaved: (updatedProduct: any) => void;
}

export const ReviewCorrectionScreen: React.FC<ReviewCorrectionScreenProps> = ({
  scan,
  product,
  onBack,
  onSaved
}) => {
  const [productName, setProductName] = useState(scan?.extracted_product_name || product?.name || '');
  const [brand, setBrand] = useState(scan?.extracted_brand || product?.brand || '');
  const [servingDesc, setServingDesc] = useState(scan?.serving_description || '1 serving (100g)');
  const [calories, setCalories] = useState(String(scan?.nutrition_per_serving?.calories || product?.nutrition_per_serving?.calories || 0));
  const [protein, setProtein] = useState(String(scan?.nutrition_per_serving?.protein_g || product?.nutrition_per_serving?.protein_g || 0));
  const [fat, setFat] = useState(String(scan?.nutrition_per_serving?.fat_total_g || product?.nutrition_per_serving?.fat_total_g || 0));
  const [sugar, setSugar] = useState(String(scan?.nutrition_per_serving?.sugars_g || product?.nutrition_per_serving?.sugars_g || 0));
  const [fiber, setFiber] = useState(String(scan?.nutrition_per_serving?.fiber_g || product?.nutrition_per_serving?.fiber_g || 0));
  const [sodium, setSodium] = useState(String(scan?.nutrition_per_serving?.sodium_mg || product?.nutrition_per_serving?.sodium_mg || 0));
  const [ingredientsRaw, setIngredientsRaw] = useState(scan?.ingredients_raw || product?.ingredients_raw || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveCorrections = async () => {
    setSaving(true);
    try {
      const correctionData = {
        scan_id: scan.id,
        corrected_product_name: productName.trim(),
        corrected_brand: brand.trim(),
        corrected_serving_size: parseFloat(servingDesc) || 100.0,
        corrected_serving_unit: 'g',
        corrected_nutrition: {
          calories: parseFloat(calories) || 0.0,
          protein_g: parseFloat(protein) || 0.0,
          fat_total_g: parseFloat(fat) || 0.0,
          saturated_fat_g: 0.0,
          trans_fat_g: 0.0,
          carbohydrates_g: (parseFloat(sugar) || 0.0) + (parseFloat(fiber) || 0.0),
          sugars_g: parseFloat(sugar) || 0.0,
          added_sugars_g: 0.0,
          fiber_g: parseFloat(fiber) || 0.0,
          sodium_mg: parseFloat(sodium) || 0.0,
          cholesterol_mg: 0.0
        },
        corrected_ingredients_raw: ingredientsRaw.trim(),
        feedback_notes: notes.trim() || 'Verified on mobile screen'
      };

      const res = await mobileApi.correctScan(correctionData);
      Alert.alert('Verification Saved', 'Extracted food label data updated and verified in database.');
      
      const updatedProduct = {
        ...(product || {}),
        name: productName.trim(),
        brand: brand.trim(),
        ingredients_raw: ingredientsRaw.trim(),
        nutrition_per_serving: correctionData.corrected_nutrition
      };
      onSaved(updatedProduct);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save field corrections');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Review Extracted Label</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.banner}>
        <Edit3 size={18} color={colors.forestGreen} />
        <Text style={styles.bannerText}>
          RapidOCR extracted values below. Correct any blurry or partial fields before finalizing.
        </Text>
      </View>

      {/* Product Details Form */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Product Name</Text>
        <TextInput
          value={productName}
          onChangeText={setProductName}
          style={styles.textInput}
        />

        <Text style={styles.fieldLabel}>Brand</Text>
        <TextInput
          value={brand}
          onChangeText={setBrand}
          style={styles.textInput}
        />

        <Text style={styles.fieldLabel}>Serving Description</Text>
        <TextInput
          value={servingDesc}
          onChangeText={setServingDesc}
          style={styles.textInput}
        />
      </View>

      {/* Nutrition Facts Grid */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nutrition Facts (Per Serving)</Text>
        
        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Calories (kcal)</Text>
            <TextInput
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Protein (g)</Text>
            <TextInput
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>
        </View>

        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Total Fat (g)</Text>
            <TextInput
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Total Sugars (g)</Text>
            <TextInput
              value={sugar}
              onChangeText={setSugar}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>
        </View>

        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Fiber (g)</Text>
            <TextInput
              value={fiber}
              onChangeText={setFiber}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Sodium (mg)</Text>
            <TextInput
              value={sodium}
              onChangeText={setSodium}
              keyboardType="numeric"
              style={styles.gridInput}
            />
          </View>
        </View>
      </View>

      {/* Raw Ingredients Textarea */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Extracted Ingredients Text</Text>
        <TextInput
          value={ingredientsRaw}
          onChangeText={setIngredientsRaw}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveCorrections}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <CheckCircle2 size={18} color="#FFFFFF" />
        )}
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving to Database...' : 'Confirm & Save Analysis'}
        </Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.paleMint,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.forestGreen,
    fontWeight: '600',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.cardSub,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.primaryText,
    marginBottom: 10,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  gridInput: {
    backgroundColor: colors.cardSub,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  textArea: {
    backgroundColor: colors.cardSub,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.primaryText,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
