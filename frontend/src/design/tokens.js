// PrepFlow design system — original palette (not generic GATE blue-green)

export const BRAND = {
  name: 'PrepFlow',
  tagline: 'GATE CSE Intelligence',
  product: 'GATE 2027',
};

export const COLOR_PRESETS = {
  violet: {
    id: 'violet',
    label: 'Violet Pulse',
    primary: '#7C3AED',
    secondary: '#4F46E5',
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
    secondary: '#0891B2',
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
  success: '#10B981',
  warning: '#F97316',
  danger: '#EF4444',
};

export const DEFAULT_WIDGETS = [
  { id: 'welcome', label: 'Getting Started', defaultVisible: true, category: 'overview' },
  { id: 'countdown', label: 'Exam Countdown', defaultVisible: true, category: 'overview' },
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
  { id: 'ai-mentor', label: 'AI Mentor Insights', defaultVisible: true, category: 'insights' },
  { id: 'recommendations', label: 'Recommendations', defaultVisible: true, category: 'insights' },
  { id: 'predictions', label: 'Score Predictions', defaultVisible: true, category: 'insights' },
];

export function getDefaultWidgetLayout() {
  return DEFAULT_WIDGETS.map((w, i) => ({
    id: w.id,
    visible: w.defaultVisible,
    order: i,
  }));
}
