import { api } from './api';

export const FEEDBACK_CATEGORY_DISPLAY = {
  ui_ux: { label: 'UI/UX', icon: '🎨', color: '#8B5CF6' },
  bug: { label: 'Bug', icon: '🐞', color: '#EF4444' },
  content: { label: 'Content', icon: '📚', color: '#06B6D4' },
  feature_request: { label: 'Feature Request', icon: '💡', color: '#22D3EE' },
  performance: { label: 'Performance', icon: '⚡', color: '#F59E0B' },
  general: { label: 'General', icon: '💬', color: '#22C55E' },
};

const LEGACY_CATEGORY_MAP = {
  bug_report: 'bug',
  feature: 'feature_request',
  uiux: 'ui_ux',
  ai: 'general',
  mobile: 'ui_ux',
  suggestion: 'general',
  question: 'general',
  complaint: 'performance',
  appreciation: 'general',
};

export function resolveDisplayCategory(rawCategory) {
  if (!rawCategory) return FEEDBACK_CATEGORY_DISPLAY.general;
  if (FEEDBACK_CATEGORY_DISPLAY[rawCategory]) return FEEDBACK_CATEGORY_DISPLAY[rawCategory];
  const mapped = LEGACY_CATEGORY_MAP[rawCategory];
  if (mapped && FEEDBACK_CATEGORY_DISPLAY[mapped]) return FEEDBACK_CATEGORY_DISPLAY[mapped];
  return FEEDBACK_CATEGORY_DISPLAY.general;
}

export const FEEDBACK_STATUS_DISPLAY = {
  new: { label: 'New', color: 'bg-slate-500/20 text-slate-300', dot: 'bg-slate-400' },
  reviewing: { label: 'Reviewing', color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  planned: { label: 'Planned', color: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400' },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
  closed: { label: 'Closed', color: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
  unread: { label: 'New', color: 'bg-slate-500/20 text-slate-300', dot: 'bg-slate-400' },
  archived: { label: 'Closed', color: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
};

export function resolveDisplayStatus(rawStatus) {
  if (!rawStatus) return FEEDBACK_STATUS_DISPLAY.new;
  return FEEDBACK_STATUS_DISPLAY[rawStatus] || FEEDBACK_STATUS_DISPLAY.new;
}

export function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return '⭐'.repeat(r) + '☆'.repeat(5 - r);
}

export const userFeedbackService = {
  listMyTickets: async ({ limit = 8 } = {}) => {
    const res = await api.get(`/user-feedback/my-tickets?limit=${limit}`);
    return res?.data?.data || res?.data?.tickets || [];
  },
  getTicket: async (id) => {
    const res = await api.get(`/user-feedback/ticket/${id}`);
    return res?.data?.data || res?.data?.ticket || null;
  },
  submitTicket: async (payload) => {
    const res = await api.post('/user-feedback/ticket', payload);
    return res?.data?.data || res?.data?.ticket || null;
  },
  replyToTicket: async (ticketId, message) => {
    const res = await api.post(`/user-feedback/ticket/${ticketId}/reply`, { message });
    return res?.data?.data || null;
  },
};

export default userFeedbackService;
