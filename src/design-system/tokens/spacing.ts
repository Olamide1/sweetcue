// Sprout DS Spacing Tokens - 4-pt grid as specified in PRD
export const spacing = {
  0: 0,
  1: 4,   // 1 * 4pt
  2: 8,   // 2 * 4pt
  3: 12,  // 3 * 4pt
  4: 16,  // 4 * 4pt
  5: 20,  // 5 * 4pt
  6: 24,  // 6 * 4pt
  8: 32,  // 8 * 4pt
  10: 40, // 10 * 4pt
  12: 48, // 12 * 4pt
  16: 64, // 16 * 4pt
  20: 80, // 20 * 4pt
  24: 96, // 24 * 4pt
  32: 128, // 32 * 4pt
  40: 160, // 40 * 4pt
  48: 192, // 48 * 4pt
  56: 224, // 56 * 4pt
  64: 256, // 64 * 4pt
} as const;

export type SpacingToken = keyof typeof spacing; 