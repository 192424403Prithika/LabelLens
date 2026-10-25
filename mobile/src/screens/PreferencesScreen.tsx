import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert 
} from 'react-native';
import { SlidersHorizontal, Check, ShieldAlert, Sparkles, Plus, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface PreferencesScreenProps {
  user: any;
  onPreferencesUpdated: (updatedUser: any) => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ user, onPreferencesUpdated }) => {
  const currentPrefs = user?.preferences || {};

  const [diet, setDiet] = useState<string[]>(currentPrefs.diet || ['Vegetarian']);
  const [allergens, setAllergens] = useState<string[]>(currentPrefs.allergens_to_avoid || ['Peanuts', 'Tree Nuts']);
  const [avoidList, setAvoidList] = useState<string[]>(currentPrefs.avoid_ingredients || ['High Fructose Corn Syrup']);
  const [maxSugar, setMaxSugar] = useState(String(currentPrefs.max_sugar_g || 12));
  const [maxSodium, setMaxSodium] = useState(String(currentPrefs.max_sodium_mg || 250));
  const [newAvoid, setNewAvoid] = useState('');
  const [saving, setSaving] = useState(false);

  const availableDiets = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher'];
  const commonAllergens = ['Peanuts', 'Tree Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame'];

  const toggleDiet = (d: string) => {
    setDiet(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleAllergen = (a: string) => {
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const addAvoidItem = () => {
    if (newAvoid.trim() && !avoidList.includes(newAvoid.trim())) {
      setAvoidList(prev => [...prev, newAvoid.trim()]);
      setNewAvoid('');
    }
  };

  const removeAvoidItem = (item: string) => {
    setAvoidList(prev => prev.filter(x => x !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        diet,
        allergens_to_avoid: allergens,
        avoid_ingredients: avoidList,
        monitor_ingredients: currentPrefs.monitor_ingredients || [],
        find_ingredients: currentPrefs.find_ingredients || [],
        max_sugar_g: parseFloat(maxSugar) || 12.0,
        max_sodium_mg: parseFloat(maxSodium) || 250.0,
        max_sat_fat_g: currentPrefs.max_sat_fat_g || 3.0,
        min_protein_g: currentPrefs.min_protein_g || 4.0,
        min_fiber_g: currentPrefs.min_fiber_g || 3.0
      };

      await mobileApi.updatePreferences(payload);
      Alert.alert('Preferences Updated', 'Your personalized rules have been saved and will guide future label scans.');
      onPreferencesUpdated({ ...user, preferences: payload });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenTitle}>My Preferences & Watchlist</Text>
      <Text style={styles.screenSub}>
        Configure dietary standards, allergen exclusions, and custom monitored ingredients.
      </Text>

      {/* 1. Dietary Standards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Dietary Standard</Text>
        <View style={styles.pillWrap}>
          {availableDiets.map((d) => {
            const active = diet.includes(d);
            return (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDiet(d)}
                style={[styles.pill, active && styles.activePill]}
              >
                {active && <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                <Text style={[styles.pillText, active && styles.activePillText]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Allergen Exclusions */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: colors.dangerText }]}>
        <View style={styles.headerRow}>
          <ShieldAlert size={18} color={colors.dangerText} />
          <Text style={styles.cardTitle}>2. Exclude Allergens</Text>
        </View>
        <Text style={styles.cardSubText}>
          Any detected mention or synonym will trigger high-priority alerts.
        </Text>

        <View style={styles.pillWrap}>
          {commonAllergens.map((a) => {
            const active = allergens.includes(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => toggleAllergen(a)}
                style={[styles.pill, active && styles.dangerPill]}
              >
                {active && <Check size={14} color={colors.dangerText} style={{ marginRight: 4 }} />}
                <Text style={[styles.pillText, active && styles.dangerPillText]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Custom Ingredient Watchlist */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Sparkles size={18} color={colors.tangerine} />
          <Text style={styles.cardTitle}>3. Custom Ingredient Watchlist</Text>
        </View>
        <Text style={styles.cardSubText}>
          Ingredients to avoid (e.g. artificial sweeteners, palm oil, additives):
        </Text>

        <View style={styles.addInputRow}>
          <TextInput
            placeholder="Add ingredient (e.g. Palm Oil)..."
            placeholderTextColor={colors.secondaryText}
            value={newAvoid}
            onChangeText={setNewAvoid}
            style={styles.addInput}
          />
          <TouchableOpacity onPress={addAvoidItem} style={styles.addBtn}>
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.pillWrap}>
          {avoidList.map((item) => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <TouchableOpacity onPress={() => removeAvoidItem(item)}>
                <X size={14} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* 4. Threshold Limits */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>4. Nutritional Thresholds</Text>
        
        <View style={styles.threshRow}>
          <View style={styles.threshCol}>
            <Text style={styles.threshLabel}>Max Sugar / Serving (g)</Text>
            <TextInput
              value={maxSugar}
              onChangeText={setMaxSugar}
              keyboardType="numeric"
              style={styles.threshInput}
            />
          </View>

          <View style={styles.threshCol}>
            <Text style={styles.threshLabel}>Max Sodium / Serving (mg)</Text>
            <TextInput
              value={maxSodium}
              onChangeText={setMaxSodium}
              keyboardType="numeric"
              style={styles.threshInput}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
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
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
  },
  screenSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  cardSubText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSub,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activePill: {
    backgroundColor: colors.forestGreen,
    borderColor: colors.forestGreen,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  dangerPill: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerText,
  },
  dangerPillText: {
    color: colors.dangerText,
    fontWeight: '700',
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.cardSub,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.primaryText,
  },
  addBtn: {
    backgroundColor: colors.forestGreen,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardSub,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  threshRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  threshCol: {
    flex: 1,
  },
  threshLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  threshInput: {
    backgroundColor: colors.cardSub,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  saveBtn: {
    backgroundColor: colors.forestGreen,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
