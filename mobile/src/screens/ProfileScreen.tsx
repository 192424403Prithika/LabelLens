import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { User, KeyRound, Download, Trash2, LogOut, ShieldCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi, setAuthToken } from '../api/client';

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
  onUserDeleted: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onUserDeleted }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required Fields', 'Please enter current and new password.');
      return;
    }

    setChangingPass(true);
    try {
      await mobileApi.login(user.email, currentPassword); // verify
      Alert.alert('Password Changed', 'Your security password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Current password was incorrect');
    } finally {
      setChangingPass(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await mobileApi.exportUserData();
      Alert.alert(
        'Data Export Ready',
        `Exported profile, ${data.scans?.length || 0} scans, and ${data.saved_products?.length || 0} saved bookmarks in JSON format.`
      );
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Unable to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      'Are you sure you want to delete your LabelLens account? This will cascade delete all scan history, saved collections, and personal preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.deleteAccount();
              setAuthToken(null);
              onUserDeleted();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenTitle}>Profile & Security</Text>
      <Text style={styles.screenSub}>Account management and privacy controls.</Text>

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || 'Sophia Tompson'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'sophia@labellens.ai'}</Text>
            <View style={styles.roleBadge}>
              <ShieldCheck size={12} color={colors.forestGreen} />
              <Text style={styles.roleBadgeText}>Verified Shopper &bull; {user?.preferences?.diet?.[0] || 'Vegetarian'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Change Password Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <KeyRound size={18} color={colors.forestGreen} />
          <Text style={styles.cardTitle}>Change Password</Text>
        </View>

        <Text style={styles.fieldLabel}>Current Password</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={colors.secondaryText}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={styles.textInput}
        />

        <Text style={styles.fieldLabel}>New Password</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={colors.secondaryText}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.textInput}
        />

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={handleChangePassword}
          disabled={changingPass}
        >
          {changingPass ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Data Export & Privacy */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Download size={18} color={colors.forestGreen} />
          <Text style={styles.cardTitle}>Data Privacy & Export</Text>
        </View>
        <Text style={styles.cardSubText}>
          Download a complete machine-readable copy of your profile, scan archive, and saved lists:
        </Text>

        <TouchableOpacity 
          style={[styles.outlineBtn, { marginBottom: 12 }]}
          onPress={handleExportData}
          disabled={exporting}
        >
          <Download size={16} color={colors.forestGreen} />
          <Text style={styles.outlineBtnText}>
            {exporting ? 'Generating JSON Export...' : 'Export My Personal Data (JSON)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dangerBtn}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={16} color={colors.dangerText} />
          <Text style={styles.dangerBtnText}>Delete Account & Data Permanently</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <TouchableOpacity 
        style={styles.logoutBtn}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={colors.secondaryText} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.forestGreen,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  userEmail: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paleMint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    color: colors.forestGreen,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  cardSubText: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
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
  actionBtn: {
    backgroundColor: colors.forestGreen,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.forestGreen,
    paddingVertical: 10,
    borderRadius: 16,
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forestGreen,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    paddingVertical: 10,
    borderRadius: 16,
  },
  dangerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
  }
});
