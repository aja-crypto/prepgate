export const LOADING_INSIGHTS = [
  { type: 'tip', icon: '📚', text: 'Solved PYQs 3 times before exam.', rank: 'AIR 12' },
  { type: 'tip', icon: '🔄', text: 'Revision mattered more than learning.', rank: 'AIR 27' },
  { type: 'tip', icon: '🎯', text: 'Accuracy increased my rank.', rank: 'AIR 58' },
  { type: 'tip', icon: '📈', text: '1 hour daily > 7 hours on Sunday. Small daily wins compound.', rank: null },
  { type: 'tip', icon: '🧠', text: 'Understanding the why behind each concept matters more than memorizing solutions.', rank: 'AIR 3' },
  { type: 'tip', icon: '⚡', text: 'Focus on weak subjects first. Your rank is determined by your lowest score.', rank: null },
  { type: 'tip', icon: '📊', text: 'Accuracy matters more than attempts. 80% accuracy on 60 questions beats 60% on 100.', rank: null },
  { type: 'tip', icon: '🏆', text: 'Small improvements compound into big ranks. Improve 1% every day.', rank: null },
  { type: 'quote', icon: '💡', text: 'I revised every subject at least 4 times. Revision was more important than learning new topics.', rank: 'AIR 5' },
  { type: 'quote', icon: '💡', text: 'PYQs are the closest thing to the actual exam. Never skip them.', rank: 'AIR 12' },
  { type: 'quote', icon: '💡', text: 'I made a mistake notebook and reviewed it every Sunday. That improved my score by 15 marks.', rank: 'AIR 4' },
  { type: 'quote', icon: '💡', text: 'Your mock test scores don\'t define you — your analysis after each mock does.', rank: 'AIR 8' },
];

export const LOADING_STEPS_LIBRARY = {
  default: [
    'Connecting Neural Network',
    'Loading GATE Knowledge Base',
    'Mapping Subject Relationships',
    'Loading PYQ Database',
    'Building Revision Graph',
    'Calculating Readiness Score',
    'Activating AIR Predictor',
    'Initializing AI Mentor',
    'Preparing Your Dashboard',
  ],
  auth: [
    'Verifying Credentials...',
    'Loading Profile...',
    'Syncing Progress...',
    'Preparing Dashboard...',
  ],
  subject: [
    'Loading Subject Data...',
    'Analyzing Topics...',
    'Fetching PYQs...',
    'Calculating Progress...',
  ],
  mentor: [
    'Analyzing Performance...',
    'Reviewing Weak Areas...',
    'Generating Strategy...',
    'Preparing Recommendations...',
  ],
  mock: [
    'Preparing Examination Environment...',
    'Loading Questions...',
    'Setting Difficulty...',
    'Initializing Timer...',
  ],
  dashboard: [
    'Readiness Engine',
    'Study Analytics',
    'AIR Predictor',
    'Loading Dashboard...',
  ],
  notes: [
    'Loading Notes...',
    'Organizing Resources...',
    'Preparing Study Materials...',
  ],
  pyq: [
    'Loading PYQ Bank...',
    'Indexing Questions...',
    'Preparing Practice Environment...',
  ],
};
