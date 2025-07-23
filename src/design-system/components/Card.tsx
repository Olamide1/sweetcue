import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 4,
  shadow = true,
}) => {
  const cardStyles = [
    styles.base,
    shadow && styles.shadow,
    { padding: theme.spacing[padding] },
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    // Shadow-sm as specified in PRD
    ...theme.elevation.sm,
  },
});

export default Card; 