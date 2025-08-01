import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import { authService } from '../../services/auth';

interface PasswordResetScreenProps {
  onNavigate?: (screen: 'signIn' | 'welcome') => void;
  email?: string;
}

const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ onNavigate, email: initialEmail }) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      justifyContent: 'center',
      minHeight: 400,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingTop: theme.spacing[4],
      paddingBottom: theme.spacing[2],
    },
    title: {
      fontSize: isSmallScreen ? 26 : isMediumScreen ? 29 : 32,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      textAlign: 'center' as const,
      marginBottom: theme.spacing[2],
      lineHeight: isSmallScreen ? 32 : 38,
    },
    subtitle: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
      textAlign: 'center' as const,
      lineHeight: 22,
      marginBottom: theme.spacing[6],
    },
    inputLabel: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: theme.colors.neutral[700],
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 16,
      paddingHorizontal: theme.spacing[5],
      paddingVertical: isSmallScreen ? theme.spacing[3] : theme.spacing[4],
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[900],
      ...theme.elevation.sm,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
    },
  });

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await authService.resetPassword(email.trim());
      
      if (error) {
        setError(error.message);
      } else {
        setEmailSent(true);
        Alert.alert(
          'Password Reset Email Sent',
          'Check your email for a link to reset your password. If you don\'t see it, check your spam folder.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    onNavigate?.('signIn');
  };

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
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={responsiveStyles.header}>
            <TouchableOpacity onPress={handleBackToSignIn} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={responsiveStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Content */}
            <View style={styles.mainContent}>
              <View style={styles.titleSection}>
                <Text style={responsiveStyles.title}>Reset Password</Text>
                <Text style={responsiveStyles.subtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={responsiveStyles.inputLabel}>Email</Text>
                  <TextInput
                    style={responsiveStyles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />
                </View>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                {emailSent && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>
                      ✅ Password reset email sent! Check your inbox.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionSection}>
            <Button
              title={loading ? "Sending..." : "Send Reset Email"}
              variant="primary"
              size="lg"
              onPress={handleResetPassword}
              style={!email.trim() || loading ? { ...styles.resetButton, ...styles.resetButtonDisabled } : styles.resetButton}
              loading={loading}
              disabled={!email.trim() || loading}
            />
            
            <View style={styles.backToSignInSection}>
              <Text style={styles.backToSignInText}>Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToSignIn}>
                <Text style={styles.backToSignInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    justifyContent: 'space-between',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.neutral[700],
  },

  // Main Content
  mainContent: {
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  formContainer: {
    width: '100%',
    gap: theme.spacing[5],
  },
  inputGroup: {
    gap: theme.spacing[3],
  },

  // Action Section
  actionSection: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
    paddingTop: theme.spacing[4],
    gap: theme.spacing[4],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    opacity: 1,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  backToSignInSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToSignInText: {
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  backToSignInLink: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PasswordResetScreen; 