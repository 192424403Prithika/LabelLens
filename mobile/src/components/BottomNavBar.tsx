import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LayoutGrid, Scan, Layers, Bookmark, User } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface BottomNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutGrid },
    { id: 'scan', label: 'Scan', icon: Scan },
    { id: 'compare', label: 'Compare', icon: Layers },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        const isScan = tab.id === 'scan';

        if (isScan) {
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab.id)}
              style={styles.scanButtonContainer}
            >
              <View style={styles.scanButton}>
                <Scan size={26} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <Text style={[styles.tabLabel, { color: colors.forestGreen, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabItem}
          >
            <Icon 
              size={22} 
              color={isActive ? colors.forestGreen : colors.secondaryText} 
              strokeWidth={isActive ? 2.4 : 1.8} 
            />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.forestGreen,
    fontWeight: '700',
  },
  scanButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  scanButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  }
});
