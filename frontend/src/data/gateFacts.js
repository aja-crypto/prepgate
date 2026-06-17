export const GATE_FACTS = [
  {
    id: 1,
    fact: 'Engineering Mathematics + Aptitude contribute approximately 28 marks in GATE CSE.',
    category: 'Exam Strategy',
    icon: '📊',
  },
  {
    id: 2,
    fact: 'Many toppers solve PYQs 3–5 times before the exam.',
    category: 'PYQs',
    icon: '📝',
  },
  {
    id: 3,
    fact: 'Completing the syllabus before November gives more time for revision and mock tests.',
    category: 'Exam Strategy',
    icon: '📅',
  },
  {
    id: 4,
    fact: 'Most rankers spend more time revising than learning new topics in the final months.',
    category: 'Revision',
    icon: '🔄',
  },
  {
    id: 5,
    fact: 'Google Maps uses Graph algorithms such as shortest-path algorithms to find routes.',
    category: 'DSA',
    icon: '🌐',
  },
  {
    id: 6,
    fact: 'Browser Back and Forward buttons are real-life applications of Linked Lists.',
    category: 'DSA',
    icon: '⛓️',
  },
  {
    id: 7,
    fact: 'Undo and Redo operations in editors use the Stack data structure.',
    category: 'DSA',
    icon: '📚',
  },
  {
    id: 8,
    fact: 'File Explorer folder structures are represented using Tree data structures.',
    category: 'DSA',
    icon: '🌳',
  },
  {
    id: 9,
    fact: 'CPU scheduling in operating systems uses Queue-based algorithms.',
    category: 'DSA',
    icon: '🚶',
  },
  {
    id: 10,
    fact: 'Many students lose marks not because they don\'t know concepts, but because they don\'t revise enough.',
    category: 'Revision',
    icon: '⚠️',
  },
  {
    id: 11,
    fact: 'Mock tests are not for scoring high; they are for identifying mistakes before the real exam.',
    category: 'Mock Tests',
    icon: '🎯',
  },
  {
    id: 12,
    fact: 'The 80/20 Rule applies to GATE: a small set of high-weightage topics contribute a large portion of marks.',
    category: 'Exam Strategy',
    icon: '🔥',
  },
  {
    id: 13,
    fact: 'Consistency for 6 months usually beats studying intensely for 1 month.',
    category: 'Mindset',
    icon: '💪',
  },
  {
    id: 14,
    fact: 'Most successful aspirants avoid changing resources frequently.',
    category: 'Mindset',
    icon: '📌',
  },
  {
    id: 15,
    fact: 'A daily 1-hour revision habit can significantly improve long-term retention.',
    category: 'Revision',
    icon: '⏰',
  },
  {
    id: 16,
    fact: "Dijkstra's Algorithm is used in GPS and navigation systems to find the shortest path.",
    category: 'DSA',
    icon: '📍',
  },
  {
    id: 17,
    fact: 'Trie data structures power many search auto-suggestion systems.',
    category: 'DSA',
    icon: '🔤',
  },
  {
    id: 18,
    fact: 'The React Virtual DOM can be represented conceptually as a tree structure.',
    category: 'DSA',
    icon: '🌳',
  },
  {
    id: 19,
    fact: 'Previous Year Questions often reveal recurring patterns and important concepts.',
    category: 'PYQs',
    icon: '📖',
  },
  {
    id: 20,
    fact: 'One well-analyzed mock test is often more valuable than multiple unreviewed tests.',
    category: 'Mock Tests',
    icon: '🧪',
  },
  {
    id: 21,
    fact: 'Aptitude questions are often the easiest to score — don\'t leave them for the last week.',
    category: 'Exam Strategy',
    icon: '💡',
  },
  {
    id: 22,
    fact: 'Priority Queue is used in CPU scheduling for priority-based process execution.',
    category: 'DSA',
    icon: '⭐',
  },
  {
    id: 23,
    fact: "Prim's Algorithm helps design minimum-cost networks like roads and cable connections.",
    category: 'DSA',
    icon: '🔗',
  },
  {
    id: 24,
    fact: 'Students who maintain short revision notes tend to score higher than those who don\'t.',
    category: 'Revision',
    icon: '📝',
  },
  {
    id: 25,
    fact: 'The Graph data structure powers social networks like Facebook and LinkedIn.',
    category: 'DSA',
    icon: '🌐',
  },
];

export const FACT_CATEGORIES = [
  'All', 'DSA', 'Exam Strategy', 'Revision', 'PYQs', 'Mock Tests', 'Mindset',
];

export function getDailyFact() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return GATE_FACTS[dayOfYear % GATE_FACTS.length];
}
