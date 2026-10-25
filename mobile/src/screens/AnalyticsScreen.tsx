import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { BarChart3, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface AnalyticsScreenProps {
  onBack: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    mobileApi.getAnalytics().then(res => setData(res)).catch(() => null);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Personal Food Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.screenSub}>
        Nutrition and ingredient compliance calculated strictly from your verified scans.
      </Text>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{data?.total_scans || 0}</Text>
          <Text style={styles.kpiLabel}>Total Scans</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{data?.overall_compliance_percent || 0}%</Text>
          <Text style={styles.kpiLabel}>Compliance</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{data?.total_saved || 0}</Text>
          <Text style={styles.kpiLabel}>Bookmarked</Text>
        </View>
      </View>

      {/* Flagged Ingredients List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Frequently Flagged Ingredients</Text>
        {(!data?.flagged_ingredients || data.flagged_ingredients.length === 0) ? (
          <Text style={styles.emptyNote}>
            No flagged ingredients yet. Your scans currently satisfy your allergen and preference rules.
          </Text>
        ) : (
          data.flagged_ingredients.map((item: any, idx: number) => (
            <View key={idx} style={styles.flagRow}>
              <AlertTriangle size={16} color={colors.dangerText} />
              <Text style={styles.flagName}>{item.ingredient}</Text>
              <Text style={styles.flagCount}>{item.flag_count}x detected</Text>
            </View>
          ))
        )}
      </View>

      {/* Scanned Categories Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scanned Food Categories</Text>
        {(!data?.scanned_categories || data.scanned_categories.length === 0) ? (
          <Text style={styles.emptyNote}>
            No categories logged yet. Scan packaged foods to see category distribution.
          </Text>
        ) : (
          data.scanned_categories.map((c: any, idx: number) => (
            <View key={idx} style={styles.catRow}>
              <Text style={styles.catName}>{c.category}</Text>
              <Text style={styles.catCount}>{c.count} items</Text>
            </View>
          ))
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
  screenSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
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
    marginBottom: 10,
  },
  emptyNote: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flagName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  flagCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  catCount: {
    fontSize: 12,
    color: colors.forestGreen,
    fontWeight: '700',
  }
});
