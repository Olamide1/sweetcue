import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.base];
    
    if (variant === 'primary') baseStyles.push(styles.primary);
    if (variant === 'secondary') baseStyles.push(styles.secondary);
    if (variant === 'ghost') baseStyles.push(styles.ghost);
    
    if (size === 'sm') baseStyles.push(styles.sm);
    if (size === 'md') baseStyles.push(styles.md);
    if (size === 'lg') baseStyles.push(styles.lg);
    
    if (disabled) baseStyles.push(styles.disabled);
    if (style) baseStyles.push(style);
    
    return baseStyles;
  };

  const getTextStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.baseText];
    
    if (variant === 'primary') baseStyles.push(styles.primaryText);
    if (variant === 'secondary') baseStyles.push(styles.secondaryText);
    if (variant === 'ghost') baseStyles.push(styles.ghostText);
    
    if (size === 'sm') baseStyles.push(styles.smText);
    if (size === 'md') baseStyles.push(styles.mdText);
    if (size === 'lg') baseStyles.push(styles.lgText);
    
    if (disabled) baseStyles.push(styles.disabledText);
    if (textStyle) baseStyles.push(textStyle);
    
    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.neutral[50] : theme.colors.primary[300]}
        />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48, // Touch target ≥48x48 from PRD accessibility requirements
    ...theme.elevation.sm,
  },
  
  // Variants - simple, warm, trustworthy
  primary: {
    backgroundColor: theme.colors.primary[300],
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...theme.elevation.none,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    minHeight: 40,
  },
  md: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    minHeight: 56,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  baseText: {
    fontFamily: theme.typography.fontFamily.inter,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  
  // Text variants
  primaryText: {
    color: theme.colors.neutral[50],
  },
  secondaryText: {
    color: theme.colors.primary[300],
  },
  ghostText: {
    color: theme.colors.primary[300],
  },
  
  // Text sizes
  smText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  mdText: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  lgText: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});

export default Button; 