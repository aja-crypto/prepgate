export const TOPPER_ADVICE = [
  {
    id: 'consistency',
    title: 'Consistency Beats Motivation',
    icon: '💪',
    content: 'Study daily. Not occasionally. 5 hours every day beats 10 hours on alternate days.',
    color: '#6366F1',
  },
  {
    id: 'pyqs-gold',
    title: 'PYQs Are Gold',
    icon: '📝',
    content: 'Solve PYQs once, twice, three times — until patterns become obvious. Many toppers solve them 3–5 times.',
    color: '#F59E0B',
  },
  {
    id: 'no-hop',
    title: "Don't Resource Hop",
    icon: '📌',
    content: 'Wrong: 10 courses, 20 teachers, 50 PDFs. Correct: One teacher, one course, one revision source. Stick with it.',
    color: '#EC4899',
  },
  {
    id: 'revision-mandatory',
    title: 'Revision Is Mandatory',
    icon: '🔄',
    content: 'Suggested cycle: Day 1 → Day 3 → Day 7 → Day 30. Spaced repetition prevents forgetting.',
    color: '#10B981',
  },
  {
    id: 'accuracy-first',
    title: 'Accuracy Before Speed',
    icon: '🎯',
    content: 'Speed comes naturally. Accuracy creates rank. Focus on getting answers right first.',
    color: '#22D3EE',
  },
  {
    id: 'mock-purpose',
    title: 'Mocks Expose Gaps',
    icon: '🧪',
    content: 'Mock tests are not for scoring high. They are for identifying mistakes before the real exam.',
    color: '#F472B6',
  },
];

export const HIGH_SCORING_AREAS = [
  {
    subject: 'Aptitude',
    marks: 15,
    icon: '🧮',
    recommendation: '15 marks — don\'t leave for last week. Practice daily puzzles.',
    color: '#6366F1',
  },
  {
    subject: 'Engineering Mathematics',
    marks: 13,
    icon: '📐',
    recommendation: '13 marks — focus on Discrete Math, Linear Algebra, Probability.',
    color: '#F59E0B',
  },
];

export const PAREto_PRINCIPLE = {
  title: 'Pareto Principle (80/20 Rule)',
  icon: '🔥',
  description: '80% of GATE marks come from 20% of important topics.',
  tips: [
    'Focus on high-weightage subjects first',
    'Identify frequently asked concepts from PYQs',
    'Master the core topics before touching fringe ones',
    'Use PYQ pattern analysis to prioritize',
  ],
};

export const COMMON_MISTAKES = [
  { mistake: 'No revision cycle', icon: '🔄', severity: 'Critical' },
  { mistake: 'No mock tests until late', icon: '🧪', severity: 'Critical' },
  { mistake: 'Too many resources', icon: '📚', severity: 'High' },
  { mistake: 'Watching strategy videos instead of studying', icon: '📺', severity: 'High' },
  { mistake: 'Ignoring Mathematics & Aptitude', icon: '📐', severity: 'High' },
  { mistake: 'Starting PYQs too late', icon: '📝', severity: 'High' },
  { mistake: 'No short notes', icon: '📄', severity: 'Medium' },
  { mistake: 'Skipping revision of completed subjects', icon: '⏭️', severity: 'Medium' },
  { mistake: 'Studying without a roadmap', icon: '🗺️', severity: 'Medium' },
  { mistake: 'Not analyzing mock test mistakes', icon: '📊', severity: 'High' },
];

export const DAILY_FORMULA = {
  title: 'Daily Success Formula',
  blocks: [
    { label: 'Concepts', hours: 3, icon: '📖', color: '#6366F1' },
    { label: 'Problem Solving', hours: 2, icon: '✍️', color: '#F59E0B' },
    { label: 'PYQ Practice', hours: 1, icon: '📝', color: '#EC4899' },
    { label: 'Revision', hours: 1, icon: '🔄', color: '#10B981' },
  ],
};

export const AI_MENTOR_MESSAGES = [
  'You haven\'t revised Operating Systems for 9 days.',
  'Mathematics completion is only 42%.',
  'Solve 20 DBMS PYQs today.',
  'Your CN accuracy dropped from 82% to 65%.',
  'Time for your weekly mock test.',
  'You solved 0 PYQs yesterday. Let\'s fix that today.',
  'Your revision health score is 55% — below target.',
  'Streak at risk! Study today to keep your streak alive.',
  'Great progress this week! Your consistency score is 87%.',
  'Focus on weak topics: TOC and Compiler Design need attention.',
];
