import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ScrollIndicator } from '../../design-system/components';
import { theme } from '../../design-system/tokens';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner';

interface PartnerProfile {
  name: string;
  photo?: string;
  keyDates: {
    anniversary?: string;
    birthday?: string;
  };
  loveLanguage: string;
  dislikes: string;
}

interface EditPartnerScreenProps {
  onNavigate?: (screen: Screen) => void;
  onSave?: (profile: PartnerProfile) => void;
  initialProfile?: PartnerProfile;
}

const EditPartnerScreen: React.FC<EditPartnerScreenProps> = ({ 
  onNavigate, 
  onSave,
  initialProfile = {
    name: 'Alex',
    keyDates: { birthday: '03/15/1990', anniversary: '06/20/2020' },
    loveLanguage: 'Quality Time',
    dislikes: 'Surprise parties, overly expensive gifts'
  }
}) => {
  const [profile, setProfile] = useState<PartnerProfile>(initialProfile);
  const [hasChanges, setHasChanges] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    content: {
      padding: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 18 : 20,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      marginBottom: theme.spacing[3],
    },
    fieldLabel: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing[2],
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
      height: 100,
      textAlignVertical: 'top' as const,
    },
    loveLanguageGrid: {
      gap: theme.spacing[3],
    },
    loveLanguageOption: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing[4],
      paddingHorizontal: theme.spacing[4],
      borderWidth: 2,
      borderColor: theme.colors.neutral[200],
      ...theme.elevation.sm,
    },
    loveLanguageSelected: {
      borderColor: theme.colors.primary[400],
      backgroundColor: 'rgba(255, 182, 193, 0.1)',
    },
    loveLanguageText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '500' as const,
      color: theme.colors.neutral[700],
      textAlign: 'center' as const,
    },
    loveLanguageTextSelected: {
      color: theme.colors.primary[600],
      fontWeight: '600' as const,
    },
  });

  const loveLanguages = [
    'Words of Affirmation',
    'Quality Time',
    'Physical Touch',
    'Acts of Service',
    'Receiving Gifts'
  ];

  const handleInputChange = (field: keyof PartnerProfile | string, value: string) => {
    setHasChanges(true);
    
    if (field === 'name' || field === 'loveLanguage' || field === 'dislikes') {
      setProfile(prev => ({ ...prev, [field]: value }));
    } else if (field === 'birthday' || field === 'anniversary') {
      setProfile(prev => ({
        ...prev,
        keyDates: { ...prev.keyDates, [field]: value }
      }));
    }
  };

  const handleSave = () => {
    if (!profile.name.trim()) {
      Alert.alert('Required', 'Please enter your partner\'s name');
      return;
    }
    
    onSave?.(profile);
    Alert.alert('Success', 'Partner preferences updated successfully!', [
      { text: 'OK', onPress: () => onNavigate?.('dashboard') }
    ]);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => onNavigate?.('dashboard') }
        ]
      );
    } else {
      onNavigate?.('dashboard');
    }
  };

  const handleScrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
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
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Partner Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContainer}
            contentContainerStyle={responsiveStyles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Basic Information */}
            <Card style={styles.section}>
              <Text style={responsiveStyles.sectionTitle}>👤 Basic Information</Text>
              
              <Text style={responsiveStyles.fieldLabel}>Partner's Name</Text>
              <TextInput
                style={responsiveStyles.input}
                placeholder="Enter your partner's name"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.name}
                onChangeText={(text) => handleInputChange('name', text)}
                returnKeyType="next"
              />
            </Card>

            {/* Important Dates */}
            <Card style={styles.section}>
              <Text style={responsiveStyles.sectionTitle}>📅 Important Dates</Text>
              
              <Text style={responsiveStyles.fieldLabel}>Birthday</Text>
              <TextInput
                style={responsiveStyles.input}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.keyDates.birthday || ''}
                onChangeText={(text) => handleInputChange('birthday', text)}
                keyboardType="numeric"
                returnKeyType="next"
              />
              
              <Text style={responsiveStyles.fieldLabel}>Anniversary</Text>
              <TextInput
                style={responsiveStyles.input}
                placeholder="MM/DD/YYYY (Optional)"
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.keyDates.anniversary || ''}
                onChangeText={(text) => handleInputChange('anniversary', text)}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </Card>

            {/* Love Language */}
            <Card style={styles.section}>
              <Text style={responsiveStyles.sectionTitle}>💝 Love Language</Text>
              <Text style={styles.sectionDescription}>
                How does your partner prefer to receive love?
              </Text>
              
              <View style={responsiveStyles.loveLanguageGrid}>
                {loveLanguages.map((language, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      responsiveStyles.loveLanguageOption,
                      profile.loveLanguage === language && responsiveStyles.loveLanguageSelected
                    ]}
                    onPress={() => handleInputChange('loveLanguage', language)}
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
            </Card>

            {/* Preferences & Dislikes */}
            <Card style={styles.section}>
              <Text style={responsiveStyles.sectionTitle}>⚠️ Things to Avoid</Text>
              <Text style={styles.sectionDescription}>
                Help us give better suggestions by noting what they don't like
              </Text>
              
              <Text style={responsiveStyles.fieldLabel}>Dislikes & Preferences</Text>
              <TextInput
                style={[responsiveStyles.input, responsiveStyles.textArea]}
                placeholder="e.g., Doesn't like surprises, prefers handmade gifts, allergic to flowers..."
                placeholderTextColor={theme.colors.neutral[400]}
                value={profile.dislikes}
                onChangeText={(text) => handleInputChange('dislikes', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              title="Save Changes"
              variant="primary"
              size="lg"
              onPress={handleSave}
              style={styles.saveButton}
            />
            
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={handleCancel}
              style={styles.cancelButton}
            />
          </View>

          {/* Scroll Indicator */}
          <ScrollIndicator
            scrollY={scrollY}
            onPress={handleScrollToBottom}
            showThreshold={100}
          />
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },

  // Action Section
  actionSection: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    gap: theme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  saveButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: theme.colors.primary[400],
    shadowOpacity: 0.3,
  },
  cancelButton: {
    paddingVertical: theme.spacing[2],
  },
});

export default EditPartnerScreen; 