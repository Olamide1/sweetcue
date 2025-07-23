// Sprout DS Color Tokens - as specified in PRD v4
export const colors = {
  // Primary - Pastel primary (#FFB6C1) from PRD
  primary: {
    50: '#FFF5F7',
    100: '#FFE8ED',
    200: '#FFD1DB',
    300: '#FFB6C1', // Main primary color from PRD
    400: '#FF9BB0',
    500: '#FF7A9A',
    600: '#E85D87',
    700: '#D14374',
    800: '#B93B6B',
    900: '#A13362',
  },

  // Accent - Blue (#6F8DF6) from PRD
  accent: {
    50: '#F0F4FF',
    100: '#E1E9FF',
    200: '#C3D3FF',
    300: '#A5BDFF',
    400: '#87A7FF',
    500: '#6F8DF6', // Main accent color from PRD
    600: '#5B7AE8',
    700: '#4967DA',
    800: '#3754CC',
    900: '#2541BE',
  },

  // Neutrals - From #0C0C0C to #F8F8F8 as specified in PRD
  neutral: {
    900: '#0C0C0C', // Darkest from PRD
    800: '#1A1A1A',
    700: '#2D2D2D',
    600: '#404040',
    500: '#525252',
    400: '#737373',
    300: '#A3A3A3',
    200: '#D4D4D4',
    100: '#E5E5E5',
    50: '#F8F8F8', // Lightest from PRD
  },

  // Semantic colors for app states
  success: {
    50: '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
  },
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  },

  // Surface colors - warm and trustworthy
  background: '#FFFFFF',
  surface: '#FAFAFA',
  border: '#E5E5E5',
} as const;

export type ColorToken = keyof typeof colors; 