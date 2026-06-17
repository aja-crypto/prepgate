// PrepFlow design system — original palette (not generic GATE blue-green)

export const BRAND = {
  name: 'PrepGate',
  tagline: 'GATE CSE Intelligence',
  product: 'GATE 2027',
};

// Theme: Deep Space Navy (#050816) | Premium Purple (#8B5CF6) | Electric Cyan (#22D3EE) | Soft White (#F8FAFC)
export const BG = '#050816';
export const PURPLE = '#8B5CF6';
export const CYAN = '#22D3EE';
export const SOFT_WHITE = '#F8FAFC';

export const COLOR_PRESETS = {
  violet: {
    id: 'violet',
    label: 'Violet Pulse',
    primary: PURPLE,
    secondary: CYAN,
    accent: '#F59E0B',
  },
  rose: {
    id: 'rose',
    label: 'Rose Quartz',
    primary: '#E11D48',
    secondary: '#BE185D',
    accent: '#F59E0B',
  },
  teal: {
    id: 'teal',
    label: 'Midnight Teal',
    primary: '#0D9488',
    secondary: CYAN,
    accent: '#FBBF24',
  },
  slate: {
    id: 'slate',
    label: 'Monochrome Pro',
    primary: '#64748B',
    secondary: '#475569',
    accent: '#F59E0B',
  },
};

export const SEMANTIC = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  ai: CYAN,
  revision: '#F59E0B',
  progress: '#22C55E',
  alert: '#EF4444',
};

export const ROLE_COLORS = {
  primary: PURPLE,
  ai: CYAN,
  progress: '#22C55E',
  revision: '#F59E0B',
  alert: '#EF4444',
  surface: 'rgba(139,92,246,0.02)',
  border: 'rgba(139,92,246,0.08)',
};

export const DEFAULT_WIDGETS = [
  { id: 'welcome', label: 'Getting Started', defaultVisible: true, category: 'overview' },
  { id: 'focus-stats', label: 'Focus Session Stats', defaultVisible: true, category: 'progress' },
  { id: 'action-center', label: 'Am I Ready for GATE?', defaultVisible: true, category: 'overview' },
  { id: 'countdown', label: 'Exam Countdown', defaultVisible: true, category: 'overview' },
  { id: 'today-plan', label: "Today's Plan", defaultVisible: true, category: 'overview' },
  { id: 'stats', label: 'Key Metrics', defaultVisible: true, category: 'overview' },
  { id: 'live-news', label: 'Live News', defaultVisible: true, category: 'live' },
  { id: 'exam-schedule', label: 'Exam Schedule', defaultVisible: true, category: 'live' },
  { id: 'daily-content', label: 'Daily Content', defaultVisible: true, category: 'live' },
  { id: 'recruitment', label: 'Recruitment Feed', defaultVisible: true, category: 'live' },
  { id: 'trending', label: 'Trending Topics', defaultVisible: true, category: 'live' },
  { id: 'analysis', label: 'Topic Analysis', defaultVisible: true, category: 'insights' },
  { id: 'resources', label: 'Resources', defaultVisible: true, category: 'insights' },
  { id: 'goals', label: 'Goals & Streak', defaultVisible: true, category: 'progress' },
  { id: 'weekly-hours', label: 'Weekly Hours', defaultVisible: true, category: 'progress' },
  { id: 'subjects', label: 'Subject Progress', defaultVisible: true, category: 'progress' },
  { id: 'pinned-notes', label: 'Pinned Resources', defaultVisible: true, category: 'overview' },
  { id: 'success-hub', label: 'Success Hub', defaultVisible: true, category: 'insights' },
  { id: 'recommendations', label: 'Recommendations', defaultVisible: true, category: 'insights' },
  { id: 'predictions', label: 'Score Predictions', defaultVisible: true, category: 'insights' },
  { id: 'revision-schedule', label: 'Revision Schedule', defaultVisible: true, category: 'progress' },
  { id: 'progress-heatmap', label: 'Progress Heatmap', defaultVisible: true, category: 'progress' },
];

export function getDefaultWidgetLayout() {
  return DEFAULT_WIDGETS.map((w, i) => ({
    id: w.id,
    visible: w.defaultVisible,
    order: i,
  }));
}
