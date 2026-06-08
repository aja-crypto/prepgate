// Server-side empty progress factory — mirrors frontend emptyState.js

const SYLLABUS_TOPICS = [
  { id: 1, name: 'Linear Algebra', subject: 'Engineering Mathematics', done: false },
  { id: 2, name: 'Calculus & Differential Equations', subject: 'Engineering Mathematics', done: false },
  { id: 3, name: 'Boolean Algebra', subject: 'Digital Logic', done: false },
  { id: 4, name: 'Pipelining & Hazards', subject: 'Computer Organization', done: false },
  { id: 5, name: 'Dynamic Programming', subject: 'Algorithms', done: false },
  { id: 6, name: 'Process Scheduling', subject: 'Operating Systems', done: false },
  { id: 7, name: 'SQL Joins & Subqueries', subject: 'DBMS', done: false },
  { id: 8, name: 'TCP/IP Stack', subject: 'Computer Networks', done: false },
  { id: 9, name: 'Turing Machines', subject: 'TOC', done: false },
  { id: 10, name: 'LL & LR Parsing', subject: 'Compiler Design', done: false },
];

const GATE_SUBJECTS = [
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

function getEmptyGateFeatures() {
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

function getEmptyProgressData() {
  return {
    topics: JSON.parse(JSON.stringify(SYLLABUS_TOPICS)),
    notes: [],
    pyqs: [],
    mocks: [],
    studyStats: {
      todayHours: 0,
      weekHours: 0,
      streak: { current: 0, longest: 0 },
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      subjects: JSON.parse(JSON.stringify(GATE_SUBJECTS)),
    },
    gateFeatures: getEmptyGateFeatures(),
    gamification: { xp: 0, level: 1, badges: [], badgeDates: {} },
    revisionSchedule: [],
    resources: [],
    productivity: { journal: [], tasks: [], pomodoroSessions: 0, focusModeEnabled: false },
    notifications: {
      dailyStudy: { enabled: true, time: '08:00' },
      revision: { enabled: true, time: '18:00' },
      mockTest: { enabled: false, time: '10:00', day: 'sunday' },
      goalCompletion: { enabled: true },
      pushEnabled: false,
    },
    lastSaved: null,
    initialized: true,
  };
}

module.exports = { getEmptyProgressData, SYLLABUS_TOPICS, GATE_SUBJECTS };
