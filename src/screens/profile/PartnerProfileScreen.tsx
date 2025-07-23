import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';

interface PartnerProfile {
  name: string;
  photo?: string;
  keyDates: {
    anniversary?: string;
    birthday?: string;
  };
  loveLanguage: string;
  dislikes: string;
  userEmail: string;
  userPassword: string;
}

const loveLanguages = [
  'Words of Affirmation',
  'Quality Time', 
  'Physical Touch',
  'Acts of Service',
  'Receiving Gifts'
];

interface PartnerProfileScreenProps {
  onNavigate?: (screen: 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn') => void;
  onComplete?: (partnerName: string, email: string) => void;
}

const PartnerProfileScreen: React.FC<PartnerProfileScreenProps> = ({ onNavigate, onComplete }) => {
  const [profile, setProfile] = useState<PartnerProfile>({
    name: '',
    keyDates: {},
    loveLanguage: '',
    dislikes: '',
    userEmail: '',
    userPassword: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingTop: theme.spacing[4],
      paddingBottom: theme.spacing[6],
    },
    stepEmoji: {
      fontSize: isSmallScreen ? 40 : isMediumScreen ? 44 : 48,
      marginBottom: theme.spacing[4],
    },
    stepTitle: {
      fontSize: isSmallScreen ? 22 : isMediumScreen ? 25 : 28,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      textAlign: 'center' as const,
      marginBottom: theme.spacing[2],
      lineHeight: isSmallScreen ? 28 : 34,
    },
    stepSubtitle: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
      textAlign: 'center' as const,
      lineHeight: 22,
    },
    modernInput: {
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
    dateLabel: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing[3],
    },
    loveLanguageText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '500' as const,
      color: theme.colors.neutral[700],
      textAlign: 'center' as const,
    },
    loveLanguageTextSelected: {
      color: '#6366F1',
      fontWeight: '600' as const,
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onNavigate?.('welcome');
    }
  };

  const handleComplete = () => {
    if (!profile.name.trim()) {
      Alert.alert('Required', 'Please enter your partner\'s name');
      return;
    }
    if (!profile.userEmail.trim() || !profile.userPassword.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }
    
    // TODO: Save profile to backend
    console.log('Creating account with profile:', profile);
    
    // Navigate to subscription screen with partner name and email
    onComplete?.(profile.name, profile.userEmail);
  };

  const updateProfile = (updates: Partial<PartnerProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const renderStepContent = () => {
    const stepConfig = {
      1: { emoji: '💕', title: "What's your partner's name?", subtitle: "Let's personalize your experience" },
      2: { emoji: '📅', title: 'Important dates', subtitle: "We'll remind you when they matter most" },
      3: { emoji: '💝', title: 'How do they feel loved?', subtitle: 'Choose their primary love language' },
      4: { emoji: '⚠️', title: 'Anything to avoid?', subtitle: 'Help us give better suggestions' },
      5: { emoji: '🔐', title: 'Create your account', subtitle: "We'll use this to save your preferences" },
    }[currentStep] || { emoji: '💕', title: 'Setup', subtitle: 'Getting started' };

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={responsiveStyles.stepEmoji}>{stepConfig.emoji}</Text>
          <Text style={responsiveStyles.stepTitle}>{stepConfig.title}</Text>
          <Text style={responsiveStyles.stepSubtitle}>{stepConfig.subtitle}</Text>
        </View>

        {currentStep === 1 && (
          <View style={styles.inputContainer}>
            <TextInput
              style={responsiveStyles.modernInput}
              placeholder="Enter your partner's name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              autoFocus
              returnKeyType="next"
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.datesContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={responsiveStyles.dateLabel}>Birthday</Text>
              <TextInput
                style={responsiveStyles.modernInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.keyDates.birthday || ''}
                onChangeText={(text) => setProfile(prev => ({ ...prev, keyDates: { ...prev.keyDates, birthday: text } }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.dateInputGroup}>
              <Text style={responsiveStyles.dateLabel}>Anniversary (Optional)</Text>
              <TextInput
                style={responsiveStyles.modernInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.keyDates.anniversary || ''}
                onChangeText={(text) => setProfile(prev => ({ ...prev, keyDates: { ...prev.keyDates, anniversary: text } }))}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.loveLanguagesContainer}>
            {loveLanguages.map((language, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.loveLanguageOption,
                  profile.loveLanguage === language && styles.loveLanguageSelected
                ]}
                onPress={() => setProfile(prev => ({ ...prev, loveLanguage: language }))}
              >
                <Text style={[
                  responsiveStyles.loveLanguageText,
                  profile.loveLanguage === language && responsiveStyles.loveLanguageTextSelected
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[responsiveStyles.modernInput, styles.textArea]}
              placeholder="What should I avoid when giving gifts or planning surprises?"
              placeholderTextColor={theme.colors.neutral[400]}
              value={profile.dislikes}
              onChangeText={(text) => setProfile(prev => ({ ...prev, dislikes: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {currentStep === 5 && (
          <View style={styles.datesContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={responsiveStyles.dateLabel}>Your Email</Text>
              <TextInput
                style={responsiveStyles.modernInput}
                placeholder="Enter your email address"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.userEmail}
                onChangeText={(text) => setProfile(prev => ({ ...prev, userEmail: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.dateInputGroup}>
              <Text style={responsiveStyles.dateLabel}>Create Password</Text>
              <TextInput
                style={responsiveStyles.modernInput}
                placeholder="Create a secure password"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.userPassword}
                onChangeText={(text) => setProfile(prev => ({ ...prev, userPassword: text }))}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}
      </View>
    );
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={responsiveStyles.content}>
            {/* Header with Progress */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(currentStep / totalSteps) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{currentStep} of {totalSteps}</Text>
              </View>
            </View>

            {/* Step Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </ScrollView>

            {/* Action Button */}
            <View style={styles.actionSection}>
              <Button
                title={currentStep < totalSteps ? 'Continue' : 'Complete Setup'}
                variant="primary"
                size="lg"
                onPress={handleNext}
                style={styles.continueButton}
              />
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },

  // Header with Progress
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    gap: theme.spacing[4],
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
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing[2],
  },

  // Step Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing[4],
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[4],
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    textAlign: 'center',
    marginBottom: theme.spacing[2],
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
  },

  // Input Styles
  inputContainer: {
    width: '100%',
  },
  modernInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    fontSize: 16,
    color: theme.colors.neutral[900],
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  textArea: {
    height: 120,
    paddingTop: theme.spacing[4],
  },

  // Dates Section
  datesContainer: {
    width: '100%',
    gap: theme.spacing[5],
  },
  dateInputGroup: {
    width: '100%',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing[3],
  },

  // Love Languages
  loveLanguagesContainer: {
    width: '100%',
    gap: theme.spacing[3],
  },
  loveLanguageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    ...theme.elevation.sm,
  },
  loveLanguageSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  loveLanguageText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral[700],
    textAlign: 'center',
  },
  loveLanguageTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Action Section
  actionSection: {
    marginTop: theme.spacing[6],
  },
  continueButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
  },
});

export default PartnerProfileScreen; 