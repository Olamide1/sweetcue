import React, { useState, useRef, useEffect } from 'react';
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
import { partnerService } from '../../services/partners';
import DatePicker from '../../components/DatePicker';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner';

interface PartnerProfile {
  name: string;
  photo?: string;
  keyDates: {
    anniversary?: string;
    birthday?: string;
  };
  loveLanguages: string[];
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
    loveLanguages: ['Quality Time'],
    dislikes: 'Surprise parties, overly expensive gifts'
  }
}) => {
  const [profile, setProfile] = useState<PartnerProfile>({
    name: initialProfile.name,
    keyDates: initialProfile.keyDates,
    loveLanguages: initialProfile.loveLanguages || [],
    dislikes: initialProfile.dislikes,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Fetch partner profile from Supabase on mount
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      console.log('[EditPartnerScreen] Loading partner profile...');
      const { data, error } = await partnerService.getPartner();
      if (data) {
        console.log('[EditPartnerScreen] Raw partner data from service:', data);
        setProfile({
          name: data.name || '',
          keyDates: {
            birthday: data.birthday ? String(data.birthday) : '',
            anniversary: data.anniversary ? String(data.anniversary) : '',
          },
          loveLanguages: data.love_languages || (data.love_language ? [data.love_language] : []),
          dislikes: data.dislikes || '',
        });
        console.log('[EditPartnerScreen] Processed partner profile:', {
          name: data.name,
          birthday: data.birthday,
          anniversary: data.anniversary,
          love_languages: data.love_languages
        });
      }
      if (error) {
        setError(error);
        console.error('[EditPartnerScreen] Error loading partner profile:', error);
      }
      setLoading(false);
      setHasChanges(false);
    };
    fetchProfile();
  }, []);

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
    
    if (field === 'name' || field === 'dislikes') {
      setProfile(prev => ({ ...prev, [field]: value }));
    } else if (field === 'loveLanguages') {
      setProfile(prev => {
        const currentLoveLanguages = prev.loveLanguages || [];
        const newLoveLanguages = currentLoveLanguages.includes(value)
          ? currentLoveLanguages.filter(l => l !== value)
          : [...currentLoveLanguages, value];
        return { ...prev, loveLanguages: newLoveLanguages };
      });
    } else if (field === 'birthday' || field === 'anniversary') {
      setProfile(prev => ({
        ...prev,
        keyDates: { ...prev.keyDates, [field]: value }
      }));
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Required', 'Please enter your partner\'s name');
      return;
    }
    setLoading(true);
    setError(null);
    console.log('[EditPartnerScreen] Saving partner profile...', profile);
    
    // Log what we're about to save
    const saveData = {
      name: profile.name,
      birthday: profile.keyDates.birthday,
      anniversary: profile.keyDates.anniversary,
      loveLanguages: profile.loveLanguages,
      dislikes: profile.dislikes,
    };
    console.log('[EditPartnerScreen] Save data to be sent:', saveData);
    
    // Save to Supabase
    const { data, error } = await partnerService.getPartner();
    let partnerId = data?.id;
    let saveError = null;
    if (partnerId) {
      // Update existing
      console.log('[EditPartnerScreen] Updating existing partner with ID:', partnerId);
      const { error: updateError } = await partnerService.updatePartner(partnerId, saveData);
      saveError = updateError;
      if (!saveError) console.log('[EditPartnerScreen] Partner updated successfully:', profile.name);
    } else {
      // Create new
      console.log('[EditPartnerScreen] Creating new partner');
      const { error: createError } = await partnerService.createPartner(saveData);
      saveError = createError;
      if (!saveError) console.log('[EditPartnerScreen] Partner created successfully:', profile.name);
    }
    setLoading(false);
    setHasChanges(false);
    if (saveError) {
      setError(saveError);
      console.error('[EditPartnerScreen] Error saving partner profile:', saveError);
      Alert.alert('Error', saveError);
      return;
    }
    onSave?.(profile);
    Alert.alert('Success', 'Partner preferences updated successfully!', [
      { text: 'OK', onPress: () => { console.log('[EditPartnerScreen] Navigating to dashboard after save'); onNavigate?.('dashboard'); } }
    ]);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => { console.log('[EditPartnerScreen] Discarding changes and navigating to dashboard'); onNavigate?.('dashboard'); } }
        ]
      );
    } else {
      console.log('[EditPartnerScreen] Navigating to dashboard (no changes)');
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
              <Text style={styles.sectionDescription}>
                These dates will automatically appear in your reminders when they're coming up.
              </Text>
              
              <DatePicker label="Birthday" value={profile.keyDates.birthday} onDateChange={date => handleInputChange('birthday', date)} />
              
              <DatePicker label="Anniversary" value={profile.keyDates.anniversary} onDateChange={date => handleInputChange('anniversary', date)} />
              
              <View style={{ backgroundColor: theme.colors.primary[50], padding: theme.spacing[3], borderRadius: theme.radius.md, marginTop: theme.spacing[2] }}>
                <Text style={{ fontSize: 13, color: theme.colors.primary[700], fontWeight: '500' }}>🎯 How it works:</Text>
                <Text style={{ fontSize: 13, color: theme.colors.primary[600], marginTop: 2 }}>
                  Birthdays and anniversaries will show up in "Next 3 Days" when they're within 7 days, and in "Upcoming Reminders" when they're within 30 days.
                </Text>
              </View>
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
                      (profile.loveLanguages || []).includes(language) && responsiveStyles.loveLanguageSelected
                    ]}
                    onPress={() => handleInputChange('loveLanguages', language)}
                  >
                    <Text style={[
                      responsiveStyles.loveLanguageText,
                      (profile.loveLanguages || []).includes(language) && responsiveStyles.loveLanguageTextSelected
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
              title={loading ? 'Saving...' : 'Save Changes'}
              variant="primary"
              size="lg"
              onPress={handleSave}
              style={StyleSheet.flatten([
                styles.saveButton,
                (loading || !hasChanges || !profile.name.trim()) && { backgroundColor: theme.colors.primary[200], opacity: 0.5 }
              ])}
              textStyle={{ color: (loading || !hasChanges || !profile.name.trim()) ? theme.colors.primary[600] : 'white', fontWeight: '700' }}
              loading={loading}
              disabled={loading || !hasChanges || !profile.name.trim()}
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
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: theme.colors.primary[600],
    shadowOpacity: 0.3,
  },
  cancelButton: {
    paddingVertical: theme.spacing[2],
  },
});

export default EditPartnerScreen; 