/**
 * src/theme/colors.ts
 * Single source of truth for the GateNexa palette.
 * Derived from brand assets: near-black background, violet→blue gradient accent,
 * neon-green "safe/qualified" signal, amber caution, red risk.
 */

export const colors = {
  // Backgrounds
  bgPage: '#07040F',
  bgPanel: '#0F0B1E',
  bgPanelAlt: '#130E24',
  bgCard: '#160F29',
  bgCardBorder: '#2C1F4A',

  // Brand gradient (violet -> blue), sampled from the N-symbol / wordmark
  brandVioletDark: '#5B21B6',
  brandViolet: '#8B5CF6',
  brandVioletLight: '#B79CFF',
  brandBlue: '#4C6FFF',
  brandBlueLight: '#7C9BFF',

  // Text
  textPrimary: '#F5F3FF',
  textSecondary: '#B8AFD9',
  textMuted: '#7B7299',
  textOnAccent: '#0B0716',

  // Divider / hairline
  hairline: '#241A3D',
  hairlineStrong: '#3A2C5E',

  // Status / tier colors
  safe: '#34D399',
  safeBg: '#0E2A22',
  high: '#60A5FA',
  highBg: '#0E2036',
  moderate: '#FBBF24',
  moderateBg: '#332408',
  ambitious: '#FB923C',
  ambitiousBg: '#331B08',
  dream: '#F87171',
  dreamBg: '#330E12',

  success: '#34D399',
  successBg: '#0E2A22',

  tableHeaderBg: '#6D28D9',
  tableRowAlt: '#110B22',
  tableRowBase: '#0C0818',

  watermark: '#8B5CF6',
} as const;

export type TierColorSet = {
  fg: string;
  bg: string;
};

export const tierColors: Record<string, TierColorSet> = {
  safe: { fg: colors.safe, bg: colors.safeBg },
  high: { fg: colors.high, bg: colors.highBg },
  moderate: { fg: colors.moderate, bg: colors.moderateBg },
  ambitious: { fg: colors.ambitious, bg: colors.ambitiousBg },
  dream: { fg: colors.dream, bg: colors.dreamBg },
};
