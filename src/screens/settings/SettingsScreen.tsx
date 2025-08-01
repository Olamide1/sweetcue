import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { accountService } from '../../services/account';
import { authService } from '../../services/auth';
import EmailVerificationReminder from '../../components/EmailVerificationReminder';
import { MaterialIcons } from '@expo/vector-icons';

export type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity' | 'notifications' | 'helpSupport' | 'recentActivity';

interface SettingsScreenProps {
  onNavigate?: (screen: Screen) => void;
  subscriptionStatus?: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, subscriptionStatus }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState({
    reminders: 0,
    gestures: 0,
    partners: 0,
    hasProfile: false
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showEmailVerificationReminder, setShowEmailVerificationReminder] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;

  // Load deletion summary and check email verification on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingSummary(true);
      try {
        const summary = await accountService.getDeletionSummary();
        setDeletionSummary(summary);
        
        // Check email verification
        const user = await authService.getCurrentUser();
        if (user?.email) {
          setUserEmail(user.email);
          const verified = await authService.isEmailVerified();
          setShowEmailVerificationReminder(!verified);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadData();
  }, []);

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
  });

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n• All reminders\n• Partner profiles\n• Custom gestures\n• Account settings\n\nThis action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      console.log('[SettingsScreen] Starting account deletion...');
      const result = await accountService.deleteAccount();
      
      if (result.success) {
        console.log('[SettingsScreen] Account deleted successfully');
        Alert.alert(
          'Account Deleted',
          'Your account and all associated data have been permanently deleted. You will be redirected to the signup screen.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowDeleteModal(false);
                setIsDeleting(false);
                onNavigate?.('welcome');
              }
            }
          ]
        );
      } else {
        console.error('[SettingsScreen] Account deletion failed:', result.error);
        Alert.alert(
          'Deletion Failed',
          `Failed to delete account: ${result.error}\n\nPlease try again or contact support if the problem persists.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowDeleteModal(false);
                setIsDeleting(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('[SettingsScreen] Unexpected error during account deletion:', error);
      Alert.alert(
        'Unexpected Error',
        'An unexpected error occurred while deleting your account. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteModal(false);
              setIsDeleting(false);
            }
          }
        ]
      );
    }
  };

  const settingsOptions = [
    {
      id: 1,
      title: 'Notifications',
      subtitle: 'Manage your reminder preferences',
      emoji: '🔔',
      action: () => onNavigate?.('notifications'),
    },
    {
      id: 2,
      title: 'Privacy & Security',
      subtitle: 'Control your data and privacy',
      emoji: '🔒',
      action: () => onNavigate?.('privacySecurity'),
    },
    {
      id: 3,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      emoji: '❓',
      action: () => onNavigate?.('helpSupport'),
    },
    {
      id: 4,
      title: 'Recent Activity',
      subtitle: 'View your completed and missed gestures',
      emoji: '📊',
      action: () => onNavigate?.('recentActivity'),
    },
    {
      id: 5,
      title: 'About',
      subtitle: 'App version and information',
      emoji: 'ℹ️',
      action: () => setShowAboutModal(true),
    },
  ];

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
              onPress={() => onNavigate?.('dashboard')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.title}>Settings</Text>
          </View>

          {/* Email Verification Reminder */}
          {showEmailVerificationReminder && (
            <EmailVerificationReminder
              email={userEmail}
              onDismiss={() => setShowEmailVerificationReminder(false)}
            />
          )}

          {/* Settings Options */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>Preferences</Text>
            <View style={styles.optionsContainer}>
              {settingsOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={option.action}
                  activeOpacity={0.7}
                >
                  <Card style={styles.optionCard}>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>App Information</Text>
            <Card style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>SweetCue</Text>
                <Text style={styles.infoVersion}>Version 1.0.0</Text>
                <Text style={styles.infoSubtext}>
                  Never miss the moments that matter most to your relationship.
                </Text>
              </View>
            </Card>
          </View>

          {/* Account Management */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>Account</Text>
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
              <Card style={styles.dangerCard}>
                <View style={styles.dangerContent}>
                  <Text style={styles.dangerEmoji}>🗑️</Text>
                  <View style={styles.dangerInfo}>
                    <Text style={styles.dangerTitle}>Delete Account</Text>
                    <Text style={styles.dangerSubtitle}>
                      Permanently delete your account and all data
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#FFF0F5', '#FFFFFF', '#F8F0FF']}
            style={styles.modalGradient}
          />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowAboutModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>About SweetCue</Text>
              <View style={styles.modalPlaceholder} />
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Card style={styles.aboutCard}>
                <View style={styles.aboutContent}>
                  <Text style={styles.aboutEmoji}>💕</Text>
                  <Text style={styles.aboutTitle}>SweetCue</Text>
                  <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                  <Text style={styles.aboutDescription}>
                    SweetCue helps you never miss the moments that matter most in your relationship. 
                    From birthdays and anniversaries to thoughtful daily gestures, we're here to 
                    remind you to show your love in meaningful ways.
                  </Text>
                </View>
              </Card>

              <Card style={styles.aboutCard}>
                <Text style={styles.aboutSectionTitle}>Features</Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>📅</Text>
                    <Text style={styles.featureText}>Birthday & Anniversary Reminders</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>💝</Text>
                    <Text style={styles.featureText}>Personalized Gesture Suggestions</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>🎯</Text>
                    <Text style={styles.featureText}>Love Language Integration</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>⚡</Text>
                    <Text style={styles.featureText}>Quick Actions & Messages</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.aboutCard}>
                <Text style={styles.aboutSectionTitle}>Contact & Support</Text>
                <Text style={styles.aboutText}>
                  Have questions or need help? We're here to support you in building stronger, 
                  more thoughtful relationships.
                </Text>
                <Text style={styles.aboutText}>
                  Email: support@sweetcue.app{'\n'}
                  Website: sweetcue.app
                </Text>
              </Card>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!isDeleting) setShowDeleteModal(false); }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 32, width: 340, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 }}>
            <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }} onPress={() => { if (!isDeleting) setShowDeleteModal(false); }} accessibilityLabel="Close delete account modal" disabled={isDeleting}>
              <MaterialIcons name="close" size={28} color={theme.colors.neutral[400]} />
            </TouchableOpacity>
            <MaterialIcons name="warning" size={56} color={theme.colors.warning[600]} style={{ marginBottom: 16, marginTop: 8 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 22, color: theme.colors.error[600], marginBottom: 12, textAlign: 'center' }}>This action cannot be undone</Text>
            <Text style={{ fontSize: 16, color: theme.colors.neutral[700], marginBottom: 18, textAlign: 'center' }}>
              Deleting your account will permanently remove all your data including:
            </Text>
            <View style={{ alignSelf: 'stretch', marginBottom: 18 }}>
              <Text style={{ fontSize: 16, color: theme.colors.neutral[900], marginBottom: 2 }}>• {deletionSummary.reminders} reminders</Text>
              <Text style={{ fontSize: 16, color: theme.colors.neutral[900], marginBottom: 2 }}>• {deletionSummary.gestures} custom gestures</Text>
              <Text style={{ fontSize: 16, color: theme.colors.neutral[900], marginBottom: 2 }}>• {deletionSummary.partners} partner profile{deletionSummary.partners !== 1 ? 's' : ''}</Text>
              <Text style={{ fontSize: 16, color: theme.colors.neutral[900] }}>• All account settings and preferences</Text>
            </View>
            <Text style={{ fontWeight: 'bold', color: theme.colors.error[600], fontSize: 16, marginBottom: 28, textAlign: 'center' }}>
              Once deleted, this data cannot be recovered. Are you absolutely sure?
            </Text>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.neutral[100],
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginRight: 4,
                  opacity: isDeleting ? 0.5 : 1,
                  borderWidth: 2,
                  borderColor: theme.colors.neutral[300], // Add border for better visibility
                }}
                onPress={() => setShowDeleteModal(false)}
                accessibilityLabel="Cancel delete account"
                disabled={isDeleting}
              >
                <Text style={{ color: theme.colors.neutral[700], fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.error[600],
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginLeft: 4,
                  shadowColor: theme.colors.error[600],
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 2,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: isDeleting ? 0.7 : 1,
                }}
                onPress={confirmDeleteAccount}
                accessibilityLabel="Delete account permanently"
                disabled={isDeleting}
              >
                {isDeleting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{isDeleting ? 'Deleting...' : 'Delete Account'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Sections
  section: {
    marginBottom: theme.spacing[8],
  },

  // Options
  optionsContainer: {
    gap: theme.spacing[3],
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  optionSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.neutral[400],
    fontWeight: '300',
  },

  // App Info
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  infoContent: {
    padding: theme.spacing[4],
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary[600],
    marginBottom: theme.spacing[1],
  },
  infoVersion: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing[2],
  },
  infoSubtext: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },

  // Danger/Delete Account
  dangerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error[500],
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  dangerEmoji: {
    fontSize: 24,
    marginRight: theme.spacing[3],
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error[600],
    marginBottom: theme.spacing[1],
  },
  dangerSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  modalCloseText: {
    fontSize: 18,
    color: theme.colors.neutral[700],
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },

  // About Modal
  aboutCard: {
    marginBottom: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  aboutContent: {
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  aboutEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary[600],
    marginBottom: theme.spacing[1],
  },
  aboutVersion: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing[4],
  },
  aboutDescription: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    textAlign: 'center',
    lineHeight: 24,
  },
  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[4],
  },
  featureList: {
    gap: theme.spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: theme.spacing[3],
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    flex: 1,
  },
  aboutText: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    lineHeight: 24,
    marginBottom: theme.spacing[3],
  },

  // Delete Modal
  deleteCard: {
    marginTop: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  deleteContent: {
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  deleteEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[4],
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.error[600],
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  deleteDescription: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  deleteList: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing[4],
  },
  deleteItem: {
    paddingVertical: theme.spacing[1],
  },
  deleteItemText: {
    fontSize: 16,
    color: theme.colors.neutral[700],
  },
  deleteWarning: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error[600],
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    alignSelf: 'stretch',
  },
  deleteCancelButton: {
    flex: 1,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.error[500],
  },
});

export default SettingsScreen; 