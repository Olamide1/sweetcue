import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../design-system/components';
import { theme } from '../../design-system/tokens';

type Screen = 'welcome' | 'partnerProfile' | 'reminderSetup' | 'signIn';

interface WelcomeScreenProps {
  onNavigate?: (screen: Screen) => void;
}

const benefits = [
  { emoji: '💌', text: 'Gentle reminders' },
  { emoji: '🎯', text: 'Perfect timing' },
  { emoji: '💝', text: 'Thoughtful gestures' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375; // iPhone SE and smaller
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414; // Standard iPhone

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: isSmallScreen ? theme.spacing[4] : theme.spacing[6],
      paddingTop: theme.spacing[4],
      paddingBottom: theme.spacing[6],
      justifyContent: 'space-between',
    },
    brandName: {
      fontSize: isSmallScreen ? 40 : isMediumScreen ? 44 : 48,
      fontWeight: '800' as const,
      color: theme.colors.primary[600],
      marginBottom: theme.spacing[3],
      letterSpacing: -1,
    },
    mainHeadline: {
      fontSize: isSmallScreen ? 26 : isMediumScreen ? 29 : 32,
      fontWeight: '700' as const,
      color: theme.colors.neutral[900],
      textAlign: 'center' as const,
      marginBottom: theme.spacing[3],
      lineHeight: isSmallScreen ? 32 : 38,
    },
    subHeadline: {
      fontSize: isSmallScreen ? 16 : 18,
      color: theme.colors.neutral[600],
      textAlign: 'center' as const,
      lineHeight: isSmallScreen ? 22 : 24,
      paddingHorizontal: theme.spacing[4],
    },
    benefitEmoji: {
      fontSize: isSmallScreen ? 28 : 32,
      marginBottom: theme.spacing[2],
    },
    benefitText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '500' as const,
      color: theme.colors.neutral[700],
      textAlign: 'center' as const,
    },
    signInPrompt: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
    },
    pricingText: {
      fontSize: isSmallScreen ? 12 : 14,
      color: theme.colors.neutral[500],
      textAlign: 'center' as const,
    },
  });

  // Refactored benefit rotation logic
  useEffect(() => {
    // Set up interval to change benefit index
    const interval = setInterval(() => {
      setCurrentBenefitIndex((prev) => (prev + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate fade out/in when currentBenefitIndex changes
  useEffect(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [currentBenefitIndex]);

  const handleGetStarted = () => {
    onNavigate?.('partnerProfile');
  };

  const handleSignIn = () => {
    onNavigate?.('signIn');
  };

  const currentBenefit = benefits[currentBenefitIndex];

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
        <View style={responsiveStyles.content}>
          {/* Playful Header with Sticker Elements */}
          <View style={styles.headerSection}>
            <View style={styles.stickerContainer}>
              <View style={[styles.sticker, styles.stickerLove]}>
                <Text style={styles.stickerText}>love</Text>
              </View>
              <View style={[styles.sticker, styles.stickerHeart]}>
                <Text style={styles.stickerEmoji}>💕</Text>
              </View>
              <View style={[styles.sticker, styles.stickerStar]}>
                <Text style={styles.stickerEmoji}>✨</Text>
              </View>
              <View style={[styles.sticker, styles.stickerRemind]}>
                <Text style={styles.stickerText}>remind</Text>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.brandSection}>
              <Text style={responsiveStyles.brandName}>SweetCue</Text>
              <Text style={responsiveStyles.mainHeadline}>Turn love into action.</Text>
              <Text style={responsiveStyles.subHeadline}>
                Never miss the moments that matter most to your relationship.
              </Text>
            </View>

            {/* Single Rotating Benefit */}
            <Animated.View style={[styles.rotatingBenefit, { opacity: fadeAnim }]}>
              <Text style={responsiveStyles.benefitEmoji}>{currentBenefit.emoji}</Text>
              <Text style={responsiveStyles.benefitText}>{currentBenefit.text}</Text>
            </Animated.View>
          </View>

          {/* Modern Action Section */}
          <View style={styles.actionSection}>
            <Button
              title="Get Started Free"
              variant="primary"
              size="lg"
              onPress={handleGetStarted}
              style={styles.primaryButton}
            />
            
            <View style={styles.signInSection}>
              <Text style={responsiveStyles.signInPrompt}>Already have an account?</Text>
              <Button
                title="Sign In"
                variant="ghost"
                onPress={handleSignIn}
                style={styles.signInButton}
              />
            </View>
            
            <Text style={responsiveStyles.pricingText}>
              Start free • $8/month after trial
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    justifyContent: 'space-between',
  },

  // Playful Header with Stickers
  headerSection: {
    alignItems: 'center',
    paddingTop: theme.spacing[4],
  },
  stickerContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...theme.elevation.md,
  },
  stickerLove: {
    backgroundColor: '#FF69B4',
    top: 10,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  stickerHeart: {
    backgroundColor: '#FFE4E1',
    top: 30,
    right: 30,
    transform: [{ rotate: '12deg' }],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stickerStar: {
    backgroundColor: '#E6E6FA',
    bottom: 20,
    left: 30,
    transform: [{ rotate: '8deg' }],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stickerRemind: {
    backgroundColor: '#98FB98',
    bottom: 5,
    right: 20,
    transform: [{ rotate: '-8deg' }],
  },
  stickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stickerEmoji: {
    fontSize: 20,
  },

  // Main Content
  mainContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  brandName: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.primary[600],
    marginBottom: theme.spacing[3],
    letterSpacing: -1,
  },
  mainHeadline: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    textAlign: 'center',
    marginBottom: theme.spacing[3],
    lineHeight: 38,
  },
  subHeadline: {
    fontSize: 18,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing[4],
  },

  // Single Rotating Benefit
  rotatingBenefit: {
    alignItems: 'center',
    paddingVertical: theme.spacing[6],
    minHeight: 80,
    justifyContent: 'center',
  },
  benefitEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing[2],
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.neutral[700],
    textAlign: 'center',
  },

  // Action Section
  actionSection: {
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    ...theme.elevation.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  signInPrompt: {
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  signInButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 'auto',
  },
  pricingText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
});

export default WelcomeScreen; 