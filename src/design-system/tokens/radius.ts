// Sprout DS Radius Tokens - as specified in PRD (4, 8, 16)
export const radius = {
  none: 0,
  sm: 4,   // PRD specification
  md: 8,   // PRD specification  
  lg: 16,  // PRD specification
  full: 9999, // Fully rounded
} as const;

export type RadiusToken = keyof typeof radius; 