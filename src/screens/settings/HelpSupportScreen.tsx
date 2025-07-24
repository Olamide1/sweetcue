import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { emailService } from '../../services/email';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings' | 'privacySecurity' | 'notifications' | 'helpSupport';

interface HelpSupportScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ onNavigate }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
    textArea: {
      height: 120,
      textAlignVertical: 'top' as const,
    },
  });

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject for your message');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await emailService.sendSupportEmail({
        subject: subject.trim(),
        message: message.trim(),
      });

      if (success) {
        Alert.alert(
          'Support Request Sent!',
          'Your support request has been sent successfully. We\'ll get back to you within 24 hours.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setSubject('');
                setMessage('');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error || 'Failed to send support request. Please try again.',
          [
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending support email:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSupport = (topic: string) => {
    setSubject(`Support Request: ${topic}`);
    setMessage(`Hi,\n\nI need help with: ${topic}\n\nPlease provide more details about your issue here...`);
  };

  const quickSupportTopics = [
    'App not working properly',
    'Can\'t create reminders',
    'Partner profile issues',
    'Subscription problems',
    'Password reset',
    'Other issue'
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
            <Text style={responsiveStyles.title}>Help & Support</Text>
          </View>

          {/* Quick Support */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>🚀 Quick Support</Text>
            <Text style={styles.sectionDescription}>
              Select a common issue to pre-fill your support request:
            </Text>
            
            <View style={styles.quickSupportGrid}>
              {quickSupportTopics.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickSupportButton}
                  onPress={() => handleQuickSupport(topic)}
                >
                  <Text style={styles.quickSupportText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={responsiveStyles.sectionTitle}>📧 Contact Support</Text>
            <Text style={styles.sectionDescription}>
              Send us a message and we'll get back to you as soon as possible.
            </Text>
            
            <Card style={styles.formCard}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={responsiveStyles.input}
                placeholder="What can we help you with?"
                placeholderTextColor={theme.colors.neutral[400]}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="next"
              />

              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[responsiveStyles.input, responsiveStyles.textArea]}
                placeholder="Please describe your issue in detail..."
                placeholderTextColor={theme.colors.neutral[400]}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Button
                title="Send Support Request"
                variant="primary"
                size="lg"
                onPress={handleSendEmail}
                style={styles.sendButton}
                loading={loading}
                disabled={loading}
              />
            </Card>
          </View>

          {/* Additional Info */}
          <View style={styles.section}>
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>💡 Need Immediate Help?</Text>
              <Text style={styles.infoText}>
                For urgent issues, please use the form above to send us a support request.
              </Text>
              <Text style={styles.infoText}>
                We typically respond within 24 hours during business days.
              </Text>
            </Card>
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
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },

  // Quick Support
  quickSupportGrid: {
    gap: theme.spacing[2],
  },
  quickSupportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    ...theme.elevation.sm,
  },
  quickSupportText: {
    fontSize: 14,
    color: theme.colors.neutral[700],
    textAlign: 'center',
  },

  // Form
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing[2],
  },
  sendButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    marginTop: theme.spacing[4],
    ...theme.elevation.lg,
    shadowColor: theme.colors.primary[400],
    shadowOpacity: 0.3,
  },

  // Info Card
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing[2],
  },

});

export default HelpSupportScreen; 