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
import { Bookmark, CheckSquare, Square, Trash2, Eye } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface SavedScreenProps {
  onInspectProduct: (product: any) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onInspectProduct }) => {
  const [activeSubTab, setActiveSubTab] = useState<'shopping' | 'favorites'>('shopping');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedItems();
  }, [activeSubTab]);

  const loadSavedItems = async () => {
    setLoading(true);
    try {
      const colName = activeSubTab === 'shopping' ? 'Shopping List' : 'Favorites';
      const res = await mobileApi.getCollections(colName);
      setItems(res || []);
    } catch (err: any) {
      console.log('Error loading saved items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: any) => {
    try {
      const nextState = !item.completed;
      await mobileApi.toggleShoppingItem(item.id, nextState);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: nextState } : i));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle item');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await mobileApi.deleteSavedProduct(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenTitle}>Saved & Shopping Lists</Text>
      <Text style={styles.screenSub}>Manage your curated food collections and grocery items.</Text>

      {/* Sub Tabs */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'shopping' && styles.activeSubTab]}
          onPress={() => setActiveSubTab('shopping')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'shopping' && styles.activeSubTabText]}>
            Shopping List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'favorites' && styles.activeSubTab]}
          onPress={() => setActiveSubTab('favorites')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'favorites' && styles.activeSubTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items list or empty state */}
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Bookmark size={36} color={colors.secondaryText} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>
            No items in {activeSubTab === 'shopping' ? 'Shopping List' : 'Favorites'}
          </Text>
          <Text style={styles.emptySub}>
            Save verified food items from product inspection screens to organize your shopping.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {activeSubTab === 'shopping' && (
              <TouchableOpacity onPress={() => handleToggle(item)} style={{ paddingRight: 8 }}>
                {item.completed ? (
                  <CheckSquare size={20} color={colors.forestGreen} />
                ) : (
                  <Square size={20} color={colors.secondaryText} />
                )}
              </TouchableOpacity>
            )}

            <Image 
              source={{ uri: item.product?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' }} 
              style={styles.itemThumb} 
            />

            <View style={{ flex: 1 }}>
              <Text 
                style={[styles.itemName, item.completed && { textDecorationLine: 'line-through', color: colors.secondaryText }]}
                numberOfLines={1}
              >
                {item.product?.name || 'Saved Product'}
              </Text>
              <Text style={styles.itemBrand}>{item.product?.brand || 'Brand'}</Text>
            </View>

            <View style={styles.actionRow}>
              {item.product && (
                <TouchableOpacity onPress={() => onInspectProduct(item.product)} style={styles.iconAction}>
                  <Eye size={18} color={colors.primaryText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconAction}>
                <Trash2 size={18} color={colors.dangerText} />
              </TouchableOpacity>
            </View>
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
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 18,
  },
  activeSubTab: {
    backgroundColor: colors.paleMint,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  activeSubTabText: {
    color: colors.forestGreen,
    fontWeight: '700',
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.cardSub,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  itemBrand: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    padding: 6,
  }
});
