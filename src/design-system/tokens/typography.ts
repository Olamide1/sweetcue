// Sprout DS Typography Tokens - Inter font with scale from PRD (12-14-16-20-28-40)
export const typography = {
  fontFamily: {
    inter: 'Inter',
    default: 'Inter',
  },
  
  fontSize: {
    xs: 12,   // PRD scale
    sm: 14,   // PRD scale
    base: 16, // PRD scale
    lg: 20,   // PRD scale
    xl: 28,   // PRD scale
    '2xl': 40, // PRD scale
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LineHeight = keyof typeof typography.lineHeight; 