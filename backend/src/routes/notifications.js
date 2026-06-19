const router = require('express').Router();
const { protect } = require('../middleware/auth');

// In-memory notification store
const notifications = {};

const RANKER_QUOTES = [
  { rank: 'AIR 1', name: 'GATE CSE', text: 'Consistency beats motivation. Even 3 focused hours daily for 8 months can outperform random 10-hour study days.', year: 2023 },
  { rank: 'AIR 5', name: 'GATE CSE', text: 'I revised every subject at least 4 times. Revision was more important than learning new topics.', year: 2024 },
  { rank: 'AIR 12', name: 'GATE CSE', text: 'PYQs are the closest thing to the actual exam. Never skip them.', year: 2023 },
  { rank: 'AIR 3', name: 'GATE DA', text: 'Understanding the why behind each concept matters more than memorizing solutions.', year: 2024 },
  { rank: 'AIR 8', name: 'GATE CSE', text: 'Your mock test scores don\'t define you — your analysis after each mock does.', year: 2024 },
  { rank: 'AIR 2', name: 'GATE CSE', text: 'Solve every PYQ from the last 10 years at least twice. Patterns repeat.', year: 2023 },
  { rank: 'AIR 15', name: 'GATE CSE', text: 'Don\'t collect resources. Master one book per subject completely.', year: 2024 },
  { rank: 'AIR 7', name: 'GATE CSE', text: 'The last 30 days are not for learning new topics. They are for revision and confidence.', year: 2023 },
  { rank: 'AIR 20', name: 'GATE CSE', text: 'Sleep is not a waste of time. A fresh brain solves problems faster.', year: 2024 },
  { rank: 'AIR 4', name: 'GATE CSE', text: 'I made a mistake notebook and reviewed it every Sunday. That alone improved my score by 15 marks.', year: 2023 },
  { rank: 'AIR 10', name: 'GATE DA', text: 'Mathematics is not a subject to memorize — it is a subject to practice every single day.', year: 2024 },
  { rank: 'AIR 6', name: 'GATE CSE', text: 'Your competition is not other students. Your competition is your own procrastination.', year: 2023 },
];

const DAILY_MOTIVATIONS = [
  'Every hour you study today is an investment in your future rank.',
  'The rank you want is hidden in today\'s study session. Start now.',
  'Small daily wins compound into extraordinary results.',
  'Your focus today determines your rank tomorrow.',
  'One more topic. One more PYQ. One step closer to your dream IIT.',
  'The pain of discipline is nothing compared to the pain of regret.',
  'You don\'t have to be extreme, just consistent.',
  'Success is the sum of small efforts repeated day in and day out.',
  'While others sleep, champions prepare.',
  'Every question you solve today is a mark you won\'t lose tomorrow.',
];

const REALITY_CHECKS = [
  'Your competitors are studying right now. Will you be ahead or behind on exam day?',
  'Every hour of procrastination is a gift to your competition.',
  'The gap between where you are and where you want to be is filled with daily action.',
  'Comfort zones are where dreams go to die. Step out and study.',
];

function todayIndex(arr) {
  const day = new Date().getDate();
  return day % arr.length;
}

const GATE_DATE = new Date('2027-02-07T00:00:00+05:30');

function daysUntilGate() {
  const now = new Date();
  const diff = GATE_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function generateNotifications(req) {
  const userId = req.user?.id || req.user?._id;
  if (!userId) return [];
  const now = new Date();
  const existing = notifications[userId] || [];
  const recentTypes = new Set(existing.slice(-5).map(n => n.type));
  const generated = [];
  const daysLeft = daysUntilGate();

  // 1. Daily Motivation (once per day)
  if (!recentTypes.has('motivation')) {
    generated.push({
      id: `mot-${now.toDateString()}`,
      type: 'motivation',
      icon: '🎯',
      title: `${daysLeft} Days to GATE 2027`,
      message: DAILY_MOTIVATIONS[todayIndex(DAILY_MOTIVATIONS)],
      read: false,
      createdAt: now.toISOString(),
      actionUrl: null,
    });
  }

  // 2. Ranker Quote (once per day)
  if (!recentTypes.has('ranker_quote')) {
    const quote = RANKER_QUOTES[todayIndex(RANKER_QUOTES)];
    generated.push({
      id: `rq-${now.toDateString()}`,
      type: 'ranker_quote',
      icon: '🏆',
      title: `${quote.rank} ${quote.name} Tip`,
      message: quote.text,
      read: false,
      createdAt: now.toISOString(),
      actionUrl: '/success-hub',
    });
  }

  // 3. Countdown (every 50 days)
  if (daysLeft > 0 && (daysLeft % 50 === 0 || daysLeft === 200 || daysLeft === 100 || daysLeft === 30 || daysLeft === 7)) {
    generated.push({
      id: `cd-${daysLeft}`,
      type: 'countdown',
      icon: '⏳',
      title: `${daysLeft} Days Left`,
      message: daysLeft > 30 ? 'Every day skipped now becomes pressure later.' : 'Final stretch! Every hour counts now.',
      read: false,
      createdAt: now.toISOString(),
      actionUrl: '/dashboard',
    });
  }

  // 4. Reality Check (random 30% chance)
  if (Math.random() < 0.3 && !recentTypes.has('reality_check')) {
    generated.push({
      id: `rc-${Date.now()}`,
      type: 'reality_check',
      icon: '⚡',
      title: 'Reality Check',
      message: REALITY_CHECKS[todayIndex(REALITY_CHECKS)],
      read: false,
      createdAt: now.toISOString(),
      actionUrl: '/analytics',
    });
  }

  // 5. AI Coach (weak area tip — mock data)
  if (!recentTypes.has('ai_coach')) {
    const weakAreas = ['CN Routing', 'Normalization', 'Process Synchronization', 'Turing Machines', 'Pipeline Hazards'];
    const topic = weakAreas[todayIndex(weakAreas)];
    generated.push({
      id: `ai-${now.toDateString()}`,
      type: 'ai_coach',
      icon: '🤖',
      title: 'AI Coach Recommendation',
      message: `Your weakest topic is ${topic}. Spend 25 minutes on it today.`,
      read: false,
      createdAt: now.toISOString(),
      actionUrl: '/weak-topics',
    });
  }

  // 6. Streak reminder (if no streak data, generic)
  if (!recentTypes.has('streak')) {
    generated.push({
      id: `str-${now.toDateString()}`,
      type: 'streak',
      icon: '🔥',
      title: 'Keep Your Streak Alive',
      message: 'Study at least 30 minutes today to keep your streak going.',
      read: false,
      createdAt: now.toISOString(),
      actionUrl: '/daily-coach',
    });
  }

  // Merge with existing (deduplicate by id)
  const existingIds = new Set(existing.map(n => n.id));
  const newOnes = generated.filter(n => !existingIds.has(n.id));
  notifications[userId] = [...newOnes, ...existing].slice(0, 50); // keep latest 50

  return newOnes;
}

// GET /api/notifications — list all for user
router.get('/', protect, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userNotes = notifications[userId] || [];
  // Auto-generate if empty
  if (userNotes.length === 0) {
    generateNotifications(req);
  }
  res.json({ success: true, data: notifications[userId] || [] });
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userNotes = notifications[userId] || [];
  const count = userNotes.filter(n => !n.read).length;
  res.json({ success: true, count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userNotes = notifications[userId] || [];
  const note = userNotes.find(n => n.id === req.params.id);
  if (note) {
    note.read = true;
    res.json({ success: true, data: note });
  } else {
    res.status(404).json({ success: false, message: 'Notification not found' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', protect, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userNotes = notifications[userId] || [];
  userNotes.forEach(n => n.read = true);
  res.json({ success: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const userNotes = notifications[userId] || [];
  notifications[userId] = userNotes.filter(n => n.id !== req.params.id);
  res.json({ success: true });
});

// POST /api/notifications/generate — manually trigger generation
router.post('/generate', protect, (req, res) => {
  const newNotes = generateNotifications(req);
  res.json({ success: true, count: newNotes.length, data: newNotes });
});

// GET /api/notifications/ranker-quote — daily ranker wisdom
router.get('/ranker-quote', protect, (req, res) => {
  const quote = RANKER_QUOTES[todayIndex(RANKER_QUOTES)];
  res.json({ success: true, data: quote });
});

module.exports = router;
