export const MISTAKE_TYPES = [
  { value: 'concept_mistake', label: 'Concept Mistake', emoji: '\uD83D\uDD34', color: '#FF6B6B' },
  { value: 'silly_mistake', label: 'Silly Mistake', emoji: '\uD83D\uDFE0', color: '#FF9F43' },
  { value: 'calculation_mistake', label: 'Calculation Mistake', emoji: '\uD83D\uDFE1', color: '#FECA57' },
  { value: 'guess_mistake', label: 'Guess Mistake', emoji: '\uD83D\uDD35', color: '#54A0FF' },
  { value: 'time_management', label: 'Time Management', emoji: '\uD83D\uDFE3', color: '#A29BFE' },
  { value: 'revision_mistake', label: 'Revision Mistake', emoji: '\uD83D\uDFE2', color: '#00B894' },
  { value: 'careless_mistake', label: 'Careless Mistake', emoji: '\u26AA', color: '#B2BEC3' },
];

export const MISTAKE_TYPE_MAP = Object.fromEntries(MISTAKE_TYPES.map(t => [t.value, t]));

export const SUBJECT_TOPICS = {
  'Operating Systems': ['CPU Scheduling', 'Deadlock', 'Memory Management', 'Paging', 'Synchronization', 'File Systems'],
  'DBMS': ['Normalization', 'SQL', 'Transactions', 'Indexing', 'B+ Tree', 'Concurrency Control'],
  'Computer Networks': ['OSI Model', 'TCP/IP', 'Routing', 'DNS', 'HTTP', 'Congestion Control'],
  'Algorithms': ['Sorting', 'Searching', 'Graph', 'DP', 'Greedy', 'Complexity'],
  'Data Structures': ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Hash Tables', 'Stacks'],
  'Theory of Computation': ['DFA/NFA', 'CFG', 'PDA', 'Turing Machine', 'Regular Expressions', 'Undecidability'],
  'Compiler Design': ['Lexical Analysis', 'Parsing', 'Code Optimization', 'Symbol Table', 'Syntax Tree'],
  'Digital Logic': ['Boolean Algebra', 'K-Map', 'Combinational Circuits', 'Sequential Circuits', 'Counters'],
  'Computer Organization': ['Pipeline', 'Cache Memory', 'ALU', 'Memory Hierarchy', 'I/O'],
  'Engineering Mathematics': ['Linear Algebra', 'Probability', 'Calculus', 'Discrete Math', 'Graph Theory'],
  'General Aptitude': ['Probability', 'Time & Work', 'Data Interpretation', 'Logical Reasoning', 'Percentages'],
};

export const SUBJECTS = Object.keys(SUBJECT_TOPICS);

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'subject', label: 'By Subject' },
  { value: 'type', label: 'By Mistake Type' },
];