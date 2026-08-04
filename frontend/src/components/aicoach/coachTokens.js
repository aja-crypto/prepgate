export const coachTokens = {
  colors: {
    bg: '#070B14',
    bgSoft: '#0A0F1E',
    card: 'rgba(18,23,36,0.72)',
    cardHover: 'rgba(22,28,44,0.78)',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(139,92,246,0.2)',
    borderFocus: 'rgba(139,92,246,0.4)',
    text: '#F1F5F9',
    textSoft: '#94A3B8',
    textMuted: '#64748B',
    accent: '#8B5CF6',
    accentLight: '#A78BFA',
    accentDark: '#7C3AED',
    accentSoft: 'rgba(139,92,246,0.08)',
    accentGlow: 'rgba(139,92,246,0.15)',
    success: '#22C55E',
    successSoft: 'rgba(34,197,94,0.08)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.08)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.08)',
    info: '#3B82F6',
    infoSoft: 'rgba(59,130,246,0.08)',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.06)',
  },

  spacing: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48,
  },

  radius: {
    sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
  },

  shadow: {
    card: '0 4px 24px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)',
    hover: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
    glow: '0 0 24px rgba(139,92,246,0.15)',
    glowStrong: '0 0 32px rgba(139,92,246,0.25)',
    cardLg: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
  },

  animation: {
    fast: '0.15s',
    normal: '0.25s',
    slow: '0.4s',
    xslow: '0.6s',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  blur: {
    glass: '12px',
    heavy: '24px',
  },

  typography: {
    hero: { size: 26, weight: 800, lh: 1.2, ls: '-0.03em' },
    greeting: { size: 22, weight: 700, lh: 1.3, ls: '-0.02em' },
    sectionTitle: { size: 15, weight: 600, lh: 1.3, ls: '-0.01em' },
    cardTitle: { size: 13, weight: 600, lh: 1.3 },
    body: { size: 13, weight: 400, lh: 1.5 },
    caption: { size: 11, weight: 400, lh: 1.4 },
    label: { size: 10, weight: 700, lh: 1, ls: '0.06em' },
    stat: { size: 24, weight: 800, lh: 1, ls: '-0.02em' },
    miniStat: { size: 20, weight: 700, lh: 1 },
    small: { size: 9, weight: 700, lh: 1, ls: '0.08em' },
    timer: { size: 28, weight: 700, lh: 1, ls: '-0.02em' },
  },

  cardStyle: {
    background: 'rgba(18,23,36,0.72)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 24,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)',
    transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
  },

  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '12px 0 20px',
  },
};

export default coachTokens;
