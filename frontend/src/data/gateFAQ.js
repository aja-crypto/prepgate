export const GATE_FAQ = [
  {
    id: 1,
    q: 'Why should I start GATE preparation with Mathematics?',
    a: 'Engineering Mathematics forms the foundation for most technical subjects. It contributes around 13 marks directly and improves understanding of Algorithms, COA, OS, ML, and other core subjects.',
    tags: ['Mathematics', 'Foundation', 'Strategy'],
  },
  {
    id: 2,
    q: 'Why is Aptitude important?',
    a: 'General Aptitude contributes approximately 15 marks. Combined with Mathematics, these sections account for around 28 marks, making them one of the highest scoring areas in GATE.',
    tags: ['Aptitude', 'Scoring', 'Strategy'],
  },
  {
    id: 3,
    q: 'Why do many GATE aspirants fail?',
    a: 'Lack of proper subject sequencing, poor resource management, ignoring high-weightage topics, insufficient mock tests, and lack of consistency and discipline.',
    tags: ['Mistakes', 'Strategy', 'Discipline'],
  },
  {
    id: 4,
    q: 'What is the Pareto Principle in GATE preparation?',
    a: 'The Pareto Principle (80/20 Rule) suggests that a small number of high-impact topics contribute to a large percentage of marks. Focusing on these topics improves preparation efficiency.',
    tags: ['80/20', 'Efficiency', 'Strategy'],
  },
  {
    id: 5,
    q: 'What is the ideal daily study routine?',
    a: '3 Hours Concept Learning, 2 Hours Problem Solving, 1 Hour PYQ Practice, 1 Hour Revision — totaling 7 focused hours daily.',
    tags: ['Daily Routine', 'Time Management'],
  },
  {
    id: 6,
    q: 'How many hours should I study daily?',
    a: 'Most successful aspirants maintain a consistent study schedule of 5\u20136 focused hours daily. Consistency matters more than occasional marathon sessions.',
    tags: ['Daily Routine', 'Consistency'],
  },
  {
    id: 7,
    q: 'Why are PYQs important?',
    a: 'PYQs help understand question patterns, identify important concepts, improve accuracy, and build exam confidence. They are the single most important practice material.',
    tags: ['PYQs', 'Practice', 'Strategy'],
  },
  {
    id: 8,
    q: 'How often should I revise?',
    a: 'Follow a revision cycle: 1-Day Revision, 3-Day Revision, 7-Day Revision. This spaced repetition reduces forgetting and strengthens long-term memory retention.',
    tags: ['Revision', 'Spaced Repetition'],
  },
  {
    id: 9,
    q: 'Why should I create short notes?',
    a: 'Short notes are essential for last-minute revision. They should include formulas, common mistakes, shortcuts, and important concepts. Aim for 10\u201315 pages per subject.',
    tags: ['Notes', 'Revision', 'Organization'],
  },
  {
    id: 10,
    q: 'Why are mock tests necessary?',
    a: 'Mock tests improve time management, accuracy, problem-solving speed, and exam temperament. They simulate real exam conditions and reveal weak areas.',
    tags: ['Mock Tests', 'Practice', 'Exam Strategy'],
  },
  {
    id: 11,
    q: 'What should I analyze after a mock test?',
    a: 'Weak topics, silly mistakes, time spent per question, accuracy percentage, and strength areas. Every mock is a learning opportunity, not just a score.',
    tags: ['Mock Tests', 'Analysis', 'Improvement'],
  },
  {
    id: 12,
    q: 'Should I use multiple resources?',
    a: 'No. Most experts recommend: one primary course, one reference book, and one revision source. Too many resources cause confusion and waste time.',
    tags: ['Resources', 'Focus', 'Efficiency'],
  },
  {
    id: 13,
    q: 'What are the most important COA topics?',
    a: 'Instruction Pipelining, Cache Memory, and IEEE 754 Floating Point Representation are the highest-yield COA topics.',
    tags: ['COA', 'Important Topics', 'Pipelining', 'Cache'],
  },
  {
    id: 14,
    q: 'What are the most important OS topics?',
    a: 'Memory Management (Paging, Segmentation, Virtual Memory) and Process Synchronization (Semaphores, Deadlocks) dominate OS questions.',
    tags: ['OS', 'Important Topics', 'Memory', 'Synchronization'],
  },
  {
    id: 15,
    q: 'What are the most important DBMS topics?',
    a: 'Indexing (B+ Trees, Hashing) and Normalization (Normal Forms, Decomposition) are the most frequently tested DBMS topics.',
    tags: ['DBMS', 'Important Topics', 'Indexing', 'Normalization'],
  },
  {
    id: 16,
    q: 'What are the most important Computer Network topics?',
    a: 'IP Addressing (Subnetting, CIDR), TCP (Congestion Control), and Flow Control (Sliding Window) are the core CN topics.',
    tags: ['CN', 'Important Topics', 'IP', 'TCP'],
  },
  {
    id: 17,
    q: 'What are the most important Algorithms topics?',
    a: 'Sorting (Comparison-based, Linear-time), Time Complexity (Master Theorem), and Graph Algorithms (BFS, DFS, Shortest Path) are essential.',
    tags: ['Algorithms', 'Important Topics', 'Sorting', 'Graph'],
  },
  {
    id: 18,
    q: 'What are the most important TOC topics?',
    a: 'Finite Automata (DFA, NFA), Pushdown Automata, and Decidability (Turing Machines) are the highest-weightage TOC topics.',
    tags: ['TOC', 'Important Topics', 'Automata', 'Decidability'],
  },
  {
    id: 19,
    q: 'What should I focus on first: Accuracy or Speed?',
    a: 'Accuracy. Speed improves naturally with practice. Focus on solving problems correctly before trying to solve them quickly.',
    tags: ['Mindset', 'Accuracy', 'Speed'],
  },
  {
    id: 20,
    q: 'What is the biggest mistake students make?',
    a: 'Resource hopping. Continuously changing teachers, books, or courses prevents deep learning and slows progress. Stick with one source.',
    tags: ['Mistakes', 'Resources', 'Focus'],
  },
  {
    id: 21,
    q: 'What is the key to securing a top rank?',
    a: 'Consistency, Revision, PYQ Practice, Mock Test Analysis, High-weightage Topic Focus, and strong Mathematics & Aptitude fundamentals.',
    tags: ['AIR', 'Success', 'Strategy', 'Consistency'],
  },
];

export function getDailyQuestion() {
  const today = new Date().toISOString().slice(0, 10);
  const dayNum = today.split('-').reduce((acc, s) => acc + parseInt(s), 0);
  return GATE_FAQ[dayNum % GATE_FAQ.length];
}
