import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { theme } from '../tokens';

interface ScrollIndicatorProps {
  scrollY: Animated.Value;
  onPress?: () => void;
  showThreshold?: number;
  style?: any;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  scrollY,
  onPress,
  showThreshold = 100,
  style
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const bounceAnim = useState(new Animated.Value(0))[0];

  // Get screen dimensions for responsive positioning
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const shouldShow = value < showThreshold;
      
      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);
        Animated.timing(fadeAnim, {
          toValue: shouldShow ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Bounce animation for attention
    const bounceAnimation = () => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Repeat after delay
        setTimeout(bounceAnimation, 2000);
      });
    };

    bounceAnimation();

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, isVisible, showThreshold, fadeAnim, bounceAnim]);

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const responsiveStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: isSmallScreen ? 100 : 120,
      alignSelf: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    button: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: theme.radius.full,
      paddingVertical: isSmallScreen ? theme.spacing[2] : theme.spacing[3],
      paddingHorizontal: isSmallScreen ? theme.spacing[3] : theme.spacing[4],
      ...theme.elevation.lg,
      shadowColor: theme.colors.primary[400],
      shadowOpacity: 0.2,
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    text: {
      fontSize: isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: theme.colors.primary[600],
    },
    arrow: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.primary[500],
    },
  });

  return (
    <Animated.View
      style={[
        responsiveStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: bounceTranslate }],
        },
        style,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={responsiveStyles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={responsiveStyles.text}>More below</Text>
        <Text style={responsiveStyles.arrow}>↓</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ScrollIndicator; 