import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Trophy, ArrowLeft, Trash2, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface CompareScreenProps {
  compareList: string[];
  allProducts: any[];
  onRemoveFromCompare: (id: string) => void;
  onInspectProduct: (product: any) => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({
  compareList,
  allProducts,
  onRemoveFromCompare,
  onInspectProduct
}) => {
  const [selectedGoal, setSelectedGoal] = useState('Lower Sugar');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const goals = ['Lower Sugar', 'Higher Fiber', 'Lower Sodium', 'Higher Protein', 'Healthiest Overall'];

  const selectedProducts = compareList
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (selectedProducts.length >= 2) {
      runComparison();
    } else {
      setResult(null);
    }
  }, [compareList, selectedGoal]);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.compareProducts(compareList, selectedGoal);
      setResult(res);
    } catch (err: any) {
      console.log('Compare error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenTitle}>Product Comparison Engine</Text>
      <Text style={styles.screenSub}>
        Compare 2 or 3 foods on consistent serving basis against personal goals.
      </Text>

      {/* Goal Selectors */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsRow}>
        {goals.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setSelectedGoal(g)}
            style={[styles.goalPill, selectedGoal === g && styles.activeGoalPill]}
          >
            <Text style={[styles.goalPillText, selectedGoal === g && styles.activeGoalPillText]}>
              Goal: {g}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Products Strip */}
      <View style={styles.stripRow}>
        {selectedProducts.map((p) => (
          <View key={p.id} style={styles.stripCard}>
            <Image source={{ uri: p.image_url }} style={styles.stripThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stripName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.stripBrand}>{p.brand}</Text>
            </View>
            <TouchableOpacity onPress={() => onRemoveFromCompare(p.id)} style={styles.trashBtn}>
              <Trash2 size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {selectedProducts.length < 2 ? (
        <View style={styles.emptyCard}>
          <AlertCircle size={36} color={colors.secondaryText} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>Select At Least 2 Products</Text>
          <Text style={styles.emptySub}>
            You currently have {selectedProducts.length} product selected. Tap "Compare" on food detail cards to evaluate them side by side.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.forestGreen} size="large" />
          <Text style={styles.loadingText}>Computing nutrition deltas...</Text>
        </View>
      ) : result ? (
        <View style={styles.resultSection}>
          {/* Winner Banner */}
          <View style={styles.winnerCard}>
            <View style={styles.trophyCircle}>
              <Trophy size={24} color="#000000" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.winnerBadge}>
                <Text style={styles.winnerBadgeText}>Top Recommended Match</Text>
              </View>
              <Text style={styles.winnerName}>{result.winner_name} ({result.winner_brand})</Text>
              <Text style={styles.winnerRationale}>{result.recommendation_rationale}</Text>
            </View>
          </View>

          {/* Matrix Table */}
          <View style={styles.matrixCard}>
            <Text style={styles.matrixTitle}>Difference Matrix</Text>
            
            {result.comparison_matrix?.map((row: any, idx: number) => (
              <View key={idx} style={styles.matrixRow}>
                <Text style={styles.matrixNutrient}>{row.nutrient} ({row.unit})</Text>
                <View style={styles.matrixValues}>
                  {selectedProducts.map((p) => (
                    <Text key={p.id} style={styles.matrixVal}>
                      {row.values[p.id] !== undefined ? row.values[p.id] : '—'}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  goalsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  goalPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeGoalPill: {
    backgroundColor: colors.forestGreen,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  activeGoalPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stripRow: {
    gap: 8,
    marginBottom: 16,
  },
  stripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  stripThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardSub,
  },
  stripName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  stripBrand: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  trashBtn: {
    padding: 6,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
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
  emptySub: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.forestGreen,
    fontWeight: '600',
    marginTop: 10,
  },
  resultSection: {
    gap: 14,
  },
  winnerCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.paleMint,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 77, 54, 0.2)',
  },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tangerine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forestGreen,
  },
  winnerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
  },
  winnerRationale: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 16,
  },
  matrixCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 12,
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matrixNutrient: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
  },
  matrixValues: {
    flexDirection: 'row',
    gap: 16,
  },
  matrixVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forestGreen,
    minWidth: 40,
    textAlign: 'right',
  }
});
