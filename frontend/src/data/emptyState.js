import { BADGE_DEFINITIONS, getDefaultGamification, getDefaultRevisionSchedule, getDefaultProductivity, getDefaultNotifications, getDefaultGateFeatures } from './defaults';

export { BADGE_DEFINITIONS };

const EMPTY_STRUCTURE = {
  topics: [],
  notes: [],
  pyqs: [],
  mocks: [],
  studyStats: {
    todayHours: 0,
    weekHours: 0,
    streak: { current: 0, longest: 0 },
    weeklyHours: [],
    subjects: [],
  },
  gateFeatures: getDefaultGateFeatures(),
  gamification: getDefaultGamification(),
  revisionSchedule: [],
  resources: [],
  productivity: getDefaultProductivity(),
  notifications: getDefaultNotifications(),
  lastSaved: null,
};

export function getEmptyProgressData() {
  return JSON.parse(JSON.stringify(EMPTY_STRUCTURE));
}

export function mergeProgressData(partial) {
  const empty = getEmptyProgressData();
  if (!partial || typeof partial !== 'object') return empty;
  const merged = { ...empty, ...partial };
  merged.studyStats = { ...empty.studyStats, ...(partial.studyStats || {}) };
  merged.studyStats.streak = { ...empty.studyStats.streak, ...(partial.studyStats?.streak || {}) };
  // Ensure nullable objects always have defaults (prevents null-access crashes in pages)
  if (!merged.gateFeatures) merged.gateFeatures = empty.gateFeatures;
  if (!merged.gamification) merged.gamification = empty.gamification;
  if (!merged.productivity) merged.productivity = empty.productivity;
  if (!merged.notifications) merged.notifications = empty.notifications;
  return merged;
}

export function isEmptyProgress(data) {
  if (!data) return true;
  const t = data.topics, n = data.notes, p = data.pyqs, m = data.mocks;
  return (!t || t.length === 0) && (!n || n.length === 0) && (!p || p.length === 0) && (!m || m.length === 0);
}
