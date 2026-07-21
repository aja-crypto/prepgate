/**
 * src/theme/typography.ts
 * Type scale used across the report. Font family names must match the
 * families registered in src/fonts/registerFonts.ts.
 */

export const fontFamily = {
  sans: 'Inter',
  sansSemibold: 'Inter-SemiBold',
  sansBold: 'Inter-Bold',
  mono: 'RobotoMono',
} as const;

export const fontSize = {
  h1: 26,
  h2: 18,
  h3: 14,
  h4: 11.5,
  body: 9,
  bodySm: 8.2,
  caption: 7.2,
  micro: 6.4,
  kpiValue: 20,
  kpiValueLg: 30,
  tableHeader: 7.5,
  tableCell: 8,
} as const;

export const lineHeight = {
  tight: 1.15,
  normal: 1.35,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  normal: 0,
  wide: 0.4,
  wider: 1.1,
  widest: 2,
} as const;
