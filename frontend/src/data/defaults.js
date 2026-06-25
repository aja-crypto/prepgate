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
  { name: 'Computer Organization & Architecture', icon: '🖥', progress: 55, color: '#06d6a0' },
  { name: 'Programming & Data Structures', icon: '🐍', progress: 70, color: '#ff9f43' },
  { name: 'Algorithms', icon: '⚡', progress: 60, color: '#ff6b6b' },
  { name: 'Operating Systems', icon: '⚙️', progress: 65, color: '#a855f7' },
  { name: 'DBMS', icon: '🗄', progress: 72, color: '#06b6d4' },
  { name: 'Computer Networks', icon: '🌐', progress: 50, color: '#ffd166' },
  { name: 'Theory of Computation', icon: '🤖', progress: 45, color: '#f72585' },
  { name: 'Compiler Design', icon: '🔧', progress: 40, color: '#4cc9f0' },
  { name: 'General Aptitude', icon: '🧮', progress: 82, color: '#43aa8b' },
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

const yt = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const DEFAULT_RESOURCES = [
  // ── YouTube Playlists ──────────────────────────────
  { id: 1, subject: 'Operating Systems', type: 'youtube', title: 'OS Complete Course – Gate Smashers', url: yt('OS Complete Course Gate Smashers') },
  { id: 2, subject: 'OS', type: 'youtube', title: 'Operating Systems – Neso Academy', url: yt('Operating Systems Neso Academy') },
  { id: 3, subject: 'DBMS', type: 'youtube', title: 'DBMS Complete Course – Gate Smashers', url: yt('DBMS Complete Course Gate Smashers') },
  { id: 4, subject: 'DBMS', type: 'youtube', title: 'DBMS – Knowledge Gate', url: yt('DBMS Knowledge Gate') },
  { id: 5, subject: 'Computer Networks', type: 'youtube', title: 'CN Complete Course – Gate Smashers', url: yt('Computer Networks Gate Smashers') },
  { id: 6, subject: 'Computer Networks', type: 'youtube', title: 'Computer Networks – Neso Academy', url: yt('Computer Networks Neso Academy') },
  { id: 7, subject: 'Algorithms', type: 'youtube', title: 'Algorithms – Abdul Bari', url: yt('Algorithms Abdul Bari') },
  { id: 8, subject: 'Algorithms', type: 'youtube', title: 'Algorithms – Gate Smashers', url: yt('Algorithms Gate Smashers') },
  { id: 9, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures – Neso Academy', url: yt('Data Structures Neso Academy') },
  { id: 10, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures by MyCodeSchool', url: yt('Data Structures MyCodeSchool') },
  { id: 11, subject: 'Digital Logic', type: 'youtube', title: 'Digital Electronics – Neso Academy', url: yt('Digital Electronics Neso Academy') },
  { id: 12, subject: 'Digital Logic', type: 'youtube', title: 'Digital Electronics – Gate Smashers', url: yt('Digital Electronics Gate Smashers') },
  { id: 13, subject: 'Computer Organization', type: 'youtube', title: 'COA – Gate Smashers', url: yt('Computer Organization and Architecture Gate Smashers') },
  { id: 14, subject: 'Computer Organization', type: 'youtube', title: 'COA – Neso Academy', url: yt('Computer Organization and Architecture Neso Academy') },
  { id: 15, subject: 'TOC', type: 'youtube', title: 'TOC – Gate Smashers', url: yt('Theory of Computation Gate Smashers') },
  { id: 16, subject: 'TOC', type: 'youtube', title: 'Theory of Computation – Neso Academy', url: yt('Theory of Computation Neso Academy') },
  { id: 17, subject: 'Compiler Design', type: 'youtube', title: 'Compiler Design – Gate Smashers', url: yt('Compiler Design Gate Smashers') },
  { id: 18, subject: 'Compiler Design', type: 'youtube', title: 'Compiler Design – Knowledge Gate', url: yt('Compiler Design Knowledge Gate') },
  { id: 19, subject: 'Engineering Mathematics', type: 'youtube', title: 'Engineering Maths – Gajendra Purohit', url: yt('Engineering Mathematics Gajendra Purohit') },
  { id: 20, subject: 'Aptitude', type: 'youtube', title: 'General Aptitude – Gate Smashers', url: yt('General Aptitude Gate Smashers') },

  // ── Textbooks (with details, not direct Amazon links) ──
  { id: 21, subject: 'Computer Networks', type: 'textbook', title: 'Computer Networking: A Top-Down Approach',
    author: 'Kurose & Ross', edition: '8th Edition', url: 'https://books.google.com/books?q=Computer+Networking%3A+A+Top-Down+Approach+Kurose+Ross',
    publisher: 'Pearson', description: 'The most widely-used networking textbook. Covers TCP/IP stack, application layer to physical layer.' },
  { id: 22, subject: 'TOC', type: 'textbook', title: 'Introduction to Automata Theory, Languages, and Computation',
    author: 'Hopcroft, Ullman & Motwani', edition: '3rd Edition', url: 'https://books.google.com/books?q=Introduction+to+Automata+Theory%2C+Languages%2C+and+Computation',
    publisher: 'Pearson', description: 'The classic text on automata theory. Covers finite automata, pushdown automata, Turing machines.' },
  { id: 23, subject: 'Operating Systems', type: 'textbook', title: 'Operating System Concepts',
    author: 'Silberschatz, Galvin & Gagne', edition: '10th Edition', url: 'https://books.google.com/books?q=Operating+System+Concepts+Silberschatz+Galvin+Gagne',
    publisher: 'Wiley', description: 'The dinosaur book. Comprehensive coverage of OS concepts.' },
  { id: 24, subject: 'DBMS', type: 'textbook', title: 'Database System Concepts',
    author: 'Silberschatz, Korth & Sudarshan', edition: '7th Edition', url: 'https://books.google.com/books?q=Database+System+Concepts+Silberschatz+Korth+Sudarshan',
    publisher: 'McGraw Hill', description: 'The definitive DBMS textbook. Covers relational algebra, SQL, normalization, transactions.' },
  { id: 25, subject: 'Algorithms', type: 'textbook', title: 'Introduction to Algorithms',
    author: 'CLRS', edition: '4th Edition', url: 'https://books.google.com/books?q=Introduction+to+Algorithms+CLRS',
    publisher: 'MIT Press', description: 'The gold standard algorithms textbook. Covers sorting, graphs, DP, NP-completeness.' },
  { id: 26, subject: 'Programming & DS', type: 'textbook', title: 'Discrete Mathematics and its Applications',
    author: 'Kenneth Rosen', edition: '8th Edition', url: 'https://books.google.com/books?q=Discrete+Mathematics+and+its+Applications+Kenneth+Rosen',
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

  // ── Additional YouTube Playlists (User-contributed) ──────
  { id: 45, subject: 'Aptitude', type: 'youtube', title: 'Aptitude – GATE Academy', url: 'https://www.youtube.com/playlist?list=PLvTTv60o7qj-PgF3DhvvTK6_-g_FU8wCT' },
  { id: 46, subject: 'Aptitude', type: 'youtube', title: 'Aptitude – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxE43Au1FGRQvwHTr7NbgDCS' },
  { id: 47, subject: 'Engineering Mathematics', type: 'youtube', title: 'Engineering Maths – Gajendra Purohit (All Branches)', url: 'https://www.youtube.com/playlist?list=PLvTTv60o7qj_tdY9zH7YceES7jfXiZkAz' },
  { id: 48, subject: 'Discrete Mathematics', type: 'youtube', title: 'Discrete Maths – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxEYmhzVBW7nBdftFZ4xmiF1' },
  { id: 49, subject: 'Programming & DS', type: 'youtube', title: 'C Programming – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxG-IqARhc23jYTDMYt7yvZP' },
  { id: 50, subject: 'Programming & DS', type: 'youtube', title: 'Data Structures – Neso Academy (Extended)', url: 'https://www.youtube.com/playlist?list=PLx9tWsBMrsTho2pUdEgnkLVp-gT9jLWuP' },
  { id: 51, subject: 'Digital Logic', type: 'youtube', title: 'Digital Logic – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxEErKQZ7xFxat8oh4OepU34' },
  { id: 52, subject: 'TOC', type: 'youtube', title: 'Theory of Computation – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxGvebewU4z2CZYo-8nB93E7' },
  { id: 53, subject: 'Computer Organization', type: 'youtube', title: 'COA – Applied Roots', url: 'https://www.youtube.com/playlist?list=PLG9aCp4uE-s0xddCBjwMDnEVyc523WbA2' },
  { id: 54, subject: 'DBMS', type: 'youtube', title: 'DBMS – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxGcz7nZaxGxxmbJrcgDXhFk' },
  { id: 55, subject: 'Computer Networks', type: 'youtube', title: 'Computer Networks – Neso Academy', url: 'https://www.youtube.com/playlist?list=PLC36xJgs4dxHT-TxTy3U1slr5RaBJGaLd' },

  // ── Complete Syllabus Bundles ─────────────────────────
  { id: 56, subject: 'General', type: 'mega', title: 'RBR Sir / Applied Roots – Full GATE CSE Syllabus (Mega.nz)', url: 'https://mega.nz/folder/zNhmlA6b#MbVMmeVupgTQwOq4IMXGtg', description: 'Complete syllabus with problem-solving lectures' },
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
    { id: 1, topicName: 'Linear Algebra', subject: 'Engineering Mathematics', dueDate: addDays(-2), status: 'missed', stage: 2, interval: 7, lastReviewed: '2026-05-28' },
    { id: 2, topicName: 'Process Scheduling', subject: 'Operating Systems', dueDate: addDays(1), status: 'upcoming', stage: 1, interval: 3, lastReviewed: '2026-05-24' },
    { id: 3, topicName: 'B+ Tree Operations', subject: 'DBMS', dueDate: addDays(3), status: 'upcoming', stage: 2, interval: 7, lastReviewed: '2026-05-30' },
    { id: 4, topicName: 'Dynamic Programming', subject: 'Algorithms', dueDate: addDays(5), status: 'upcoming', stage: 3, interval: 15, lastReviewed: '2026-05-15' },
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
