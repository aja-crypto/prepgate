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
  // ── YouTube Playlists ──────────────────────────────
  { id: 1, subject: 'Operating Systems', type: 'youtube', title: 'OS Complete Course – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Krs7ZhSIT9-J_v8T0S_XzE_' },
  { id: 2, subject: 'OS', type: 'youtube', title: 'Operating Systems – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O' },
  { id: 3, subject: 'DBMS', type: 'youtube', title: 'DBMS Complete Course – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvV_G2-0QvEclE9A_p6j0-z' },
  { id: 4, subject: 'DBMS', type: 'youtube', title: 'DBMS – Knowledge Gate', url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesR1rSES7cBQT7EJ-fWv8I-L' },
  { id: 5, subject: 'Computer Networks', type: 'youtube', title: 'CN Complete Course – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvMW674L_5YIuK7f6V7yVf8' },
  { id: 6, subject: 'Computer Networks', type: 'youtube', title: 'Computer Networks – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUag00w_P_AdRUEvKzXf' },
  { id: 7, subject: 'Algorithms', type: 'youtube', title: 'Algorithms – Abdul Bari', url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkfCt686D8fXm7iT68S1S' },
  { id: 8, subject: 'Algorithms', type: 'youtube', title: 'Algorithms – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KiiGZ03_p-N-tH6V6L7G_5A' },
  { id: 9, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRj9l8k4fF0l5C5v9-5v9-5v' },
  { id: 10, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures by MyCodeSchool', url: 'https://www.youtube.com/user/mycodeschool/playlists' },
  { id: 11, subject: 'Digital Logic', type: 'youtube', title: 'Digital Electronics – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm' },
  { id: 12, subject: 'Digital Logic', type: 'youtube', title: 'Digital Electronics – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvGv_Wz7_83vGZ-H0VnFhX_' },
  { id: 13, subject: 'Computer Organization', type: 'youtube', title: 'COA – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Kv-U570Q5688j_S8N60Z8-j' },
  { id: 14, subject: 'Computer Organization', type: 'youtube', title: 'COA – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgLLlzdgiTUKULruKyQH24z' },
  { id: 15, subject: 'TOC', type: 'youtube', title: 'TOC – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KshS9K0vS6O0-fF9H-6q1-O' },
  { id: 16, subject: 'TOC', type: 'youtube', title: 'Theory of Computation – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwMSIev' },
  { id: 17, subject: 'Compiler Design', type: 'youtube', title: 'Compiler Design – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KseYAtvP6YfBOfKstf6SNoJ' },
  { id: 18, subject: 'Compiler Design', type: 'youtube', title: 'Compiler Design – Knowledge Gate', url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesRH6-W37B3-U9M59b2D_8yO' },
  { id: 19, subject: 'Engineering Mathematics', type: 'youtube', title: 'Engineering Maths – Gajendra Purohit', url: 'https://www.youtube.com/c/GajendraPurohit/playlists' },
  { id: 20, subject: 'Aptitude', type: 'youtube', title: 'General Aptitude – Gate Smashers', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvpYx8_vS2H8p8uT5vVf7Yn' },

  // ── Textbooks (with details, not direct Amazon links) ──
  { id: 21, subject: 'Computer Networks', type: 'textbook', title: 'Computer Networking: A Top-Down Approach',
    author: 'Kurose & Ross', edition: '8th Edition', url: 'https://www.amazon.in/Computer-Networking-Top-Down-Approach-Kurose/dp/0133594149',
    publisher: 'Pearson', description: 'The most widely-used networking textbook. Covers TCP/IP stack, application layer to physical layer.' },
  { id: 22, subject: 'TOC', type: 'textbook', title: 'Introduction to Automata Theory, Languages, and Computation',
    author: 'Hopcroft, Ullman & Motwani', edition: '3rd Edition', url: 'https://www.amazon.in/Introduction-Automata-Theory-Languages-Computation/dp/0321455363',
    publisher: 'Pearson', description: 'The classic text on automata theory. Covers finite automata, pushdown automata, Turing machines.' },
  { id: 23, subject: 'Operating Systems', type: 'textbook', title: 'Operating System Concepts',
    author: 'Silberschatz, Galvin & Gagne', edition: '10th Edition', url: 'https://www.amazon.in/Operating-System-Concepts-Abraham-Silberschatz/dp/1119800366',
    publisher: 'Wiley', description: 'The dinosaur book. Comprehensive coverage of OS concepts.' },
  { id: 24, subject: 'DBMS', type: 'textbook', title: 'Database System Concepts',
    author: 'Silberschatz, Korth & Sudarshan', edition: '7th Edition', url: 'https://www.amazon.in/Database-System-Concepts-Abraham-Silberschatz/dp/1260084504',
    publisher: 'McGraw Hill', description: 'The definitive DBMS textbook. Covers relational algebra, SQL, normalization, transactions.' },
  { id: 25, subject: 'Algorithms', type: 'textbook', title: 'Introduction to Algorithms',
    author: 'CLRS', edition: '4th Edition', url: 'https://www.amazon.in/Introduction-Algorithms-Thomas-H-Cormen/dp/026204630X',
    publisher: 'MIT Press', description: 'The gold standard algorithms textbook. Covers sorting, graphs, DP, NP-completeness.' },
  { id: 26, subject: 'Programming & DS', type: 'textbook', title: 'Discrete Mathematics and its Applications',
    author: 'Kenneth Rosen', edition: '8th Edition', url: 'https://www.amazon.in/Discrete-Mathematics-Applications-Kenneth-Rosen/dp/0073383090',
    publisher: 'McGraw Hill', description: 'Covers logic, set theory, combinatorics, graph theory — essential for GATE maths.' },

  // ── GateOverflow ────────────────────────────────────
  { id: 27, subject: 'Engineering Mathematics', type: 'gateoverflow', title: 'Engineering Maths – GateOverflow', url: 'https://gateoverflow.in/tag/engineering-mathematics' },
  { id: 28, subject: 'Computer Networks', type: 'gateoverflow', title: 'CN – GateOverflow', url: 'https://gateoverflow.in/tag/computer-networks' },
  { id: 29, subject: 'DBMS', type: 'gateoverflow', title: 'DBMS – GateOverflow', url: 'https://gateoverflow.in/tag/dbms' },
  { id: 30, subject: 'OS', type: 'gateoverflow', title: 'OS – GateOverflow', url: 'https://gateoverflow.in/tag/operating-systems' },
  { id: 31, subject: 'Algorithms', type: 'gateoverflow', title: 'Algorithms – GateOverflow', url: 'https://gateoverflow.in/tag/algorithms' },
  { id: 32, subject: 'TOC', type: 'gateoverflow', title: 'TOC – GateOverflow', url: 'https://gateoverflow.in/tag/theory-of-computation' },

  // ── Practice Links ──────────────────────────────────
  { id: 33, subject: 'General', type: 'practice', title: 'GeeksforGeeks – Topic-wise Practice', url: 'https://practice.geeksforgeeks.org/explore?page=1&sortBy=submissions' },
  { id: 34, subject: 'General', type: 'practice', title: 'GateOverflow – Previous Year Questions', url: 'https://gateoverflow.in/' },
  { id: 35, subject: 'General', type: 'practice', title: 'PracticePaper – GATE CSE', url: 'https://practicepaper.in/gate-cse' },
  { id: 36, subject: 'General', type: 'practice', title: 'NPTEL – Computer Science Courses', url: 'https://nptel.ac.in/courses/106106127' },
  { id: 37, subject: 'Compiler Design', type: 'practice', title: 'CD Practice – GeeksforGeeks', url: 'https://www.geeksforgeeks.org/compiler-design-gate-questions/' },
  { id: 38, subject: 'Digital Logic', type: 'practice', title: 'DL Practice – GeeksforGeeks', url: 'https://www.geeksforgeeks.org/digital-logic-gate-questions/' },
  { id: 39, subject: 'Operating Systems', type: 'practice', title: 'OS Practice – GeeksforGeeks', url: 'https://www.geeksforgeeks.org/operating-systems-gate-questions/' },
  { id: 40, subject: 'Computer Networks', type: 'practice', title: 'CN Practice – GeeksforGeeks', url: 'https://www.geeksforgeeks.org/computer-network-gate-questions/' },

  // ── NPTEL ───────────────────────────────────────────
  { id: 41, subject: 'Algorithms', type: 'nptel', title: 'NPTEL: Design & Analysis of Algorithms', url: 'https://nptel.ac.in/courses/106106127' },
  { id: 42, subject: 'DBMS', type: 'nptel', title: 'NPTEL: Database Management Systems', url: 'https://nptel.ac.in/courses/106106135' },
  { id: 43, subject: 'Operating Systems', type: 'nptel', title: 'NPTEL: Operating System Fundamentals', url: 'https://nptel.ac.in/courses/106106144' },
  { id: 44, subject: 'Computer Networks', type: 'nptel', title: 'NPTEL: Computer Networks', url: 'https://nptel.ac.in/courses/106105183' },
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
