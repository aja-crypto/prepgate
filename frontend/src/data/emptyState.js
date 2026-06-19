// Zero-state progress for brand-new user accounts — no demo/sample data
import { BADGE_DEFINITIONS, DEFAULT_RESOURCES } from './defaults';



export const SYLLABUS_TOPICS = [
  { 
    id: 1, 
    name: 'Linear Algebra', 
    subject: 'Engineering Mathematics', 
    done: false,
    weightage: 5,
    pyqFrequency: '1-2/year',
    priority: 'High',
    resources: {
      lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true
    },
    progress: {
      lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false
    },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 2, 
    name: 'Calculus & Differential Equations', 
    subject: 'Engineering Mathematics', 
    done: false,
    weightage: 5,
    pyqFrequency: '1-2/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 3, 
    name: 'Boolean Algebra', 
    subject: 'Digital Logic', 
    done: false,
    weightage: 4,
    pyqFrequency: '1/year',
    priority: 'Medium',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 4, 
    name: 'Pipelining & Hazards', 
    subject: 'Computer Organization', 
    done: false,
    weightage: 5,
    pyqFrequency: '1-2/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 5, 
    name: 'Dynamic Programming', 
    subject: 'Algorithms', 
    done: false,
    weightage: 5,
    pyqFrequency: '2-3/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 6, 
    name: 'Process Scheduling', 
    subject: 'Operating Systems', 
    done: false,
    weightage: 5,
    pyqFrequency: '1-2/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 7, 
    name: 'SQL Joins & Subqueries', 
    subject: 'DBMS', 
    done: false,
    weightage: 5,
    pyqFrequency: '1-2/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 8, 
    name: 'TCP/IP Stack', 
    subject: 'Computer Networks', 
    done: false,
    weightage: 4,
    pyqFrequency: '1/year',
    priority: 'Medium',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 9, 
    name: 'Turing Machines', 
    subject: 'TOC', 
    done: false,
    weightage: 5,
    pyqFrequency: '1/year',
    priority: 'High',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
  { 
    id: 10, 
    name: 'LL & LR Parsing', 
    subject: 'Compiler Design', 
    done: false,
    weightage: 4,
    pyqFrequency: '1/year',
    priority: 'Medium',
    resources: { lecture: true, notes: true, formulaSheet: true, pyqs: true, topicTest: true, shortNotes: true },
    progress: { lecture: false, notes: false, revision1: false, revision2: false, revision3: false, revision4: false, pyqs: false, topicTest: false },
    lastRevised: null,
    revisionSchedule: [3, 7, 15, 30]
  },
];

export const GATE_SUBJECTS = [
  { name: 'Engineering Mathematics', icon: '🔢', progress: 0, color: '#4f8dff' },
  { name: 'Digital Logic', icon: '💻', progress: 0, color: '#7c5cfc' },
  { name: 'Computer Organization', icon: '🖥', progress: 0, color: '#06d6a0' },
  { name: 'Programming & DS', icon: '🐍', progress: 0, color: '#ff9f43' },
  { name: 'Algorithms', icon: '⚡', progress: 0, color: '#ff6b6b' },
  { name: 'Operating Systems', icon: '⚙️', progress: 0, color: '#a855f7' },
  { name: 'DBMS', icon: '🗄', progress: 0, color: '#06b6d4' },
  { name: 'Computer Networks', icon: '🌐', progress: 0, color: '#ffd166' },
  { name: 'Theory of Computation', icon: '🤖', progress: 0, color: '#f72585' },
  { name: 'Compiler Design', icon: '🔧', progress: 0, color: '#4cc9f0' },
  { name: 'Aptitude', icon: '🧮', progress: 0, color: '#43aa8b' },
];

export function getEmptyGateFeatures() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    examDate: '2027-02-07T09:00:00',
    dailyTarget: { hours: 8, topicsToComplete: 3 },
    weeklyGoal: { hours: 50, topics: 15, mocks: 1 },
    monthlyGoal: { hours: 200, topics: 60, mocks: 4 },
    todayProgress: { hours: 0, topicsCompleted: 0, date: today },
    studyPlans: {},
    streak: { current: 0, longest: 0, activityLog: {} },
    monthlyHours: [0, 0, 0, 0, 0, 0],
    weeklyAccuracy: [0, 0, 0, 0, 0, 0, 0],
  };
}

export function getEmptyGamification() {
  return { xp: 0, level: 1, badges: [], badgeDates: {} };
}

export function getEmptyNotifications() {
  return {
    dailyStudy: { enabled: true, time: '08:00' },
    revision: { enabled: true, time: '18:00' },
    mockTest: { enabled: false, time: '10:00', day: 'sunday' },
    goalCompletion: { enabled: true },
    pushEnabled: false,
  };
}

export function getEmptyProductivity() {
  return { journal: [], tasks: [], pomodoroSessions: 0, focusModeEnabled: false };
}

/** Brand-new account — all progress at 0%, empty arrays */
export function getEmptyProgressData() {
  return {
    topics: structuredClone(SYLLABUS_TOPICS),
    notes: [],
    pyqs: [],
    mocks: [],
    studyStats: {
      todayHours: 0,
      weekHours: 0,
      streak: { current: 0, longest: 0 },
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      subjects: structuredClone(GATE_SUBJECTS),
    },
    gateFeatures: getEmptyGateFeatures(),
    gamification: getEmptyGamification(),
    revisionSchedule: [],
    resources: structuredClone(DEFAULT_RESOURCES),
    productivity: getEmptyProductivity(),
    notifications: getEmptyNotifications(),
    lastSaved: null,
    initialized: true,
  };
}

/** Merge saved data onto empty structure — never inject demo values */
export function mergeProgressData(parsed) {
  if (!parsed || typeof parsed !== 'object') return getEmptyProgressData();
  const empty = getEmptyProgressData();
  return {
    ...empty,
    ...parsed,
    topics: parsed.topics ?? empty.topics,
    notes: parsed.notes ?? empty.notes,
    pyqs: (parsed.pyqs ?? empty.pyqs).map((p) => ({
      bookmarked: false,
      revisionNeeded: false,
      markedDifficult: false,
      topic: p.topic || p.title,
      ...p,
    })),
    mocks: parsed.mocks ?? empty.mocks,
    studyStats: {
      ...empty.studyStats,
      ...parsed.studyStats,
      streak: { ...empty.studyStats.streak, ...parsed.studyStats?.streak },
      weeklyHours: parsed.studyStats?.weeklyHours ?? empty.studyStats.weeklyHours,
      subjects: parsed.studyStats?.subjects ?? empty.studyStats.subjects,
    },
    gateFeatures: { ...empty.gateFeatures, ...parsed.gateFeatures },
    gamification: { ...empty.gamification, ...parsed.gamification },
    revisionSchedule: parsed.revisionSchedule ?? empty.revisionSchedule,
    resources: parsed.resources ?? empty.resources,
    productivity: { ...empty.productivity, ...parsed.productivity },
    notifications: { ...empty.notifications, ...parsed.notifications },
    lastSaved: parsed.lastSaved ?? null,
    initialized: true,
  };
}

export function isEmptyProgress(data) {
  if (!data) return true;
  const topicsDone = (data.topics || []).filter((t) => t.done).length;
  const pyqsSolved = (data.pyqs || []).filter((p) => p.solved).length;
  const hasMocks = (data.mocks || []).length > 0;
  const hasNotes = (data.notes || []).length > 0;
  const hours = data.studyStats?.todayHours || 0;
  const weekHours = data.studyStats?.weekHours || 0;
  const streak = data.gateFeatures?.streak?.current || 0;
  return topicsDone === 0 && pyqsSolved === 0 && !hasMocks && !hasNotes && hours === 0 && weekHours === 0 && streak === 0;
}

export { BADGE_DEFINITIONS };
