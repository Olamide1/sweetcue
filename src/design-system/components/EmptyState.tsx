import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../tokens';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  secondaryActionText?: string;
  onSecondaryActionPress?: () => void;
  style?: any;
  variant?: 'default' | 'encouraging' | 'informational' | 'error';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '📝',
  title,
  description,
  actionText,
  onActionPress,
  secondaryActionText,
  onSecondaryActionPress,
  style,
  variant = 'default',
}) => {
  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

  // Create responsive styles
  const responsiveStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isSmallScreen ? theme.spacing[6] : theme.spacing[8],
      paddingVertical: isSmallScreen ? theme.spacing[8] : theme.spacing[12],
      minHeight: isSmallScreen ? 200 : 250,
    },
    emoji: {
      fontSize: isSmallScreen ? 48 : isMediumScreen ? 56 : 64,
      marginBottom: theme.spacing[4],
      opacity: 0.8,
    },
    title: {
      fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
      fontWeight: '600' as const,
      color: theme.colors.neutral[900],
      textAlign: 'center' as const,
      marginBottom: theme.spacing[3],
      lineHeight: isSmallScreen ? 24 : 28,
    },
    description: {
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.colors.neutral[600],
      textAlign: 'center' as const,
      lineHeight: isSmallScreen ? 20 : 24,
      marginBottom: theme.spacing[6],
      maxWidth: isSmallScreen ? 280 : 320,
    },
    actionsContainer: {
      width: '100%',
      maxWidth: 280,
      gap: theme.spacing[3],
    },
    primaryButton: {
      backgroundColor: theme.colors.primary[500],
      paddingVertical: isSmallScreen ? theme.spacing[3] : theme.spacing[4],
      paddingHorizontal: theme.spacing[6],
      borderRadius: theme.radius.lg,
      alignItems: 'center' as const,
      ...theme.elevation.sm,
    },
    primaryButtonText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '600' as const,
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: theme.spacing[2],
      paddingHorizontal: theme.spacing[4],
      alignItems: 'center' as const,
    },
    secondaryButtonText: {
      fontSize: isSmallScreen ? 13 : 15,
      fontWeight: '500' as const,
      color: theme.colors.primary[600],
    },
  });

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'encouraging':
        return {
                     containerStyle: {
             backgroundColor: 'rgba(99, 102, 241, 0.02)',
             borderRadius: theme.radius.lg,
             borderWidth: 1,
             borderColor: 'rgba(99, 102, 241, 0.1)',
           },
          titleColor: theme.colors.primary[700],
          primaryButtonColor: theme.colors.primary[500],
        };
      case 'informational':
        return {
                     containerStyle: {
             backgroundColor: 'rgba(59, 130, 246, 0.02)',
             borderRadius: theme.radius.lg,
             borderWidth: 1,
             borderColor: 'rgba(59, 130, 246, 0.1)',
           },
          titleColor: '#2563eb', // blue-600
          primaryButtonColor: '#2563eb',
        };
      case 'error':
        return {
                     containerStyle: {
             backgroundColor: 'rgba(239, 68, 68, 0.02)',
             borderRadius: theme.radius.lg,
             borderWidth: 1,
             borderColor: 'rgba(239, 68, 68, 0.1)',
           },
          titleColor: theme.colors.error[600],
          primaryButtonColor: theme.colors.error[500],
        };
      default:
                 return {
           containerStyle: {
             backgroundColor: 'rgba(255, 255, 255, 0.5)',
             borderRadius: theme.radius.lg,
           },
          titleColor: theme.colors.neutral[900],
          primaryButtonColor: theme.colors.primary[500],
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      responsiveStyles.container,
      variantStyles.containerStyle,
      style
    ]}>
      <Text style={responsiveStyles.emoji}>{emoji}</Text>
      <Text style={[
        responsiveStyles.title,
        { color: variantStyles.titleColor }
      ]}>
        {title}
      </Text>
      <Text style={responsiveStyles.description}>
        {description}
      </Text>
      
      {(actionText || secondaryActionText) && (
        <View style={responsiveStyles.actionsContainer}>
          {actionText && onActionPress && (
            <TouchableOpacity
              style={[
                responsiveStyles.primaryButton,
                { backgroundColor: variantStyles.primaryButtonColor }
              ]}
              onPress={onActionPress}
              activeOpacity={0.8}
            >
              <Text style={responsiveStyles.primaryButtonText}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
          
          {secondaryActionText && onSecondaryActionPress && (
            <TouchableOpacity
              style={responsiveStyles.secondaryButton}
              onPress={onSecondaryActionPress}
              activeOpacity={0.7}
            >
              <Text style={responsiveStyles.secondaryButtonText}>
                {secondaryActionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default EmptyState; 