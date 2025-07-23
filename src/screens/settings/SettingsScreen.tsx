import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn' | 'dashboard' | 'subscription' | 'editPartner' | 'settings';

interface SettingsScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
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

  const settingsOptions = [
    {
      id: 1,
      title: 'Notifications',
      subtitle: 'Manage your reminder preferences',
      emoji: '🔔',
      action: () => console.log('Navigate to notifications settings'),
    },
    {
      id: 2,
      title: 'Privacy & Security',
      subtitle: 'Control your data and privacy',
      emoji: '🔒',
      action: () => console.log('Navigate to privacy settings'),
    },
    {
      id: 3,
      title: 'Backup & Sync',
      subtitle: 'Manage your data backup',
      emoji: '☁️',
      action: () => console.log('Navigate to backup settings'),
    },
    {
      id: 4,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      emoji: '❓',
      action: () => console.log('Navigate to help'),
    },
    {
      id: 5,
      title: 'About',
      subtitle: 'App version and information',
      emoji: 'ℹ️',
      action: () => console.log('Navigate to about'),
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
});

export default SettingsScreen; 