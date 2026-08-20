const Notification = require('../models/Notification');
const NotificationPrefs = require('../models/NotificationPrefs');
const LearningContent = require('../models/LearningContent');
const { isMongoConnected } = require('../config/db');

const MOTIVATIONAL_VIDEOS = [
  { id: 'motiv-1', title: 'The Power of Consistency', url: 'https://www.youtube.com/watch?v=YJ9xBFAenVw' },
  { id: 'motiv-2', title: 'Why Small Daily Wins Matter', url: 'https://www.youtube.com/watch?v=8iI5MSSS3dk' },
  { id: 'motiv-3', title: 'From Zero to IIT — A Journey', url: 'https://www.youtube.com/watch?v=4fTv9NshzUc' },
  { id: 'motiv-4', title: 'The Last 30 Days Strategy', url: 'https://www.youtube.com/watch?v=Zr9Lm5D_bL8' },
  { id: 'motiv-5', title: 'Believe in the Process', url: 'https://www.youtube.com/watch?v=VpE2aSCxScE' },
];

const DID_YOU_KNOW = [
  { text: 'The GATE Computer Science paper contains approximately 65 questions worth 100 marks.', link: '/pyq' },
  { text: 'GATE scores are valid for 3 years for PSU recruitment.', link: '/gate-papers' },
  { text: 'IIT Bombay offers M.Tech in CSE with a focus on AI and Machine Learning.', link: '/opportunity-predictor' },
  { text: 'GATE 2027 will be conducted by IIT Roorkee.', link: '/gate-papers' },
  { text: 'Over 1.5 lakh candidates appear for GATE CSE every year.', link: '/analytics' },
];

const QUICK_FACTS = [
  { text: 'Operating Systems contributes around 6-8 marks every year.', subject: 'Operating Systems', link: '/subjects' },
  { text: 'DBMS normalization questions appear in almost every GATE paper.', subject: 'DBMS', link: '/subjects' },
  { text: 'Computer Networks carries 5-7 marks in GATE CSE.', subject: 'Computer Networks', link: '/subjects' },
  { text: 'Digital Logic is one of the highest scoring subjects — aim for full marks.', subject: 'Digital Logic', link: '/subjects' },
  { text: 'Theory of Computation questions are mostly moderate difficulty.', subject: 'TOC', link: '/subjects' },
];

const PRODUCTIVITY_TIPS = [
  { text: 'Students who revise within 24 hours remember concepts much longer.', link: '/revision' },
  { text: 'The Pomodoro technique (25 min study, 5 min break) boosts focus by 40%.', link: '/productivity' },
  { text: 'Solving PYQs from the last 5 years covers 70% of repeated concepts.', link: '/pyq' },
  { text: 'Teaching a concept to someone else is the fastest way to master it.', link: '/dashboard' },
  { text: 'Taking a 10-minute walk after 2 hours of study improves retention.', link: '/productivity' },
];

const CAMPUS_INSIGHTS = [
  { name: 'IIT Bombay', desc: 'Top-ranked for CSE research with state-of-the-art AI labs.', link: '/opportunity-predictor' },
  { name: 'IIT Madras', desc: 'Home to India\'s fastest supercomputer and world-class faculty.', link: '/opportunity-predictor' },
  { name: 'IISc Bangalore', desc: 'India\'s #1 research institute with interdisciplinary programs.', link: '/opportunity-predictor' },
  { name: 'IIT Delhi', desc: 'Strong industry connections with average CSE placement of 25+ LPA.', link: '/opportunity-predictor' },
  { name: 'IIT Kanpur', desc: 'Pioneer in computer science education with excellent lab facilities.', link: '/opportunity-predictor' },
];

const LEARNING_HUB_VIDEOS = [
  { id: 'lh-1', title: 'Life inside IIT Bombay Hostel', category: 'Campus Life', link: '/learning-hub', emoji: '🎥' },
  { id: 'lh-2', title: 'A day in IISc Bangalore', category: 'Campus Life', link: '/learning-hub', emoji: '🎓' },
  { id: 'lh-3', title: 'How AIR 24 revised all subjects in 45 days', category: 'Strategy', link: '/learning-hub', emoji: '🚀' },
  { id: 'lh-4', title: 'Pomodoro vs Deep Work — Which is better for GATE?', category: 'Study Technique', link: '/learning-hub', emoji: '📖' },
  { id: 'lh-5', title: 'Don\'t lose today\'s opportunity — 3-minute motivation', category: 'Motivation', link: '/learning-hub', emoji: '🎯' },
  { id: 'lh-6', title: 'IIT Delhi campus tour — Where India\'s best minds study', category: 'Campus Life', link: '/learning-hub', emoji: '🏛️' },
  { id: 'lh-7', title: 'My GATE preparation journey — AIR 15 story', category: 'Success Story', link: '/learning-hub', emoji: '🏆' },
  { id: 'lh-8', title: 'How to make short notes that actually work', category: 'Study Technique', link: '/learning-hub', emoji: '📝' },
  { id: 'lh-9', title: 'Last 30 days strategy for GATE 2027', category: 'Strategy', link: '/learning-hub', emoji: '🔥' },
  { id: 'lh-10', title: 'IIT Madras research labs — Future of AI in India', category: 'Campus Life', link: '/learning-hub', emoji: '🧠' },
];

const DISCOVERY_ITEMS = [
  { id: 'disc-1', title: 'College Predictor', desc: 'Wondering which IIT you can get? Predict your admission chances now.', link: '/opportunity-predictor', emoji: '🏛️' },
  { id: 'disc-2', title: 'Gate Vault', desc: 'A new Premium PDF has been added. Read now.', link: '/gate-vault', emoji: '📄' },
  { id: 'disc-3', title: 'Notes Hub', desc: 'Today\'s Short Notes: Operating Systems — Memory Management', link: '/short-notes', emoji: '📚' },
  { id: 'disc-4', title: 'Daily Content', desc: 'Today\'s Daily Concept is ready. Read in 5 minutes.', link: '/daily-coach', emoji: '🔥' },
  { id: 'disc-5', title: 'Analytics', desc: 'Your weekly report is available. Check your progress.', link: '/analytics', emoji: '📊' },
  { id: 'disc-6', title: 'Formula Sheets', desc: 'Quick reference formulas for Operating Systems — ready for revision.', link: '/formula-sheets', emoji: '📘' },
  { id: 'disc-7', title: 'Flashcard Bank', desc: 'New flashcards added for Computer Networks. Review now.', link: '/flashcard-bank', emoji: '🃏' },
];

const INSPIRATION_QUOTES = [
  { text: 'I wasn\'t the smartest student. I was simply the most consistent.', author: 'Anonymous GATE Topper' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Every expert was once a beginner.', author: 'Helen Hayes' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
];

const SUCCESS_STORIES_DATA = [
  { id: 'ss-1', title: 'How AIR 58 prepared while studying in college', category: 'college-student', link: '/success-hub' },
  { id: 'ss-2', title: 'From average student to IIT Bombay — A complete transformation', category: 'transformation', link: '/success-hub' },
  { id: 'ss-3', title: 'Working professional who cracked GATE in 6 months', category: 'working-professional', link: '/success-hub' },
  { id: 'ss-4', title: 'How self-study and free resources helped achieve AIR 12', category: 'self-study', link: '/success-hub' },
  { id: 'ss-5', title: 'From electronics to CSE — Branch change through GATE', category: 'branch-change', link: '/success-hub' },
];

const LOGIN_DAY_MESSAGES = {
  2: {
    title: 'Welcome Back!',
    emoji: '🌅',
    body: (ctx) => {
      const parts = ['Day 2 of your GATE Journey.\n'];
      if (ctx.yesterdayHours > 0 || ctx.yesterdayPyqs > 0 || ctx.yesterdayTopics > 0) {
        parts.push('Yesterday:');
        if (ctx.yesterdayHours > 0) parts.push(`✓ ${ctx.yesterdayHours} Study Hours`);
        if (ctx.yesterdayPyqs > 0) parts.push(`✓ ${ctx.yesterdayPyqs} PYQs`);
        if (ctx.yesterdayTopics > 0) parts.push(`✓ ${ctx.yesterdayTopics} Topics Completed`);
        parts.push('');
      }
      parts.push("Today's goal is ready.");
      return parts.join('\n');
    },
    action: { label: 'Open Planner', path: '/planner' },
  },
  3: {
    title: 'Day 3!',
    emoji: '🔥',
    body: () => "Consistency beats motivation.\n\nToday's recommendation:\nOperating Systems — Deadlocks\n\nEstimated Gain:\n+3 Marks",
    action: { label: 'Start Studying', path: '/subjects' },
  },
  5: {
    title: 'Almost a Week!',
    emoji: '💪',
    body: () => "5 days of preparation.\n\nYou're building real habits.\n\nGateNexa AI has identified your weak areas.\nLet's focus on them today.",
    action: { label: 'View AI Coach', path: '/ai-coach' },
  },
  10: {
    title: 'Amazing!',
    emoji: '🏆',
    body: (ctx) => `You've been preparing for 10 days.\n\nStudy Hours: ${ctx.totalHours || 0}\nTopics Completed: ${ctx.topicsCompleted || 0}\nPYQs Solved: ${ctx.pyqsSolved || 0}\n\nGateNexa AI has updated your roadmap.`,
    action: { label: 'View Roadmap', path: '/personalized-roadmap' },
  },
  15: {
    title: 'Two Weeks Strong!',
    emoji: '⭐',
    body: () => "15 days of consistent preparation.\n\nYou're in the top 20% of GATE aspirants who stay consistent.\n\nKeep going — your rank is being built right now.",
    action: { label: 'Continue', path: '/dashboard' },
  },
  30: {
    title: 'One Month!',
    emoji: '👑',
    body: (ctx) => `30 days of dedication.\n\nTotal Hours: ${ctx.totalHours || 0}\nCurrent Streak: ${ctx.streak || 0} days\n\nYou've covered more than most aspirants do in 3 months.\n\nGateNexa AI recommends a mock test to benchmark your progress.`,
    action: { label: 'Take Mock Test', path: '/mocks' },
  },
};

const MILESTONES_DATA = [
  { key: 'first_topic', emoji: '🎉', title: 'First Topic Completed', body: "You've completed your first topic. Every great rank starts with understanding the basics.", color: 'from-purple-500 to-pink-500', link: '/subjects' },
  { key: 'streak_7', emoji: '🔥', title: '7-Day Streak!', body: 'A full week of consistent study. This is how GATE toppers are built.', color: 'from-orange-500 to-red-500', link: '/dashboard' },
  { key: 'pyq_100', emoji: '📚', title: '100 PYQs Solved!', body: "You've solved 100 previous year questions. Every question brings you closer to your dream rank.", color: 'from-violet-500 to-indigo-500', link: '/pyq' },
  { key: 'first_mock', emoji: '🏆', title: 'First Mock Completed!', body: 'You took your first mock test. Analysis is the key to improvement.', color: 'from-amber-500 to-orange-500', link: '/mocks' },
  { key: 'hours_50', emoji: '⏱', title: '50 Study Hours!', body: '50 hours of focused preparation. Your dedication is inspiring.', color: 'from-rose-500 to-pink-500', link: '/analytics' },
  { key: 'level_up', emoji: '⭐', title: 'Level Up!', body: "You've improved your predicted score. GateNexa AI recognizes your progress.", color: 'from-emerald-500 to-teal-500', link: '/analytics' },
];

const SUBJECT_WEIGHTAGE = {
  'Operating Systems': 9, 'Computer Networks': 8.5, 'DBMS': 8,
  'Computer Organization': 8.5, 'Theory of Computation': 8, 'Algorithms': 7.5,
  'Programming & Data Structures': 11.5, 'Engineering Mathematics': 12.5,
  'Digital Logic': 5, 'Compiler Design': 5, 'General Aptitude': 15,
};

function getRandomItem(arr, seen = []) {
  const available = arr.filter(i => !seen.includes(i.id || i.text));
  if (available.length === 0) return arr[Math.floor(Math.random() * arr.length)];
  return available[Math.floor(Math.random() * available.length)];
}

async function ensurePrefs(userId) {
  let prefs = await NotificationPrefs.findOne({ user: userId });
  if (!prefs) {
    try {
      prefs = await NotificationPrefs.create({ user: userId, maxPerDay: 5 });
    } catch (e) {
      if (e.code === 11000) {
        prefs = await NotificationPrefs.findOne({ user: userId });
      } else {
        throw e;
      }
    }
  }
  // Reset daily counter if new day
  const today = new Date().toISOString().slice(0, 10);
  if (prefs.todayDate !== today) {
    prefs.todayCount = 0;
    prefs.todayDate = today;
    await prefs.save();
  }
  return prefs;
}

function inQuietHours(prefs) {
  const hour = new Date().getHours();
  if (prefs.quietHoursStart <= prefs.quietHoursEnd) {
    return hour >= prefs.quietHoursStart && hour < prefs.quietHoursEnd;
  }
  return hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd;
}

async function generateMorningMission(userId, context) {
  const { weakSubjects, topics, dailyHours } = context;
  const weak = weakSubjects?.slice(0, 2) || ['Engineering Mathematics', 'Operating Systems'];
  const items = [];
  items.push(`• Study: ${weak[0]} — Focus on high-weightage topics`);
  items.push(`• Practice: Solve 15-20 PYQs from ${weak[1] || 'recently completed subjects'}`);
  items.push('• Revise: Quick revision of last week\'s topics (20 min)');

  return {
    type: 'morning_mission',
    title: 'Good Morning!',
    body: `Today's mission is ready.\n\n${items.join('\n')}\n\nEstimated: ${dailyHours || 4} hours. Let's go!`,
    emoji: '🌅',
    action: { label: 'Start Today\'s Plan', path: '/planner' },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

async function generateMotivation(userId, prefs) {
  const video = getRandomItem(MOTIVATIONAL_VIDEOS, prefs.seenMotivations);
  if (!prefs.seenMotivations.includes(video.id)) {
    prefs.seenMotivations.push(video.id);
    await prefs.save();
  }
  return {
    type: 'motivation',
    title: 'Today\'s Motivation',
    body: 'Success is built one study session at a time.\n\nWatch today\'s 2-minute motivational video to set your mindset right.',
    emoji: '🔥',
    action: { label: 'Watch Now', path: '/dashboard' },
    metadata: { videoId: video.id },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

async function generateSuccessStory(userId, prefs) {
  let stories = [];
  if (isMongoConnected()) {
    stories = await LearningContent.find({ type: 'success_story', isActive: true }).lean();
  }
  if (stories.length === 0) {
    stories = [
      { _id: 'default-1', title: 'IISc Journey', description: 'How a determined student secured IISc Bangalore through consistent practice.', category: 'air-top-10' },
      { _id: 'default-2', title: 'Self Study Victory', description: 'Cracked GATE using only free YouTube resources and self-made notes.', category: 'self-study' },
      { _id: 'default-3', title: 'Working Professional', description: 'A software engineer who prepared while working full-time.', category: 'working-professional' },
    ];
  }

  const unseen = stories.filter(s => !prefs.seenStories.includes(s._id.toString()));
  const story = unseen.length > 0 ? unseen[0] : stories[0];
  if (!prefs.seenStories.includes(story._id.toString())) {
    prefs.seenStories.push(story._id.toString());
    await prefs.save();
  }

  return {
    type: 'success_story',
    title: 'Today\'s Inspiration',
    body: `${story.title}\n\n${story.description || 'Read their study strategy and key lessons to stay motivated.'}`,
    emoji: '🎓',
    action: { label: 'Read Story', path: '/success-hub' },
    metadata: { storyId: story._id.toString() },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateRoadmap(context) {
  const subjects = context.subjects || [];
  const weak = context.weakSubjects?.[0] || 'Computer Networks';
  const sub = subjects.find(s => s.name === weak) || { name: weak, progress: 0 };
  const topics = context.topics?.filter(t => t.subject === weak && !t.done) || [];
  const nextTopic = topics[0] || { name: 'Core Concepts', done: false };

  return {
    type: 'roadmap',
    title: 'AI Study Roadmap',
    body: `You have completed ${Math.round(sub.progress || 0)}% of ${weak}.\n\nNext recommended topic:\n${nextTopic.name}\n\nEstimated Time: 90 minutes`,
    emoji: '🗺️',
    action: { label: 'Continue Learning', path: '/subjects' },
    metadata: { subject: weak, topic: nextTopic.name, progress: sub.progress, duration: 90 },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateRecommendation(context) {
  const subjects = context.subjects || [];
  const sorted = [...subjects].sort((a, b) => (a.progress || 0) - (b.progress || 0));
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  return {
    type: 'recommendation',
    title: 'GateNexa AI says:',
    body: `You are strongest in ${strongest?.name || 'Mathematics'} this week.\n\nToday, focus on ${weakest?.name || 'Operating Systems'} to improve your overall score.`,
    emoji: '🧠',
    action: { label: 'Open Recommendation', path: '/ai-coach' },
    metadata: { subject: weakest?.name },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateDSAChallenge() {
  const challenges = [
    { topic: 'Binary Search', difficulty: 'Easy' },
    { topic: 'Two Pointers', difficulty: 'Easy' },
    { topic: 'Linked List Reversal', difficulty: 'Medium' },
    { topic: 'Tree Traversal', difficulty: 'Easy' },
    { topic: 'Dynamic Programming — Fibonacci', difficulty: 'Easy' },
    { topic: 'Stack — Valid Parentheses', difficulty: 'Easy' },
    { topic: 'Queue — Sliding Window', difficulty: 'Medium' },
    { topic: 'Graph BFS', difficulty: 'Medium' },
  ];
  const challenge = challenges[Math.floor(Math.random() * challenges.length)];

  return {
    type: 'dsa_challenge',
    title: 'DSA Challenge',
    body: `Can you solve today's ${challenge.topic} problem in under 15 minutes?\n\nDifficulty: ${challenge.difficulty}`,
    emoji: '💻',
    action: { label: 'Start Challenge', path: '/pyq' },
    metadata: { topic: challenge.topic, difficulty: challenge.difficulty, duration: 15 },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateRevision(context) {
  const topics = context.topics?.filter(t => !t.done) || [];
  const due = topics[Math.floor(Math.random() * topics.length)] || { name: 'Key Concepts', subject: 'Recent Topics' };

  return {
    type: 'revision',
    title: 'Revision Time',
    body: `Your AI recommends revising ${due.name} today.\n\nEstimated Time: 25 minutes`,
    emoji: '🔁',
    action: { label: 'Start Revision', path: '/revision' },
    metadata: { topic: due.name, subject: due.subject, duration: 25 },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateFocusReminder(context) {
  const hours = context.dailyHours || 4;

  return {
    type: 'focus_reminder',
    title: 'Deep Focus Time',
    body: `You planned a ${hours}-hour study session today.\n\nReady to continue?`,
    emoji: '⏰',
    action: { label: 'Start Focus', path: '/productivity' },
    metadata: { duration: hours * 60 },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateDidYouKnow() {
  const fact = DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)];

  return {
    type: 'did_you_know',
    title: 'Did You Know?',
    body: fact.text,
    emoji: '💡',
    action: { label: 'Learn More', path: fact.link },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateQuickFact() {
  const fact = QUICK_FACTS[Math.floor(Math.random() * QUICK_FACTS.length)];

  return {
    type: 'quick_fact',
    title: 'Quick Fact',
    body: fact.text,
    emoji: '🎯',
    action: { label: 'Study Now', path: fact.link },
    metadata: { subject: fact.subject },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateProductivityTip() {
  const tip = PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)];

  return {
    type: 'productivity_tip',
    title: 'Productivity Tip',
    body: tip.text,
    emoji: '🚀',
    action: { label: 'Open Revision', path: tip.link },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateCampusInsight() {
  const insight = CAMPUS_INSIGHTS[Math.floor(Math.random() * CAMPUS_INSIGHTS.length)];

  return {
    type: 'campus_insight',
    title: `Explore ${insight.name}`,
    body: insight.desc,
    emoji: '🎓',
    action: { label: 'Explore Institute', path: insight.link },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateWeeklyReport(context) {
  const subjects = context.subjects || [];
  const sorted = [...subjects].sort((a, b) => (a.progress || 0) - (b.progress || 0));
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const weekStats = context.weekStats || { hours: 0, pyqsSolved: 0, topicsCompleted: 0, revisions: 0 };

  return {
    type: 'weekly_report',
    title: 'Weekly Report',
    body: [
      `📊 Study Hours: ${weekStats.hours || 0}h`,
      `✅ Topics Completed: ${weekStats.topicsCompleted || 0}`,
      `📝 PYQs Solved: ${weekStats.pyqsSolved || 0}`,
      `🔄 Revision Sessions: ${weekStats.revisions || 0}`,
      ``,
      `Best Subject: ${strongest?.name || '—'}`,
      `Needs Focus: ${weakest?.name || '—'}`,
      ``,
      `GateNexa AI recommends dedicating extra time to ${weakest?.name || 'your weak areas'} this week.`,
    ].join('\n'),
    emoji: '📊',
    action: { label: 'View Report', path: '/analytics' },
    metadata: { subject: weakest?.name },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  };
}

function generateLearningHub(userId, prefs) {
  const video = getRandomItem(LEARNING_HUB_VIDEOS, prefs.seenLearningHub || []);
  if (!(prefs.seenLearningHub || []).includes(video.id)) {
    prefs.seenLearningHub = [...(prefs.seenLearningHub || []), video.id];
  }

  return {
    type: 'learning_hub',
    title: `${video.emoji} Recommended Video`,
    body: `${video.title}\n\n${video.category}\n\nWatch now.`,
    emoji: video.emoji,
    action: { label: 'Watch Now', path: video.link },
    metadata: { videoId: video.id, category: video.category },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
  };
}

function generateDiscovery(userId, prefs) {
  const item = getRandomItem(DISCOVERY_ITEMS, prefs.seenDiscovery || []);
  if (!(prefs.seenDiscovery || []).includes(item.id)) {
    prefs.seenDiscovery = [...(prefs.seenDiscovery || []), item.id];
  }

  return {
    type: 'discovery',
    title: `${item.emoji} ${item.title}`,
    body: item.desc,
    emoji: item.emoji,
    action: { label: 'Open', path: item.link },
    metadata: { discoveryId: item.id },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  };
}

function generateSmartReminder(userId, context) {
  const reminders = [
    { title: '⏰ Study Reminder', body: "You planned to study at this time.\n\nReady?", emoji: '⏰', action: { label: 'Start Focus', path: '/productivity' } },
    { title: '🔁 Revision Due', body: `Computer Networks\n\nEstimated time: 25 minutes\n\nStart now.`, emoji: '🔁', action: { label: 'Start Revision', path: '/revision' } },
    { title: '📘 Planner', body: "Today's timetable isn't completed.\n\nContinue where you left off.", emoji: '📘', action: { label: 'Open Planner', path: '/planner' } },
    { title: '🧘 Focus Session', body: "You haven't logged a focus session today.\n\nEven 25 minutes counts.", emoji: '🧘', action: { label: 'Start Session', path: '/productivity' } },
    { title: '📝 PYQ Practice', body: "Solving just 5 PYQs today keeps your momentum.\n\nPick a subject.", emoji: '📝', action: { label: 'Practice Now', path: '/pyq' } },
  ];
  const pick = reminders[Math.floor(Math.random() * reminders.length)];

  return {
    type: 'smart_reminder',
    ...pick,
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
  };
}

function generateDailyInspiration(userId, prefs) {
  const quote = getRandomItem(INSPIRATION_QUOTES, prefs.seenStories || []);

  return {
    type: 'daily_inspiration',
    title: '💡 Daily Inspiration',
    body: `"${quote.text}"\n\n— ${quote.author}`,
    emoji: '💡',
    action: { label: 'Read More', path: '/success-hub' },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateLoginDay(userId, prefs, context) {
  const day = context.loginDay || 1;
  const config = LOGIN_DAY_MESSAGES[day];
  if (!config) return null;

  const body = typeof config.body === 'function' ? config.body(context) : config.body;

  return {
    type: 'login_day',
    title: config.title,
    body,
    emoji: config.emoji,
    action: config.action,
    metadata: { loginDay: day },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function generateMilestone(userId, prefs, context) {
  const milestoneKey = context.milestoneKey;
  const config = MILESTONES_DATA.find(m => m.key === milestoneKey);
  if (!config) return null;

  return {
    type: 'milestone',
    title: `${config.emoji} ${config.title}`,
    body: config.body,
    emoji: config.emoji,
    action: { label: 'View Progress', path: config.link },
    metadata: { milestoneKey },
    scheduledAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

const generators = {
  morning_mission: generateMorningMission,
  motivation: generateMotivation,
  success_story: generateSuccessStory,
  roadmap: generateRoadmap,
  recommendation: generateRecommendation,
  dsa_challenge: generateDSAChallenge,
  revision: generateRevision,
  focus_reminder: generateFocusReminder,
  did_you_know: generateDidYouKnow,
  quick_fact: generateQuickFact,
  productivity_tip: generateProductivityTip,
  campus_insight: generateCampusInsight,
  weekly_report: generateWeeklyReport,
  learning_hub: generateLearningHub,
  discovery: generateDiscovery,
  smart_reminder: generateSmartReminder,
  daily_inspiration: generateDailyInspiration,
  login_day: generateLoginDay,
  milestone: generateMilestone,
};

async function generateAndDeliver(userId, type, context) {
  const prefs = await ensurePrefs(userId);
  if (!prefs.enabled) return null;
  if (prefs.todayCount >= prefs.maxPerDay) return null;
  if (inQuietHours(prefs)) return null;
  if (!prefs.categories[type]) return null;

  const generator = generators[type];
  if (!generator) return null;

  const data = await generator(userId, prefs, context);
  if (!data || !data.title) return null;
  const notification = await Notification.create({ user: userId, ...data, deliveredAt: new Date() });

  prefs.todayCount += 1;
  prefs.lastSentAt = new Date();
  await prefs.save();

  return notification;
}

async function generateDailyNotifications(userId, context) {
  const prefs = await ensurePrefs(userId);
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const notifications = [];

  // Slot 1: Morning (7-9am) — Welcome + Today's Mission
  if (hour >= 7 && hour < 9) {
    if (prefs.todayCount < prefs.maxPerDay) {
      const n = await generateAndDeliver(userId, 'morning_mission', context);
      if (n) notifications.push(n);
    }
    if (prefs.todayCount < prefs.maxPerDay) {
      const n = await generateAndDeliver(userId, 'motivation', context);
      if (n) notifications.push(n);
    }
  }

  // Slot 2: Late Morning (11am-12pm) — Motivation or Learning Hub
  if (hour >= 11 && hour < 12) {
    if (prefs.todayCount < prefs.maxPerDay) {
      const types = ['motivation', 'learning_hub', 'success_story', 'campus_insight'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const n = await generateAndDeliver(userId, pick, context);
      if (n) notifications.push(n);
    }
  }

  // Slot 3: Afternoon (2-4pm) — AI Mentor Recommendation
  if (hour >= 14 && hour < 16) {
    if (prefs.todayCount < prefs.maxPerDay) {
      const types = ['recommendation', 'roadmap', 'dsa_challenge', 'learning_hub'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const n = await generateAndDeliver(userId, pick, context);
      if (n) notifications.push(n);
    }
  }

  // Slot 4: Evening (6-8pm) — Revision or Focus Reminder
  if (hour >= 18 && hour < 20) {
    if (prefs.todayCount < prefs.maxPerDay) {
      const types = ['revision', 'focus_reminder', 'smart_reminder', 'discovery'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const n = await generateAndDeliver(userId, pick, context);
      if (n) notifications.push(n);
    }
  }

  // Slot 5: Night (8:30-10pm) — Daily Summary or Inspiration
  if (hour >= 20 && hour < 22) {
    if (prefs.todayCount < prefs.maxPerDay) {
      const types = ['daily_inspiration', 'weekly_report', 'did_you_know', 'quick_fact'];
      const pick = day === 0 ? 'weekly_report' : types[Math.floor(Math.random() * types.length)];
      const n = await generateAndDeliver(userId, pick, context);
      if (n) notifications.push(n);
    }
  }

  // Login day notification (if applicable)
  if (context.loginDay && LOGIN_DAY_MESSAGES[context.loginDay] && prefs.todayCount < prefs.maxPerDay) {
    const n = await generateAndDeliver(userId, 'login_day', context);
    if (n) notifications.push(n);
  }

  // Milestone notification (if applicable)
  if (context.milestoneKey && prefs.todayCount < prefs.maxPerDay) {
    const n = await generateAndDeliver(userId, 'milestone', context);
    if (n) notifications.push(n);
  }

  // Fill remaining slots with rotating content
  while (prefs.todayCount < prefs.maxPerDay) {
    const extras = ['learning_hub', 'discovery', 'daily_inspiration', 'smart_reminder', 'did_you_know', 'quick_fact', 'productivity_tip', 'campus_insight'];
    const pick = extras[Math.floor(Math.random() * extras.length)];
    const n = await generateAndDeliver(userId, pick, context);
    if (n) notifications.push(n);
    else break;
  }

  return notifications;
}

async function generateOnboardingNotifications(userId) {
  const prefs = await ensurePrefs(userId);
  const now = new Date();
  const onboarding = [
    {
      type: 'login_day',
      title: 'Welcome to GateNexa! 🎉',
      body: 'This is Day 1 of your GATE journey.\n\nStart by exploring your dashboard and getting familiar with your study space.',
      emoji: '🎉',
      action: { label: 'Explore Dashboard', path: '/dashboard' },
      scheduledAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'roadmap',
      title: 'Create Today\'s Study Plan 📚',
      body: 'Plan your day with focused topics and time blocks. A clear plan is the first step to a high score.',
      emoji: '📚',
      action: { label: 'Open Planner', path: '/planner' },
      scheduledAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'motivation',
      title: 'Watch Today\'s Motivation 🎥',
      body: 'Watch a 2-minute motivational video to set the right mindset before you start studying.',
      emoji: '🎥',
      action: { label: 'Watch Now', path: '/learning-hub' },
      scheduledAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'recommendation',
      title: 'Meet GateNexa AI 🧠',
      body: 'Your AI Mentor builds a personalized roadmap, recommends topics, and keeps you on track.',
      emoji: '🧠',
      action: { label: 'Meet AI Mentor', path: '/mentor' },
      scheduledAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'focus_reminder',
      title: 'Start Your First Focus Session ⏱',
      body: 'Use the Focus Timer to study in deep, distraction-free sessions and build your streak.',
      emoji: '⏱',
      action: { label: 'Start Focus', path: '/focus' },
      scheduledAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ];

  let count = 0;
  for (const data of onboarding) {
    try {
      await Notification.create({ user: userId, ...data, deliveredAt: now });
      count += 1;
    } catch (_) {}
  }
  prefs.onboardingSeeded = true;
  prefs.todayCount = Math.min(prefs.todayCount + count, prefs.maxPerDay);
  prefs.lastSentAt = now;
  await prefs.save();
  return count;
}

module.exports = {
  generateAndDeliver,
  generateDailyNotifications,
  generateOnboardingNotifications,
  ensurePrefs,
  generators,
};
