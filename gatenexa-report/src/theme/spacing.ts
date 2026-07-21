/**
 * src/theme/spacing.ts
 * Compact spacing scale — deliberately tight so the report holds its
 * original 5-page footprint (cover, summary, IIT table, NIT/IIIT table,
 * counselling + disclaimer) without overflowing to extra pages.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 3,
  md: 6,
  lg: 10,
  pill: 999,
  circle: 999,
} as const;

export const layout = {
  pageWidth: 595.28, // A4 pt
  pageHeight: 841.89, // A4 pt
  pageMargin: 34,
  contentWidth: 595.28 - 34 * 2,
  headerHeight: 46,
  footerHeight: 26,
} as const;

export const strokeWidth = {
  hairline: 0.6,
  thin: 1,
  regular: 1.4,
} as const;
