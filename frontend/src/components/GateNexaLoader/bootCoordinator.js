export const BOOT_VERSION = 1;
export const BOOT_KEY = `gatenexa_boot_v${BOOT_VERSION}_complete`;
export const BOOT_SAFETY_MS = 15000;

export function isBootComplete() {
  try { return localStorage.getItem(BOOT_KEY) === '1'; } catch { return true; }
}

export function markBootComplete() {
  try { localStorage.setItem(BOOT_KEY, '1'); } catch {}
}

export const BOOT_TASKS = [
  { id: 'auth', label: 'Preparing your workspace', critical: true, weight: 2 },
  { id: 'dashboard', label: 'Warming up your study tools', critical: true, weight: 2, importer: () => import('../../pages/DashboardPage.jsx') },
  { id: 'subjects', label: 'Preparing subjects', critical: false, weight: 1, importer: () => import('../../pages/SubjectsPage.jsx') },
  { id: 'topics', label: 'Preparing topics', critical: false, weight: 1, importer: () => import('../../pages/TopicsPage.jsx') },
  { id: 'learning-hub', label: 'Preparing Learning Hub', critical: false, weight: 1, importer: () => import('../../pages/LearningHubPage.jsx') },
  { id: 'mentor', label: 'Getting AI Mentor ready', critical: false, weight: 1, importer: () => import('../../pages/AIMentorPage.jsx') },
  { id: 'pyq', label: 'Preparing PYQ practice', critical: false, weight: 1, importer: () => import('../../pages/PYQPage.jsx') },
  { id: 'mocks', label: 'Preparing mock tests', critical: false, weight: 1, importer: () => import('../../pages/MocksPage.jsx') },
  { id: 'planner', label: 'Preparing your study planner', critical: false, weight: 1, importer: () => import('../../pages/StudyPlannerPage.jsx') },
  { id: 'analytics', label: 'Preparing analytics', critical: false, weight: 1, importer: () => import('../../pages/AnalyticsPage.jsx') },
  { id: 'notes', label: 'Preparing notes', critical: false, weight: 1, importer: () => import('../../pages/NotesPage.jsx') },
  { id: 'resources', label: 'Preparing resources', critical: false, weight: 1, importer: () => import('../../pages/ResourcesPage.jsx') },
  { id: 'revision', label: 'Preparing revision', critical: false, weight: 1, importer: () => import('../../pages/RevisionPage.jsx') },
  { id: 'productivity', label: 'Preparing productivity tools', critical: false, weight: 1, importer: () => import('../../pages/ProductivityPage.jsx') },
];

export function getTotalWeight() {
  return BOOT_TASKS.reduce((s, t) => s + t.weight, 0);
}
