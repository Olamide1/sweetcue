import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { elevation } from './elevation';
import { typography } from './typography';

export { colors, type ColorToken } from './colors';
export { spacing, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';
export { elevation, type ElevationToken } from './elevation';
export { typography, type FontSize, type FontWeight, type LineHeight } from './typography';

// Export a combined theme object for easy access
export const theme = {
  colors,
  spacing,
  radius,
  elevation,
  typography,
} as const; 