export const HIGH_ROI_TOPICS = [
  { rank: 1, topic: 'Number Systems', subject: 'Digital Logic', weightage: '~57 Qs', roiScore: 'Maximum', difficulty: 'Easy', priority: 'Critical' },
  { rank: 2, topic: 'Boolean Algebra', subject: 'Digital Logic', weightage: 'High', roiScore: 'Maximum', difficulty: 'Easy', priority: 'Critical' },
  { rank: 3, topic: 'SQL Queries', subject: 'DBMS', weightage: '~55 Qs', roiScore: 'Maximum', difficulty: 'Easy', priority: 'Critical' },
  { rank: 4, topic: 'Process Scheduling', subject: 'OS', weightage: 'High', roiScore: 'Very High', difficulty: 'Easy', priority: 'Critical' },
  { rank: 5, topic: 'Finite Automata', subject: 'TOC', weightage: '~62 Qs', roiScore: 'Maximum', difficulty: 'Medium', priority: 'Critical' },
  { rank: 6, topic: 'Cache Memory', subject: 'COA', weightage: '~71 Qs', roiScore: 'Maximum', difficulty: 'Medium', priority: 'Critical' },
  { rank: 7, topic: 'IP Addressing / Subnetting', subject: 'CN', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'Critical' },
  { rank: 8, topic: 'Binary Trees / BST', subject: 'Data Structures', weightage: '~87 Qs (highest)', roiScore: 'Maximum', difficulty: 'Medium', priority: 'Critical' },
  { rank: 9, topic: 'Graph Theory', subject: 'Discrete Math', weightage: 'Very High', roiScore: 'Very High', difficulty: 'Medium', priority: 'Critical' },
  { rank: 10, topic: 'Aptitude (All)', subject: 'General Aptitude', weightage: '15 marks fixed', roiScore: 'Very High', difficulty: 'Easy', priority: 'Critical' },
  { rank: 11, topic: 'Engineering Mathematics', subject: 'Maths', weightage: '13 marks fixed', roiScore: 'Very High', difficulty: 'Medium', priority: 'Critical' },
  { rank: 12, topic: 'Stacks & Queues', subject: 'Data Structures', weightage: 'High', roiScore: 'Very High', difficulty: 'Easy', priority: 'High' },
  { rank: 13, topic: 'Page Replacement', subject: 'OS', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 14, topic: 'MST (Prim\'s/Kruskal\'s)', subject: 'Algorithms', weightage: '~33 Qs', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 15, topic: 'DFS / BFS', subject: 'Algorithms', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 16, topic: 'Regular Expressions', subject: 'TOC', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 17, topic: 'Normalization', subject: 'DBMS', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 18, topic: 'Pipelining', subject: 'COA', weightage: 'High', roiScore: 'Very High', difficulty: 'Medium', priority: 'High' },
  { rank: 19, topic: 'Deadlocks / Banker\'s Algorithm', subject: 'OS', weightage: 'Medium-High', roiScore: 'High', difficulty: 'Medium', priority: 'High' },
  { rank: 20, topic: 'Syntax Directed Translation', subject: 'Compiler Design', weightage: 'High', roiScore: 'High', difficulty: 'Medium', priority: 'High' },
  { rank: 21, topic: 'Sorting Algorithms', subject: 'Algorithms', weightage: 'High', roiScore: 'High', difficulty: 'Medium', priority: 'High' },
  { rank: 22, topic: 'Hashing', subject: 'Data Structures', weightage: 'High', roiScore: 'High', difficulty: 'Medium', priority: 'High' },
  { rank: 23, topic: 'CFG / Grammar', subject: 'Compiler Design', weightage: 'Medium-High', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 24, topic: 'Combinational Circuits', subject: 'Digital Logic', weightage: 'Medium-High', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 25, topic: 'Relational Algebra', subject: 'DBMS', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 26, topic: 'Process Synchronization', subject: 'OS', weightage: 'Medium', roiScore: 'Medium', difficulty: 'High', priority: 'Medium' },
  { rank: 27, topic: 'Sliding Window Protocols', subject: 'CN', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 28, topic: 'Complexity Analysis', subject: 'Algorithms', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 29, topic: 'Heaps', subject: 'Data Structures', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 30, topic: 'Linked Lists', subject: 'Data Structures', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 31, topic: 'Routing Algorithms', subject: 'CN', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' },
  { rank: 32, topic: 'TCP / UDP', subject: 'CN', weightage: 'Medium', roiScore: 'Medium', difficulty: 'Medium', priority: 'Medium' }
];

export const SUBJECT_FILTERS = [...new Set(HIGH_ROI_TOPICS.map(t => t.subject))];
export const PRIORITY_FILTERS = [...new Set(HIGH_ROI_TOPICS.map(t => t.priority))];
export const DIFFICULTY_FILTERS = [...new Set(HIGH_ROI_TOPICS.map(t => t.difficulty))];
