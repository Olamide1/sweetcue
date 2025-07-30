import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../design-system/components';
import { theme } from '../../design-system/tokens';
import supabase from '../../lib/supabase';
import { partnerService } from '../../services/partners';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn';

interface SignInScreenProps {
  onNavigate?: (screen: Screen) => void;
  onAuthenticate?: (partnerName?: string, email?: string) => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onNavigate, onAuthenticate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    welcomeEmoji: {
      fontSize: isSmallScreen ? 40 : isMediumScreen ? 44 : 48,
      marginBottom: theme.spacing[4],
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
    forgotPasswordText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.primary[600],
      textAlign: 'center' as const,
    },
    signUpPrompt: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
    },
    signUpLink: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: theme.colors.primary[600],
    },
  });

  const handleSignIn = async () => {
    setLoading(true); // Set loading immediately for instant feedback
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError || !data.user) {
        setError(authError?.message || 'Login failed');
        setLoading(false);
        Alert.alert('Sign In Error', authError?.message || 'Login failed');
        return;
      }
      
      // Fetch partner profile with a timeout to prevent hanging
      const partnerPromise = partnerService.getPartner();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Partner fetch timeout')), 5000)
      );
      
      const { data: partner, error: partnerError } = await Promise.race([
        partnerPromise,
        timeoutPromise
      ]) as any;
      
      setLoading(false);
      
      if (partnerError) {
        setError(partnerError);
        Alert.alert('Profile Error', partnerError);
        return;
      }
      
      // Call onAuthenticate with partner name and email
      onAuthenticate?.(partner?.name || '', email);
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
      setLoading(false);
      Alert.alert('Unexpected Error', err.message || 'Unexpected error');
    }
  };

  const handleBackToWelcome = () => {
    onNavigate?.('welcome');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
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
            <TouchableOpacity onPress={handleBackToWelcome} style={styles.backButton}>
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
                <Text style={responsiveStyles.welcomeEmoji}>💕</Text>
                <Text style={responsiveStyles.title}>Welcome back!</Text>
                <Text style={responsiveStyles.subtitle}>Sign in to your SweetCue account</Text>
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
                    returnKeyType="next"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={responsiveStyles.inputLabel}>Password</Text>
                  <TextInput
                    style={responsiveStyles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                </View>

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                  <Text style={responsiveStyles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionSection}>
            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              onPress={handleSignIn}
              style={!email.trim() || !password.trim() || loading ? { ...styles.signInButton, ...styles.signInButtonDisabled } : styles.signInButton}
              loading={loading}
              disabled={!email.trim() || !password.trim() || loading}
            />
            
            <View style={styles.signUpSection}>
              <Text style={responsiveStyles.signUpPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => onNavigate?.('partnerProfile')}>
                <Text style={responsiveStyles.signUpLink}>Sign up free</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing[2],
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
  signInButton: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    opacity: 1, // Always full opacity when enabled
  },
  signInButtonDisabled: {
    opacity: 0.5, // Only dim when actually disabled
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SignInScreen; 