// src/data/defaults.js — shared constants and demo data (demo account only)
// New users use emptyState.js via getEmptyProgressData()

export const DEFAULT_TOPICS = [
  { id: 1, name: 'Linear Algebra', subject: 'Engineering Mathematics', done: true },
  { id: 2, name: 'Calculus & Differential Equations', subject: 'Engineering Mathematics', done: true },
  { id: 3, name: 'Boolean Algebra', subject: 'Digital Logic', done: true },
  { id: 4, name: 'Pipelining & Hazards', subject: 'Computer Organization', done: false },
  { id: 5, name: 'Dynamic Programming', subject: 'Algorithms', done: false },
  { id: 6, name: 'Process Scheduling', subject: 'Operating Systems', done: false },
  { id: 7, name: 'SQL Joins & Subqueries', subject: 'DBMS', done: true },
  { id: 8, name: 'TCP/IP Stack', subject: 'Computer Networks', done: false },
  { id: 9, name: 'Turing Machines', subject: 'TOC', done: false },
  { id: 10, name: 'LL & LR Parsing', subject: 'Compiler Design', done: false },
];

export const DEFAULT_NOTES = [
  { id: 1, title: 'OS Scheduling Algorithms', subject: 'Operating Systems', content: 'FCFS: Non-preemptive, convoy effect. SJF: Optimal avg wait, starvation possible. SRTF: Preemptive SJF. Round Robin: Best for time-sharing, quantum matters.', date: 'Jun 3, 2026', color: '#a855f7' },
  { id: 2, title: 'SQL – Joins & Subqueries', subject: 'DBMS', content: 'INNER JOIN: matching rows only. LEFT JOIN: all left + matching right. Correlated subquery executes per outer row. EXISTS vs IN performance trade-offs.', date: 'Jun 1, 2026', color: '#06b6d4' },
  { id: 3, title: 'Graph Algorithms Summary', subject: 'Algorithms', content: 'Dijkstra: O((V+E)logV), no negative weights. Bellman-Ford: O(VE), handles negatives. Floyd-Warshall: O(V³), all-pairs. Kruskal/Prim: MST algorithms.', date: 'May 29, 2026', color: '#ff6b6b' },
  { id: 4, title: 'Normalization Forms', subject: 'DBMS', content: '1NF: Atomic values. 2NF: 1NF + No partial dependency. 3NF: 2NF + No transitive dependency. BCNF: Every determinant is a candidate key.', date: 'May 27, 2026', color: '#4f8dff' },
];

export const DEFAULT_PYQS = [
  { id: 1, title: 'Deadlock Detection', topic: 'Deadlock', subject: 'Operating Systems', year: 2022, difficulty: 'medium', solved: true, bookmarked: false, revisionNeeded: false, markedDifficult: false },
  { id: 2, title: 'B+ Tree Operations', topic: 'B+ Trees', subject: 'DBMS', year: 2023, difficulty: 'hard', solved: false, bookmarked: true, revisionNeeded: true, markedDifficult: true },
  { id: 3, title: 'Context Free Grammar', topic: 'CFG', subject: 'TOC', year: 2022, difficulty: 'hard', solved: false, bookmarked: false, revisionNeeded: true, markedDifficult: true },
  { id: 4, title: 'Pipelining Hazards', topic: 'Pipelining', subject: 'Computer Organization', year: 2023, difficulty: 'medium', solved: true, bookmarked: false, revisionNeeded: false, markedDifficult: false },
  { id: 5, title: 'Dynamic Programming – Knapsack', topic: 'Dynamic Programming', subject: 'Algorithms', year: 2021, difficulty: 'medium', solved: true, bookmarked: true, revisionNeeded: false, markedDifficult: false },
  { id: 6, title: 'TCP Congestion Control', topic: 'TCP/IP', subject: 'Computer Networks', year: 2022, difficulty: 'easy', solved: false, bookmarked: false, revisionNeeded: false, markedDifficult: false },
  { id: 7, title: 'Boolean Simplification', topic: 'Boolean Algebra', subject: 'Digital Logic', year: 2023, difficulty: 'easy', solved: true, bookmarked: false, revisionNeeded: false, markedDifficult: false },
  { id: 8, title: 'Eigenvalues & Eigenvectors', topic: 'Linear Algebra', subject: 'Engineering Mathematics', year: 2021, difficulty: 'medium', solved: false, bookmarked: false, revisionNeeded: true, markedDifficult: false },
  { id: 9, title: 'Shift-Reduce Parsing', topic: 'Parsing', subject: 'Compiler Design', year: 2022, difficulty: 'hard', solved: false, bookmarked: false, revisionNeeded: true, markedDifficult: true },
  { id: 10, title: 'Hashing Collisions', topic: 'Hashing', subject: 'Programming & DS', year: 2021, difficulty: 'easy', solved: true, bookmarked: false, revisionNeeded: false, markedDifficult: false },
  { id: 11, title: 'Cache Replacement Policy', topic: 'Cache Memory', subject: 'Computer Organization', year: 2023, difficulty: 'medium', solved: false, bookmarked: true, revisionNeeded: false, markedDifficult: false },
  { id: 12, title: 'Turing Machine Halting', topic: 'Turing Machines', subject: 'TOC', year: 2021, difficulty: 'hard', solved: false, bookmarked: false, revisionNeeded: true, markedDifficult: true },
];

export const DEFAULT_MOCKS = [
  { id: 1, name: 'MADE Easy Full Test 1', date: 'Apr 5, 2026', score: 42.5, rank: 1842, notes: 'Weak in OS & CN' },
  { id: 2, name: 'MADE Easy Full Test 2', date: 'Apr 19, 2026', score: 48.0, rank: 1245, notes: 'DS improved' },
  { id: 3, name: 'ACE Academy Test 1', date: 'May 3, 2026', score: 51.5, rank: 980, notes: 'Good algorithms' },
  { id: 4, name: 'MADE Easy Full Test 3', date: 'May 10, 2026', score: 53.0, rank: 820, notes: 'DBMS weak' },
  { id: 5, name: 'GATE Wallah Test 1', date: 'May 18, 2026', score: 55.5, rank: 710, notes: 'Consistent' },
  { id: 6, name: 'ACE Academy Test 2', date: 'May 25, 2026', score: 58.0, rank: 620, notes: 'Best so far' },
  { id: 7, name: 'MADE Easy Full Test 4', date: 'Jun 1, 2026', score: 62.0, rank: 520, notes: 'TOC improved' },
  { id: 8, name: 'GATE Wallah Test 2', date: 'Jun 5, 2026', score: 67.5, rank: 380, notes: 'Personal best!' },
];

export const DEFAULT_SUBJECTS = [
  { name: 'Engineering Mathematics', icon: '🔢', progress: 75, color: '#4f8dff' },
  { name: 'Digital Logic', icon: '💻', progress: 80, color: '#7c5cfc' },
  { name: 'Computer Organization', icon: '🖥', progress: 55, color: '#06d6a0' },
  { name: 'Programming & DS', icon: '🐍', progress: 70, color: '#ff9f43' },
  { name: 'Algorithms', icon: '⚡', progress: 60, color: '#ff6b6b' },
  { name: 'Operating Systems', icon: '⚙️', progress: 65, color: '#a855f7' },
  { name: 'DBMS', icon: '🗄', progress: 72, color: '#06b6d4' },
  { name: 'Computer Networks', icon: '🌐', progress: 50, color: '#ffd166' },
  { name: 'Theory of Computation', icon: '🤖', progress: 45, color: '#f72585' },
  { name: 'Compiler Design', icon: '🔧', progress: 40, color: '#4cc9f0' },
  { name: 'Aptitude', icon: '🧮', progress: 82, color: '#43aa8b' },
];

function buildDefaultActivityLog() {
  const log = {};
  const d = new Date();
  for (let i = 0; i < 21; i++) {
    const date = new Date(d.getTime() - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    log[key] = { hours: 5 + Math.random() * 4, level: 'full' };
  }
  return log;
}

export const DEFAULT_RESOURCES = [
  { id: 1, subject: 'Operating Systems', type: 'youtube', title: 'OS Full Course – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLIPZ2Afxds2yKk2q8LmH1Yl7k1n7cYgQq' },
  { id: 2, subject: 'DBMS', type: 'youtube', title: 'DBMS Playlist – Knowledge Gate', url: 'https://www.youtube.com/playlist?list=PLmE-VhZRN9JhZg1qJdJdJdJdJdJdJdJdJ' },
  { id: 3, subject: 'Algorithms', type: 'youtube', title: 'Algorithms by Abdul Bari', url: 'https://www.youtube.com/playlist?list=PL2_aWCzGMAwL3Wz-857Y4KkhBba6yH0-O' },
  { id: 4, subject: 'Computer Networks', type: 'textbook', title: 'Computer Networking: A Top-Down Approach – Kurose & Ross', url: 'https://www.amazon.in/Computer-Networking-Top-Down-Approach-Kurose/dp/0133594149' },
  { id: 5, subject: 'TOC', type: 'textbook', title: 'Introduction to Automata Theory – Hopcroft & Ullman', url: 'https://www.amazon.in/Introduction-Automata-Theory-Languages-Computation/dp/0321455363' },
  { id: 6, subject: 'Engineering Mathematics', type: 'gateoverflow', title: 'Engineering Maths – GateOverflow', url: 'https://gateoverflow.in/tag/engineering-mathematics' },
  { id: 7, subject: 'Compiler Design', type: 'practice', title: 'Compiler Design Practice Papers', url: 'https://practice.geeksforgeeks.org/explore?page=1&sortBy=submissions&itm_source=geeksforgeeks&itm_medium=main_header&itm_campaign=practice_header' },
  { id: 8, subject: 'Digital Logic', type: 'youtube', title: 'Digital Logic – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnKghO6lBq-Rl_3tLYhm0LAHPHz6sU8' },
  { id: 9, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures by MyCodeSchool', url: 'https://www.youtube.com/user/mycodeschool/playlists' },
  { id: 10, subject: 'Discrete Mathematics', type: 'textbook', title: 'Discrete Mathematics and its Applications – Kenneth Rosen', url: 'https://www.amazon.in/Discrete-Mathematics-Applications-Kenneth-Rosen/dp/0073383090' },
];

export const BADGE_DEFINITIONS = [
  { id: '7-day-streak', name: '7-Day Streak', icon: '🔥', xp: 100, desc: 'Study 7 days in a row' },
  { id: '30-day-streak', name: '30-Day Streak', icon: '💎', xp: 500, desc: 'Study 30 days in a row' },
  { id: '100-pyq', name: '100 PYQs Solved', icon: '🏆', xp: 300, desc: 'Solve 100 previous year questions' },
  { id: 'subject-master-os', name: 'OS Master', icon: '⚙️', xp: 200, desc: 'Complete all OS topics' },
  { id: 'first-mock', name: 'First Mock', icon: '🎯', xp: 50, desc: 'Complete your first mock test' },
  { id: 'week-warrior', name: 'Week Warrior', icon: '⚡', xp: 150, desc: 'Hit weekly study goal' },
];

export function getDefaultGamification() {
  return { xp: 1250, level: 5, badges: ['7-day-streak', 'first-mock'], badgeDates: { '7-day-streak': '2026-05-20', 'first-mock': '2026-04-05' } };
}

export function getDefaultRevisionSchedule() {
  const today = new Date();
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  return [
    { id: 1, topicName: 'Linear Algebra', subject: 'Engineering Mathematics', dueDate: addDays(-2), status: 'missed', interval: 7, lastReviewed: '2026-05-28' },
    { id: 2, topicName: 'Process Scheduling', subject: 'Operating Systems', dueDate: addDays(1), status: 'upcoming', interval: 14, lastReviewed: '2026-05-24' },
    { id: 3, topicName: 'B+ Tree Operations', subject: 'DBMS', dueDate: addDays(3), status: 'upcoming', interval: 7, lastReviewed: '2026-05-30' },
    { id: 4, topicName: 'Dynamic Programming', subject: 'Algorithms', dueDate: addDays(5), status: 'upcoming', interval: 21, lastReviewed: '2026-05-15' },
  ];
}

export function getDefaultProductivity() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    journal: [
      { id: 1, date: today, content: 'Focused on OS scheduling today. Need more practice on SRTF problems.', mood: 'good' },
      { id: 2, date: '2026-06-05', content: 'Completed 3 PYQs from DBMS. B+ trees still confusing.', mood: 'okay' },
    ],
    tasks: [
      { id: 1, text: 'Revise Process Scheduling algorithms', done: false, priority: 'high' },
      { id: 2, text: 'Solve 5 hard PYQs from TOC', done: false, priority: 'medium' },
      { id: 3, text: 'Watch CN TCP/IP lecture', done: true, priority: 'low' },
      { id: 4, text: 'Take MADE Easy mock test', done: false, priority: 'high' },
    ],
    pomodoroSessions: 3,
    focusModeEnabled: false,
  };
}

export function getDefaultNotifications() {
  return {
    dailyStudy: { enabled: true, time: '08:00' },
    revision: { enabled: true, time: '18:00' },
    mockTest: { enabled: false, time: '10:00', day: 'sunday' },
    goalCompletion: { enabled: true },
    pushEnabled: false,
  };
}

export function getDefaultGateFeatures() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    examDate: '2027-02-07T09:00:00',
    dailyTarget: { hours: 8, topicsToComplete: 3 },
    weeklyGoal: { hours: 50, topics: 15, mocks: 1 },
    monthlyGoal: { hours: 200, topics: 60, mocks: 4 },
    todayProgress: { hours: 7.5, topicsCompleted: 2, date: today },
    studyPlans: {
      [today]: [{ id: 1, subject: 'Operating Systems', topic: 'Process Scheduling', hours: 2, notes: 'Revise FCFS, SJF, RR' }],
    },
    streak: { current: 21, longest: 21, activityLog: buildDefaultActivityLog() },
    monthlyHours: [38, 42, 45, 40, 48, 42],
    weeklyAccuracy: [72, 75, 78, 74, 80, 82, 79],
  };
}

export function getDefaultProgressData() {
  // @deprecated — use getEmptyProgressData() from emptyState.js for new users
  // Kept for demo account only via getDemoProgressData()
  return getDemoProgressData();
}

/** Demo account sample data — only for demo@gate2027.in */
export function getDemoProgressData() {
  return {
    topics: structuredClone(DEFAULT_TOPICS),
    notes: structuredClone(DEFAULT_NOTES),
    pyqs: structuredClone(DEFAULT_PYQS),
    mocks: structuredClone(DEFAULT_MOCKS),
    studyStats: {
      todayHours: 7.5,
      weekHours: 42,
      streak: { current: 21, longest: 21 },
      weeklyHours: [6.5, 7, 8, 5.5, 7.5, 9, 4],
      subjects: structuredClone(DEFAULT_SUBJECTS),
    },
    gateFeatures: getDefaultGateFeatures(),
    gamification: getDefaultGamification(),
    revisionSchedule: getDefaultRevisionSchedule(),
    resources: structuredClone(DEFAULT_RESOURCES),
    productivity: getDefaultProductivity(),
    notifications: getDefaultNotifications(),
    lastSaved: null,
  };
}
