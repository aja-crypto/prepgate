export const MISTAKE_CATEGORIES = [
  {
    id: 'silly-mistakes',
    title: 'Silly Mistakes',
    icon: '😤',
    color: '#EF4444',
    description: 'Questions you knew the concept for but answered incorrectly due to carelessness.',
    impact: 'Rank killer — 10-15 marks lost to silly mistakes can drop rank from AIR 100 to AIR 1000+.',
    symptoms: ['Answering too fast without reading completely', 'Misreading numerical values', 'Forgetting to convert units', 'Marking the wrong option despite solving correctly', 'Rushing through easy questions'],
    prevention: ['Read each question twice before answering', 'Track silly mistakes separately in error log', 'Practice mock tests with focus on accuracy over speed', 'Develop a mental checklist before every answer', 'Leave 10 minutes for final review'],
    recoveryStrategy: 'After identifying a silly mistake pattern, isolate it. Practice 10 similar questions slowly, then gradually increase speed while maintaining 100% accuracy.',
    commonPatterns: [
      { pattern: 'Subnet mask calculation off by 1', subject: 'Computer Networks' },
      { pattern: 'Tree traversal order confusion', subject: 'Data Structures' },
      { pattern: 'Sorting stability wrong', subject: 'Algorithms' },
      { pattern: 'Cache hit ratio formula error', subject: 'COA' },
      { pattern: 'GROUP BY vs ORDER BY in SQL', subject: 'DBMS' }
    ]
  },
  {
    id: 'concept-mistakes',
    title: 'Concept Mistakes',
    icon: '📚',
    color: '#F59E0B',
    description: 'Questions you genuinely did not know or had incomplete understanding of.',
    impact: 'Knowledge gaps compound across subjects. A weak concept in one area affects multiple related topics.',
    symptoms: ['Cannot solve despite spending time', 'Answer feels like a guess', 'Keep getting similar questions wrong', 'Understand the solution but cannot reproduce independently', 'Confusing similar concepts across subjects'],
    prevention: ['Maintain subject-wise concept checklist', 'After every mock, add concept gaps to weekly study plan', 'Use RNP method: Revise before New learning', 'Solve PYQs topic-wise immediately after learning', 'Create comparison tables for similar concepts'],
    recoveryStrategy: 'For each concept mistake: (1) Re-learn from a different resource, (2) Solve 15+ PYQs on that topic, (3) Re-test with a subject test. Never skip re-testing.',
    commonPatterns: [
      { pattern: 'Deadlock detection vs prevention vs avoidance', subject: 'OS' },
      { pattern: 'DFA minimization algorithm steps', subject: 'TOC' },
      { pattern: 'IEEE 754 floating point representation', subject: 'COA' },
      { pattern: 'Cache memory mapping techniques', subject: 'COA' },
      { pattern: 'Normalization decomposition algorithms', subject: 'DBMS' }
    ]
  },
  {
    id: 'calculation-mistakes',
    title: 'Calculation Mistakes',
    icon: '🔢',
    color: '#8B5CF6',
    description: 'Arithmetic, algebraic, or logical errors in numerical problem-solving.',
    impact: 'Every calculation error costs 1-2 marks. In GATE, 2-3 such errors can change your rank tier.',
    symptoms: ['Getting the method right but answer wrong', 'Taking too long on numerical problems', 'Skipping steps and making arithmetic errors', 'Sign/conversion mistakes', 'Formula misapplication under time pressure'],
    prevention: ['Write each step clearly — never skip steps in practice', 'Practice numerical speed drills daily', 'Use approximation techniques to verify answers', 'Create formula sheets with clear variable definitions', 'Double-check calculations during the 10-minute review'],
    recoveryStrategy: 'Maintain a separate calculation error log. For each error, solve 5 similar problems with full step-by-step writing. Gradually reduce written steps as accuracy improves.',
    commonPatterns: [
      { pattern: 'Complement arithmetic sign errors', subject: 'Digital Logic' },
      { pattern: 'Pipeline speedup formula calculation', subject: 'COA' },
      { pattern: 'Sliding window efficiency/utilization', subject: 'Computer Networks' },
      { pattern: 'Cache miss penalty calculation', subject: 'COA' },
      { pattern: 'Probability distribution parameter errors', subject: 'Engineering Mathematics' }
    ]
  },
  {
    id: 'revision-mistakes',
    title: 'Revision Mistakes',
    icon: '🔄',
    color: '#06B6D4',
    description: 'Forgetting previously learned concepts, formulas, or solution approaches.',
    impact: 'Loss of easy marks on topics you once knew well. Compounds over time as syllabus grows.',
    symptoms: ['Could solve 2 weeks ago but cannot now', 'Familiar question feels foreign', 'Formula on tip of tongue but cannot recall', 'Mixing up recently learned topics', 'Scoring lower on revision tests than initial tests'],
    prevention: ['Follow RNP method: 15 min revision daily before new learning', 'Start weekly revision from June 2026', 'Create short notes (20-30 pages per subject)', 'Review error log every weekend', 'Use spaced repetition: revise after 1 day, 1 week, 1 month'],
    recoveryStrategy: 'If a topic feels unfamiliar: immediately revise it, solve 5 PYQs, and add it to next week\'s revision list. Do not postpone.',
    commonPatterns: [
      { pattern: 'Forgetting complement arithmetic rules', subject: 'Digital Logic' },
      { pattern: 'Mixing up scheduling algorithm formulas', subject: 'OS' },
      { pattern: 'Forgetting SQL syntax variations', subject: 'DBMS' },
      { pattern: 'Losing grasp of graph algorithm implementations', subject: 'Algorithms' },
      { pattern: 'Mixing TOC language classifications', subject: 'TOC' }
    ]
  },
  {
    id: 'mock-test-mistakes',
    title: 'Mock Test Mistakes',
    icon: '📝',
    color: '#EC4899',
    description: 'Pattern errors that only manifest under timed test conditions.',
    impact: 'These are the most dangerous because they only appear on exam day. Mock test mistakes reveal true weaknesses.',
    symptoms: ['Scoring lower in mocks than in practice', 'Running out of time despite knowing concepts', 'Making different mistakes in every mock', 'Panicking when stuck on a question', 'Attempting too many uncertain questions'],
    prevention: ['Take at least 20-25 full-length mocks', 'Analyze every mock within 24 hours', 'Follow strict attempt order: NAT first, MSQ second, confident MCQs third', 'Track accuracy trend across mocks (target: 95%+)', 'Simulate exact exam conditions for every mock'],
    recoveryStrategy: 'Mock analysis protocol: categorize every wrong answer as concept/silly/calculation/time. Address the largest category first in the next study week.',
    commonPatterns: [
      { pattern: 'Attempting too many MCQs without confidence', subject: 'All' },
      { pattern: 'Poor time allocation across sections', subject: 'All' },
      { pattern: 'Starting with hardest questions', subject: 'All' },
      { pattern: 'Not reviewing answers before submitting', subject: 'All' },
      { pattern: 'Panicking and abandoning strategy mid-test', subject: 'All' }
    ]
  },
  {
    id: 'time-management-mistakes',
    title: 'Time Management Mistakes',
    icon: '⏰',
    color: '#14B8A6',
    description: 'Poor question selection and pacing that leaves marks on the table.',
    impact: 'Even with full knowledge, poor time management can cost 10-15 marks — the same margin between AIR 100 and AIR 1000.',
    symptoms: ['Running out of time in last 30 minutes', 'Spending too long on one question', 'Rushing through easy questions at the end', 'Leaving known questions unanswered', 'Not attempting enough questions overall'],
    prevention: ['Practice mocks with strict 3-hour timer', 'Develop skip criteria: if stuck >2 minutes, skip and revisit', 'Attempt NAT questions first (no negative marking)', 'Use the 10-minute review rule', 'Track time per section in every mock'],
    recoveryStrategy: 'After each mock, calculate time spent per question group. Identify where you spent disproportionate time. Practice targeted speed drills for those question types.',
    commonPatterns: [
      { pattern: 'Spending >5 minutes on a single numerical', subject: 'All' },
      { pattern: 'Not attempting NAT questions first', subject: 'All' },
      { pattern: 'Getting stuck on one subject section', subject: 'All' },
      { pattern: 'No review time at the end', subject: 'All' },
      { pattern: 'Rushing last 10 questions in 5 minutes', subject: 'All' }
    ]
  }
];
