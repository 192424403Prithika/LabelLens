import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { History, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface HistoryScreenProps {
  onBack: () => void;
  onSelectScan: (scan: any) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onSelectScan }) => {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.getScanHistory();
      setScans(res || []);
    } catch (err: any) {
      console.log('Error loading scan history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      await mobileApi.deleteScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      Alert.alert('Deleted', 'Scan record removed from your history.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete scan');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Packaging Scan Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.screenSub}>
        Chronological archive of photos, OCR text output, and manual field corrections.
      </Text>

      {scans.length === 0 ? (
        <View style={styles.emptyCard}>
          <History size={36} color={colors.secondaryText} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No Scans Recorded Yet</Text>
          <Text style={styles.emptySub}>
            Take packaging photos or scan barcodes to build your verified label history.
          </Text>
        </View>
      ) : (
        scans.map((s) => (
          <View key={s.id} style={styles.scanCard}>
            <Image 
              source={{ uri: s.image_url ? `${mobileApi.getProduct ? '' : ''}${s.image_url}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' }} 
              style={styles.scanThumb} 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.scanName} numberOfLines={1}>
                {s.extracted_product_name || s.original_filename}
              </Text>
              <Text style={styles.scanMeta}>
                OCR Confidence: {Math.round((s.ocr_confidence || 0.95) * 100)}% &bull; {s.status || 'Verified'}
              </Text>
              {s.corrections_made && (
                <View style={styles.correctedBadge}>
                  <Text style={styles.correctedBadgeText}>Human Corrected</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDeleteScan(s.id)} style={styles.deleteBtn}>
              <Trash2 size={18} color={colors.dangerText} />
            </TouchableOpacity>
          </View>
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
  emptySub: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  scanThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.cardSub,
  },
  scanName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  scanMeta: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  correctedBadge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  correctedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warningText,
  },
  deleteBtn: {
    padding: 6,
  }
});
