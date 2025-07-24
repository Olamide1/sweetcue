import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { notificationService } from '../../services/notifications';
import { notificationScheduler } from '../../services/notificationScheduler';
import supabase from '../../lib/supabase';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity' | 'notifications';

interface NotificationsScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderAdvance, setReminderAdvance] = useState(1); // days in advance
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

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
  });

  // Check notification permissions on mount
  useEffect(() => {
    checkNotificationPermissions();
    loadUserPreferences();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const isEnabled = await notificationService.areNotificationsEnabled();
      setPermissionStatus(isEnabled ? 'granted' : 'denied');
      setPushNotifications(isEnabled);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      if (profile?.notification_preferences) {
        const prefs = profile.notification_preferences;
        setPushNotifications(prefs.pushEnabled ?? true);
        setEmailNotifications(prefs.emailEnabled ?? true);
        setReminderAdvance(prefs.reminderAdvance ?? 1);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Request permission
      const granted = await notificationService.requestPermissions();
      if (granted) {
        setPushNotifications(true);
        setPermissionStatus('granted');
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable push notifications in your device settings to receive reminders.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } else {
      setPushNotifications(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const preferences = {
        pushEnabled: pushNotifications,
        emailEnabled: emailNotifications,
        reminderAdvance: reminderAdvance,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving notification settings:', error);
        Alert.alert('Error', 'Failed to save notification settings');
        return;
      }

      // Reschedule notifications with new preferences
      try {
        await notificationScheduler.rescheduleNotifications();
        console.log('Notifications rescheduled with new preferences');
      } catch (rescheduleError) {
        console.error('Error rescheduling notifications:', rescheduleError);
      }

      Alert.alert('Success', 'Notification settings saved and notifications updated!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const reminderAdvanceOptions = [
    { value: 1, label: '1 day before' },
    { value: 2, label: '2 days before' },
    { value: 3, label: '3 days before' },
    { value: 7, label: '1 week before' },
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
              onPress={() => onNavigate?.('settings')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={responsiveStyles.title}>Notifications</Text>
          </View>

          {/* Push Notifications */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>🔔 Push Notifications</Text>
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Enable Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive reminders and updates on your device
                  </Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={handlePushNotificationsToggle}
                  trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
                  thumbColor={pushNotifications ? theme.colors.primary[500] : theme.colors.neutral[400]}
                />
              </View>
              {permissionStatus === 'denied' && (
                <Text style={styles.permissionWarning}>
                  Push notifications are disabled. Enable them in device settings.
                </Text>
              )}
            </Card>
          </View>

          {/* Email Notifications */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>📧 Email Notifications</Text>
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Email Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Receive reminder emails for important dates
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
                  thumbColor={emailNotifications ? theme.colors.primary[500] : theme.colors.neutral[400]}
                />
              </View>
            </Card>
          </View>

          {/* Reminder Preferences */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>⏰ Reminder Preferences</Text>
            <Card style={styles.settingCard}>
              <Text style={styles.settingTitle}>Remind me</Text>
              <Text style={styles.settingDescription}>
                How far in advance should we remind you about important dates?
              </Text>
              
              <View style={styles.optionsContainer}>
                {reminderAdvanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      reminderAdvance === option.value && styles.optionButtonSelected
                    ]}
                    onPress={() => setReminderAdvance(option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      reminderAdvance === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </View>

          {/* Test Notification */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>🧪 Test Notifications</Text>
            <Card style={styles.settingCard}>
              <Text style={styles.settingDescription}>
                Send a test notification to verify everything is working correctly.
              </Text>
              <Button
                title="Send Test Notification"
                variant="secondary"
                size="md"
                onPress={() => notificationService.sendImmediateNotification(
                  'SweetCue',
                  'Your notifications are working perfectly! Ready to keep your love alive!'
                )}
                style={styles.testButton}
              />
            </Card>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <Button
              title="Save Settings"
              variant="primary"
              size="lg"
              onPress={handleSaveSettings}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
            />
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

  // Sections
  section: {
    marginBottom: theme.spacing[6],
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing[4],
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[1],
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    lineHeight: 20,
  },
  permissionWarning: {
    fontSize: 12,
    color: theme.colors.error[600],
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },

  // Reminder Options
  optionsContainer: {
    marginTop: theme.spacing[4],
    gap: theme.spacing[2],
  },
  optionButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary[400],
    backgroundColor: theme.colors.primary[50],
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.neutral[700],
    textAlign: 'center',
  },
  optionTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: '600',
  },

  // Save Section
  saveSection: {
    marginTop: theme.spacing[6],
  },
  testButton: {
    marginTop: theme.spacing[3],
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.radius.md,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: theme.colors.primary[400],
    shadowOpacity: 0.3,
  },
});

export default NotificationsScreen; 