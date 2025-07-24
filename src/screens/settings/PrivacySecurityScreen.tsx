import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { privacyService, LoginHistoryEntry, SessionInfo } from '../../services/privacy';
import { format } from 'date-fns';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity';

interface PrivacySecurityScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'password' | 'history' | 'session'>('password');
  const [loading, setLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    content: {
      padding: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
    title: {
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[6],
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[4],
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: isSmallScreen ? theme.spacing[3] : theme.spacing[4],
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[900],
      ...theme.elevation.sm,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      marginBottom: theme.spacing[4],
    },
    inputContainer: {
      position: 'relative',
    },
    showPasswordButton: {
      position: 'absolute',
      right: theme.spacing[4],
      top: '50%',
      transform: [{ translateY: -10 }],
      zIndex: 1,
    },
    showPasswordText: {
      fontSize: 14,
      color: theme.colors.primary[600],
      fontWeight: '500',
    },
  });

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadLoginHistory();
    } else if (activeTab === 'session') {
      loadSessionInfo();
    }
  }, [activeTab]);

  const loadLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      // Add a test login entry for debugging
      await privacyService.trackLogin(true);
      
      const { data, error } = await privacyService.getLoginHistory(20);
      if (error) {
        Alert.alert('Error', error);
      } else {
        setLoginHistory(data || []);
        console.log('Login history loaded:', data?.length || 0, 'entries');
      }
    } catch (error) {
      console.error('Error loading login history:', error);
      Alert.alert('Error', 'Failed to load login history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSessionInfo = async () => {
    setLoadingSession(true);
    try {
      const session = await privacyService.getCurrentSessionInfo();
      setSessionInfo(session);
    } catch (error) {
      console.error('Error loading session info:', error);
      Alert.alert('Error', 'Failed to load session information');
    } finally {
      setLoadingSession(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Required', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Required', 'Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Required', 'Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      console.log('[PrivacySecurityScreen] Attempting password change...');
      const { success, error } = await privacyService.changePassword(currentPassword, newPassword);
      
      if (success) {
        Alert.alert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
          }}
        ]);
      } else {
        Alert.alert('Error', error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutFromCurrentSession = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await privacyService.signOutFromCurrentSession();
            if (error) {
              Alert.alert('Error', error);
            } else {
              onNavigate?.('welcome');
            }
          }
        }
      ]
    );
  };

  const handleClearLoginHistory = () => {
    Alert.alert(
      'Clear Login History',
      'This will permanently delete all your login history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear History', 
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await privacyService.clearLoginHistory();
            if (success) {
              Alert.alert('Success', 'Login history cleared successfully');
              loadLoginHistory();
            } else {
              Alert.alert('Error', error || 'Failed to clear login history');
            }
          }
        }
      ]
    );
  };

  const formatLoginTime = (loginTime: string) => {
    try {
      return format(new Date(loginTime), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Unknown time';
    }
  };

  const renderPasswordTab = () => (
    <View>
      <Text style={responsiveStyles.sectionTitle}>🔐 Change Password</Text>
      <Text style={styles.sectionDescription}>
        Update your account password to keep your account secure.
      </Text>

      <View style={responsiveStyles.inputContainer}>
        <TextInput
          style={responsiveStyles.input}
          placeholder="Current Password"
          placeholderTextColor={theme.colors.neutral[400]}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showPassword}
          returnKeyType="next"
        />
        <TouchableOpacity 
          style={responsiveStyles.showPasswordButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={responsiveStyles.showPasswordText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={responsiveStyles.inputContainer}>
        <TextInput
          style={responsiveStyles.input}
          placeholder="New Password"
          placeholderTextColor={theme.colors.neutral[400]}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          returnKeyType="next"
        />
        <TouchableOpacity 
          style={responsiveStyles.showPasswordButton}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Text style={responsiveStyles.showPasswordText}>
            {showNewPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={responsiveStyles.inputContainer}>
        <TextInput
          style={responsiveStyles.input}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.colors.neutral[400]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          returnKeyType="done"
        />
        <TouchableOpacity 
          style={responsiveStyles.showPasswordButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text style={responsiveStyles.showPasswordText}>
            {showConfirmPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Change Password"
        variant="primary"
        size="lg"
        onPress={handleChangePassword}
        style={styles.changePasswordButton}
        loading={loading}
        disabled={loading}
      />
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      <View style={styles.historySectionHeader}>
        <Text style={responsiveStyles.sectionTitle}>📱 Login History</Text>
        <TouchableOpacity onPress={handleClearLoginHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionDescription}>
        Recent login activity on your account.
      </Text>

      {loadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading login history...</Text>
        </View>
      ) : loginHistory.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No login history found</Text>
        </Card>
      ) : (
        <View style={styles.historyList}>
          {loginHistory.map((entry, index) => (
            <Card key={entry.id} style={styles.historyItem}>
              <View style={styles.historyContent}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: entry.success ? theme.colors.success[500] : theme.colors.error[500] }
                    ]} />
                    <Text style={styles.historyTime}>
                      {formatLoginTime(entry.login_time)}
                    </Text>
                  </View>
                  <Text style={styles.historyDevice}>
                    {entry.device_info}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );

  const renderSessionTab = () => (
    <View>
      <Text style={responsiveStyles.sectionTitle}>🖥️ Current Session</Text>
      <Text style={styles.sectionDescription}>
        Information about your current session and device.
      </Text>

      {loadingSession ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>Loading session information...</Text>
        </View>
      ) : sessionInfo ? (
        <Card style={styles.sessionCard}>
          <View style={styles.sessionContent}>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Device:</Text>
              <Text style={styles.sessionValue}>{sessionInfo.deviceInfo}</Text>
            </View>
            
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Login Time:</Text>
              <Text style={styles.sessionValue}>
                {formatLoginTime(sessionInfo.loginTime)}
              </Text>
            </View>

            {sessionInfo.expiresAt && (
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Expires:</Text>
                <Text style={styles.sessionValue}>
                  {formatLoginTime(sessionInfo.expiresAt)}
                </Text>
              </View>
            )}
          </View>
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No session information available</Text>
        </Card>
      )}

      <Button
        title="Sign Out from This Device"
        variant="ghost"
        size="lg"
        onPress={handleSignOutFromCurrentSession}
        style={styles.signOutButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Modern Gradient Background */}
      <LinearGradient
        colors={['#FFF0F5', '#FFFFFF', '#F8F0FF']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={responsiveStyles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate?.('settings')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.title}>Privacy & Security</Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.activeTab]}
              onPress={() => setActiveTab('password')}
            >
              <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'session' && styles.activeTab]}
              onPress={() => setActiveTab('session')}
            >
              <Text style={[styles.tabText, activeTab === 'session' && styles.activeTabText]}>
                Session
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'password' && renderPasswordTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'session' && renderSessionTab()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },

  // Header
  header: {
    marginBottom: theme.spacing[6],
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing[4],
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary[600],
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[1],
    marginBottom: theme.spacing[6],
    ...theme.elevation.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary[100],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[600],
  },
  activeTabText: {
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: theme.spacing[6],
  },

  // Content
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },

  // Password
  changePasswordButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: theme.colors.primary[400],
    shadowOpacity: 0.3,
  },

  // History
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  clearButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.error[600],
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.neutral[500],
  },
  historyList: {
    gap: theme.spacing[3],
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  historyContent: {
    padding: theme.spacing[4],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing[2],
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[700],
  },
  historyDevice: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing[2],
  },

  // Session
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: theme.spacing[4],
  },
  sessionContent: {
    padding: theme.spacing[4],
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[700],
  },
  sessionValue: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing[2],
  },
  signOutButton: {
    borderColor: theme.colors.error[500],
    borderWidth: 1,
  },
});

export default PrivacySecurityScreen; 