/**
 * src/theme/index.ts
 * Barrel export so components can `import { theme } from '../theme'`.
 */
import { colors, tierColors } from './colors';
import { fontFamily, fontSize, lineHeight, letterSpacing } from './typography';
import { spacing, radius, layout, strokeWidth } from './spacing';

export const theme = {
  colors,
  tierColors,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  layout,
  strokeWidth,
};

export type Theme = typeof theme;

export * from './colors';
export * from './typography';
export * from './spacing';
