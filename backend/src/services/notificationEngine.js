const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationPrefs = require('../models/NotificationPrefs');

const TIMEZONE = 'Asia/Kolkata';

const SLOTS = [
  { id: 'morning', hour: 8, minute: 0 },
  { id: 'late_morning', hour: 11, minute: 30 },
  { id: 'afternoon', hour: 15, minute: 0 },
  { id: 'evening', hour: 19, minute: 0 },
  { id: 'night', hour: 21, minute: 0 },
];

const SLOT_MINUTES = Object.fromEntries(
  SLOTS.map((s) => [s.id, s.hour * 60 + s.minute])
);

const EVENT_TYPES = {
  first_topic: {
    type: 'first_topic',
    category: 'events',
    priority: 'high',
    title: 'First topic completed',
    message: 'You finished your first topic. Keep the streak going with a short revision today.',
    description: 'A strong start compounds. Review key formulas once, then move to the next high-weight topic.',
    action: { label: 'Open topics', href: '/topics' },
  },
  streak_7: {
    type: 'streak_7',
    category: 'events',
    priority: 'high',
    title: '7-day streak',
    message: 'Seven days of consistent study. Protect the streak with a focused 45-minute block.',
    description: 'Consistency beats intensity. Lock a fixed slot for tomorrow before you close GateNexa.',
    action: { label: 'Open planner', href: '/planner' },
  },
  pyq_100: {
    type: 'pyq_100',
    category: 'events',
    priority: 'high',
    title: '100 PYQs practiced',
    message: 'You have practiced 100 previous-year questions. Next: review every incorrect attempt.',
    description: 'Accuracy grows from error analysis, not from more volume alone.',
    action: { label: 'Review PYQs', href: '/pyq' },
  },
  first_mock: {
    type: 'first_mock',
    category: 'events',
    priority: 'high',
    title: 'First mock completed',
    message: 'Your first mock is done. Note weak subjects and schedule a targeted revision.',
    description: 'Treat the mock as a map, not a verdict. One weak area per day is enough.',
    action: { label: 'Open mocks', href: '/mocks' },
  },
  hours_50: {
    type: 'hours_50',
    category: 'events',
    priority: 'high',
    title: '50 study hours logged',
    message: 'You have crossed 50 hours. Shift 20% of time to mixed PYQ practice.',
    description: 'At this stage, mixed practice reveals gaps that topic-wise study can hide.',
    action: { label: 'See progress', href: '/progress' },
  },
  level_up: {
    type: 'level_up',
    category: 'events',
    priority: 'high',
    title: 'Level up',
    message: 'You moved to the next level. Raise the bar with one harder topic and one mock section.',
    description: 'Keep the same daily hours, but increase question difficulty this week.',
    action: { label: 'Continue', href: '/dashboard' },
  },
};

const ONBOARDING_ITEMS = [
  // ── Day 1: Welcome + first steps ──
  {
    day: 1,
    type: 'welcome',
    category: 'onboarding',
    priority: 'high',
    title: 'Welcome to GateNexa',
    message: 'Your GATE 2027 workspace is ready. Start with today\'s focus and one complete topic block.',
    description: 'Use the planner for the day, then mark one topic complete before you stop.',
    action: { label: 'Go to dashboard', href: '/dashboard' },
    slot: 'onboarding',
  },
  {
    day: 1,
    type: 'onboarding_roadmap',
    category: 'onboarding',
    priority: 'normal',
    title: 'Set your study rhythm',
    message: 'Pick a daily hour target and a first subject. Small, repeatable blocks beat long irregular sessions.',
    description: 'Morning theory, afternoon PYQs, evening revision is a reliable default.',
    action: { label: 'Open planner', href: '/planner' },
    slot: 'onboarding',
  },
  {
    day: 1,
    type: 'onboarding_pyq',
    category: 'onboarding',
    priority: 'normal',
    title: 'Practice from day one',
    message: 'Solve a few previous-year questions today, even before the syllabus feels complete.',
    description: 'PYQs show the exam\'s actual language. Start with one easy set.',
    action: { label: 'Open PYQs', href: '/pyq' },
    slot: 'onboarding',
  },
  // ── Day 2: Build the habit ──
  {
    day: 2,
    type: 'onboarding_focus',
    category: 'onboarding',
    priority: 'high',
    title: 'Start your first focus session',
    message: 'Use the Focus Timer for one 45-minute deep-study block today. No phone, no tabs.',
    description: 'A single focused session teaches your brain the new routine better than three distracted hours.',
    action: { label: 'Start focus session', href: '/focus' },
    slot: 'onboarding',
  },
  {
    day: 2,
    type: 'onboarding_notes',
    category: 'onboarding',
    priority: 'normal',
    title: 'Capture one page of notes',
    message: 'Write a short note on today\'s topic — key formulas, definitions, or a concept map.',
    description: 'Short notes compound over weeks. Start with one page; the habit matters more than the length.',
    action: { label: 'Open notes', href: '/notes' },
    slot: 'onboarding',
  },
  // ── Day 3: Track and review ──
  {
    day: 3,
    type: 'onboarding_mistakes',
    category: 'onboarding',
    priority: 'high',
    title: 'Log your first mistakes',
    message: 'Open the Mistake Notebook and add at least one error from today\'s practice.',
    description: 'Mistake tracking is the single highest-ROI habit for GATE. Start the list now.',
    action: { label: 'Open mistake notebook', href: '/mistakes' },
    slot: 'onboarding',
  },
  {
    day: 3,
    type: 'onboarding_progress',
    category: 'onboarding',
    priority: 'normal',
    title: 'Check your progress',
    message: 'Visit the Progress page to see hours logged, topics covered, and your current streak.',
    description: 'Seeing numbers move is motivating. If the numbers are small, that is fine — the trend matters.',
    action: { label: 'See progress', href: '/progress' },
    slot: 'onboarding',
  },
  // ── Day 4: Go deeper ──
  {
    day: 4,
    type: 'onboarding_ai',
    category: 'onboarding',
    priority: 'normal',
    title: 'Try GateNexa AI',
    message: 'Ask the AI Mentor one question about a topic you found difficult today.',
    description: 'The AI builds context from your study history. One good question saves an hour of confusion.',
    action: { label: 'Open AI Mentor', href: '/ai' },
    slot: 'onboarding',
  },
  {
    day: 4,
    type: 'onboarding_weekly_review',
    category: 'onboarding',
    priority: 'normal',
    title: 'Plan your first weekly review',
    message: 'In three days, review what you studied, what you got wrong, and what to prioritise next week.',
    description: 'Weekly review is how a long GATE year stays on track. Put it on your calendar now.',
    action: { label: 'Open planner', href: '/planner' },
    slot: 'onboarding',
  },
  // ── Day 5: Consolidate and look ahead ──
  {
    day: 5,
    type: 'onboarding_consolidate',
    category: 'onboarding',
    priority: 'high',
    title: 'Consolidate your first five days',
    message: 'Spend 30 minutes reworking the problems you got wrong this week. This is where real learning begins.',
    description: 'The patterns you fix now will not resurface in mocks. Rework before you advance.',
    action: { label: 'Open mistake notebook', href: '/mistakes' },
    slot: 'onboarding',
  },
  {
    day: 5,
    type: 'onboarding_next_week',
    category: 'onboarding',
    priority: 'normal',
    title: 'Plan next week now',
    message: 'Write next week\'s three anchors: one high-weight topic, one PYQ set, and one revision block.',
    description: 'A short written plan beats ambitious intentions. Keep anchors small enough to be honest.',
    action: { label: 'Open planner', href: '/planner' },
    slot: 'onboarding',
  },
  {
    day: 5,
    type: 'onboarding_gatenexa_ai',
    category: 'onboarding',
    priority: 'normal',
    title: 'Use GateNexa AI for stuck topics',
    message: 'Next time a concept is not landing, open the AI Mentor with the exact problem and your attempt.',
    description: 'Good context = good answers. Paste the question, your steps, and where you got confused.',
    action: { label: 'Open AI Mentor', href: '/ai' },
    slot: 'onboarding',
  },
];

const SLOT_LIBRARY = {
  morning: [
    {
      type: 'morning_mission',
      category: 'study',
      priority: 'high',
      title: 'Morning study mission',
      message: 'Complete one focused block: theory notes, then 8–10 PYQs on the same topic.',
      description: 'Protect the first 90 minutes. No mixed subjects until the block is done.',
      action: { label: 'Start planner', href: '/planner' },
    },
    {
      type: 'todays_focus',
      category: 'study',
      priority: 'high',
      title: 'Today’s focus',
      message: 'Choose one high-weight topic and finish its concept map before noon.',
      description: 'Write 5 key formulas from memory. If you cannot, revise before practice.',
      action: { label: 'Open topics', href: '/topics' },
    },
  ],
  late_morning: [
    {
      type: 'motivation',
      category: 'motivation',
      priority: 'normal',
      title: 'Stay on the line',
      message: 'You do not need a perfect day. You need the next honest 40 minutes.',
      description: 'If energy is low, switch to formula revision instead of skipping the slot.',
      action: { label: 'Continue', href: '/dashboard' },
    },
    {
      type: 'learning_suggestion',
      category: 'study',
      priority: 'normal',
      title: 'Learning suggestion',
      message: 'Revisit yesterday’s weakest concept with 5 fresh questions, not more notes.',
      description: 'Active recall now will save a full revision cycle later.',
      action: { label: 'Practice PYQs', href: '/pyq' },
    },
    {
      type: 'success_story',
      category: 'motivation',
      priority: 'normal',
      title: 'What toppers repeat',
      message: 'High scorers treat error logs as the syllabus. Add 3 mistakes to yours today.',
      description: 'A short, honest error list beats another unmarked chapter.',
      action: { label: 'Open notes', href: '/notes' },
    },
    {
      type: 'campus_insight',
      category: 'insights',
      priority: 'low',
      title: 'Campus insight',
      message: 'M.Tech shortlists reward GATE score plus a clean core-subject story. Keep CS/EE fundamentals tight.',
      description: 'Document one project or subject strength this week while scores are still forming.',
      action: { label: 'See live data', href: '/live' },
    },
  ],
  afternoon: [
    {
      type: 'ai_recommendation',
      category: 'study',
      priority: 'normal',
      title: 'AI study recommendation',
      message: 'Use a mixed set this afternoon: 60% current topic, 40% a weak older topic.',
      description: 'Interleaving improves retention more than another full chapter read.',
      action: { label: 'Ask GateNexa AI', href: '/ai' },
    },
    {
      type: 'roadmap_suggestion',
      category: 'study',
      priority: 'normal',
      title: 'Roadmap check',
      message: 'If a topic is taking more than two sessions, split it: definitions first, then numericals.',
      description: 'Unfinished chapters usually fail at the numerical step, not the reading step.',
      action: { label: 'Open roadmap', href: '/subjects' },
    },
    {
      type: 'dsa_challenge',
      category: 'study',
      priority: 'normal',
      title: 'DSA challenge',
      message: 'Solve one array/graph problem with a timer. Explain the complexity out loud after you finish.',
      description: 'GATE rewards clear method, not only the final answer.',
      action: { label: 'Practice', href: '/topics' },
    },
    {
      type: 'learning_suggestion',
      category: 'study',
      priority: 'normal',
      title: 'Afternoon learning nudge',
      message: 'Do a 25-minute PYQ burst, then 10 minutes of solution review. Stop there.',
      description: 'Review is the session. Extra volume without review is noise.',
      action: { label: 'Open PYQs', href: '/pyq' },
    },
  ],
  evening: [
    {
      type: 'revision_reminder',
      category: 'revision',
      priority: 'high',
      title: 'Revision reminder',
      message: 'Revise today’s formulas and one older topic you marked difficult.',
      description: 'Closed-book recall for 15 minutes is enough if you write the blanks down.',
      action: { label: 'Revise topics', href: '/topics' },
    },
    {
      type: 'focus_reminder',
      category: 'study',
      priority: 'normal',
      title: 'Evening focus',
      message: 'One more clean block: no new chapters, only practice and correction.',
      description: 'Protect sleep. A short accurate session beats a late messy one.',
      action: { label: 'Open planner', href: '/planner' },
    },
    {
      type: 'planner_reminder',
      category: 'study',
      priority: 'normal',
      title: 'Plan tomorrow',
      message: 'Write tomorrow’s three tasks now: topic, PYQ set, and a revision item.',
      description: 'A written plan reduces morning friction.',
      action: { label: 'Open planner', href: '/planner' },
    },
    {
      type: 'discovery',
      category: 'insights',
      priority: 'low',
      title: 'Discover a gap',
      message: 'Scan your last mock or PYQ set and pick the single most expensive mistake.',
      description: 'Fix that one pattern tomorrow morning before new theory.',
      action: { label: 'Open mocks', href: '/mocks' },
    },
  ],
  night: [
    {
      type: 'daily_inspiration',
      category: 'motivation',
      priority: 'low',
      title: 'Close the day well',
      message: 'Stop if you are exhausted. A recovered morning is worth more than a tired extra hour.',
      description: 'Log what you finished. Tomorrow starts from a clear list, not guilt.',
      action: { label: 'Dashboard', href: '/dashboard' },
    },
    {
      type: 'quick_fact',
      category: 'insights',
      priority: 'low',
      title: 'Quick GATE fact',
      message: 'Most papers reward accuracy on 1-mark questions. Do not rush the easy ones tomorrow.',
      description: 'A calm first 30 minutes in the exam often decides the rank band.',
      action: { label: 'Practice 1-markers', href: '/pyq' },
    },
    {
      type: 'daily_insight',
      category: 'insights',
      priority: 'normal',
      title: 'Daily insight',
      message: 'If today’s accuracy dropped, cut new topics tomorrow and rebuild with mixed PYQs.',
      description: 'Volume without accuracy is a false progress signal.',
      action: { label: 'See progress', href: '/progress' },
    },
    {
      type: 'weekly_progress',
      category: 'insights',
      priority: 'normal',
      title: 'Weekly progress check',
      message: 'Look at hours, topics completed, and mock trend. Keep what worked; drop one low-value habit.',
      description: 'Weekly review is how a long GATE year stays on track.',
      action: { label: 'Open progress', href: '/progress' },
    },
  ],
};

const GATENEXA_SYSTEM_LIBRARY = [
  {
    id: 'early_access_welcome',
    type: 'early_access',
    category: 'gatenexa',
    priority: 'normal',
    title: '\u{1F680} You are among the early users of GateNexa',
    message: 'GateNexa is currently in Early Access, while we continue improving and validating features across the platform. Some features may change as we refine the experience based on real learner feedback. Your feedback helps us make GateNexa better before the full launch.',
    description: '\u{1F6E0}\uFE0F Platform improvements are ongoing. We are actively improving AI assistance, study tools, notifications, resources, and other parts of the learning experience. Thanks for being part of the early-access journey.',
    action: { label: 'Explore dashboard', href: '/dashboard' },
  },
  {
    id: 'platform_status',
    type: 'feature_update',
    category: 'gatenexa',
    priority: 'normal',
    title: '\u{1F6E0}\uFE0F Platform improvements are ongoing',
    message: 'We are actively improving AI assistance, study tools, notifications, resources, and other parts of the learning experience. Thanks for being part of the early-access journey.',
    description: 'If you run into rough edges or have ideas, your feedback directly shapes what GateNexa becomes before the full launch.',
    action: { label: 'Continue', href: '/dashboard' },
  },
];

const STUDY_BASELINE_LIBRARY = [
  {
    id: 'study_today_focus_block',
    type: 'study_suggestion',
    category: 'study',
    priority: 'normal',
    title: '\u{1F9E0} Today\u2019s preparation suggestion',
    message: 'Pick one high-weight topic, take a 45-minute focused block, and finish with 8 previous-year questions on the same topic. Close the loop with a 2-minute written summary.',
    description: 'One clean block beats four distracted hours. Write the three takeaways before you move on.',
    action: { label: 'Open planner', href: '/planner' },
  },
  {
    id: 'study_milestone_small_wins',
    type: 'preparation_milestone',
    category: 'study',
    priority: 'normal',
    title: '\u{1F3AF} Preparation milestone',
    message: 'Protect the 3-small-blocks habit today: one theory block, one PYQ block, one revision block. You do not need a perfect day to move the needle.',
    description: 'Milestones form from repeated small blocks, not occasional marathon days.',
    action: { label: 'See progress', href: '/progress' },
  },
  {
    id: 'study_resources_check',
    type: 'resource_update',
    category: 'study',
    priority: 'low',
    title: '\u{1F4DA} New study resources available',
    message: 'Check the Resources section for updated formula sheets, PYQ sets, and topic breakdowns curated for the current syllabus weight.',
    description: 'The resource list is refined each week as we validate coverage against recent papers.',
    action: { label: 'Explore resources', href: '/resources' },
  },
  {
    id: 'gate_updates_watch_official',
    type: 'gate_update',
    category: 'gate_updates',
    priority: 'normal',
    title: '\u{1F4E2} Watch for official GATE 2027 announcements',
    message: 'Keep an eye on official GATE authorities for application form, brochure, and deadline updates. GateNexa will surface clearly-labeled verified information once official sources publish them.',
    description: 'To avoid misinformation, only trust dates and deadlines from the official organising institute and its designated portals.',
    action: { label: 'Open dashboard', href: '/dashboard' },
    verified: false,
  },
];

let injectedNow = null;

function isTestTimeAllowed() {
  return process.env.NODE_ENV === 'test' || process.env.GATENEXA_TEST_TIME === '1';
}

function setTestNow(value) {
  if (!isTestTimeAllowed()) return false;
  injectedNow = value ? new Date(value) : null;
  return true;
}

function getGateNexaNow() {
  if (isTestTimeAllowed() && injectedNow) {
    return new Date(injectedNow.getTime());
  }
  if (isTestTimeAllowed() && process.env.GATENEXA_NOW) {
    return new Date(process.env.GATENEXA_NOW);
  }
  return new Date();
}

function getIstParts(date = getGateNexaNow()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const map = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: map.weekday,
  };
}

function getGateNexaDateKey(date = getGateNexaNow()) {
  const parts = getIstParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getIstMinutes(date = getGateNexaNow()) {
  const parts = getIstParts(date);
  return parts.hour * 60 + parts.minute;
}

function parseHHMM(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const h = Math.floor(value);
    if (h >= 0 && h <= 23) return h * 60;
    return null;
  }
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function isQuietHours(date, prefs) {
  const start = parseHHMM(prefs?.quietHoursStart);
  const end = parseHHMM(prefs?.quietHoursEnd);
  if (start == null || end == null || start === end) return false;
  const mins = getIstMinutes(date);
  if (start < end) return mins >= start && mins < end;
  return mins >= start || mins < end;
}

function getNotificationKey(userId, type, dateKey, slot) {
  const uid = String(userId);
  if (slot === 'event') return `${uid}:event:${type}`;
  if (slot === 'onboarding') return `${uid}:onboarding:${type}`;
  return `${uid}:${dateKey}:${slot}:${type}`;
}

function hashPick(seed, modulo) {
  let hash = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % Math.max(modulo, 1);
}

function pickSlotContent(userId, dateKey, slot) {
  const library = SLOT_LIBRARY[slot] || [];
  if (!library.length) return null;
  let options = library;
  if (slot === 'night') {
    const weekday = getIstParts(dateFromKey(dateKey)).weekday;
    const isWeekReviewDay = weekday === 'Sun' || weekday === 'Sat';
    options = library.filter((item) => item.type !== 'weekly_progress' || isWeekReviewDay);
    if (!options.length) options = library;
  }
  const index = hashPick(`${userId}:${dateKey}:${slot}`, options.length);
  return options[index];
}

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function slotScheduledAt(dateKey, slot) {
  const minutes = SLOT_MINUTES[slot];
  if (minutes == null) return getGateNexaNow();
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const utcMinutes = minutes - (5 * 60 + 30);
  const hours = Math.floor(utcMinutes / 60);
  const mins = ((utcMinutes % 60) + 60) % 60;
  const extraDay = utcMinutes < 0 ? -1 : 0;
  return new Date(Date.UTC(year, month - 1, day + extraDay, hours, mins, 0));
}

function isNotificationSlotDue(slot, date = getGateNexaNow()) {
  if (!SLOT_MINUTES[slot] && SLOT_MINUTES[slot] !== 0) return false;
  const dateKey = getGateNexaDateKey(date);
  const nowKey = getGateNexaDateKey(getGateNexaNow());
  if (dateKey < nowKey) return true;
  if (dateKey > nowKey) return false;
  return getIstMinutes(date) >= SLOT_MINUTES[slot];
}

function currentEligibleSlot(date = getGateNexaNow()) {
  const minutes = getIstMinutes(date);
  let current = null;
  for (const slot of SLOTS) {
    if (minutes >= slot.hour * 60 + slot.minute) current = slot.id;
  }
  return current;
}

function isValidUserId(userId) {
  return mongoose.Types.ObjectId.isValid(userId)
    && String(new mongoose.Types.ObjectId(userId)) === String(userId);
}

const ENGINE_CATEGORIES = ['study', 'onboarding', 'events', 'motivation', 'revision', 'insights', 'gate_updates', 'gatenexa'];

const LEGACY_TYPE_TO_CATEGORY = {
  morning_mission: 'study', todays_focus: 'study', focus_reminder: 'study',
  planner_reminder: 'study', roadmap_suggestion: 'study', dsa_challenge: 'study',
  learning_suggestion: 'study', ai_recommendation: 'study', revision_reminder: 'revision',
  motivation: 'motivation', success_story: 'motivation', daily_inspiration: 'motivation',
  campus_insight: 'insights', discovery: 'insights', quick_fact: 'insights',
  daily_insight: 'insights', weekly_progress: 'insights',
  first_topic: 'events', streak_7: 'events', pyq_100: 'events',
  first_mock: 'events', hours_50: 'events', level_up: 'events',
  login_day: 'events', milestone: 'events',
  welcome: 'onboarding', onboarding_roadmap: 'onboarding', onboarding_pyq: 'onboarding',
  onboarding_focus: 'onboarding', onboarding_notes: 'onboarding', onboarding_mistakes: 'onboarding',
  onboarding_progress: 'onboarding', onboarding_ai: 'onboarding', onboarding_weekly_review: 'onboarding',
  onboarding_consolidate: 'onboarding', onboarding_next_week: 'onboarding', onboarding_gatenexa_ai: 'onboarding',
  early_access: 'gatenexa', maintenance: 'gatenexa', feature_update: 'gatenexa',
  study_suggestion: 'study', preparation_milestone: 'study', weekly_summary: 'insights',
  resource_update: 'study', gate_update: 'gate_updates',
};

function normalizePrefsCategories(prefs) {
  if (!prefs || !prefs.categories) return null;
  const keys = Object.keys(prefs.categories);
  const hasLegacy = keys.some(k => !ENGINE_CATEGORIES.includes(k));
  if (!hasLegacy) return prefs.categories;
  const next = {};
  for (const cat of ENGINE_CATEGORIES) next[cat] = true;
  for (const key of keys) {
    if (ENGINE_CATEGORIES.includes(key)) {
      next[key] = prefs.categories[key] !== false;
    } else {
      const mapped = LEGACY_TYPE_TO_CATEGORY[key];
      if (mapped && next[mapped] !== false && prefs.categories[key] === false) {
        next[mapped] = false;
      }
    }
  }
  return next;
}

function categoryEnabled(prefs, category) {
  if (!category) return true;
  if (!prefs?.categories) return true;
  const normalized = normalizePrefsCategories(prefs) || prefs.categories;
  if (normalized && normalized[category] === false) return false;
  const direct = prefs.categories[category];
  return direct !== false;
}

async function seedBaselineNotifications(userId, now = getGateNexaNow()) {
  const summary = { created: 0, skippedDuplicate: 0, skipped: 0, failed: 0 };
  if (!isValidUserId(userId)) return summary;
  const prefs = await ensurePrefs(userId, now);
  if (!prefs || !prefs.enabled) return summary;
  if (prefs.baselineSeeded) return summary;

  const dateKey = getGateNexaDateKey(now);
  const all = [];
  for (const item of GATENEXA_SYSTEM_LIBRARY) {
    if (!categoryEnabled(prefs, item.category)) { summary.skipped += 1; continue; }
    all.push(item);
  }
  for (const item of STUDY_BASELINE_LIBRARY) {
    if (!categoryEnabled(prefs, item.category)) { summary.skipped += 1; continue; }
    if (item.category === 'gate_updates' && item.verified === false) {
      // Keep: explicitly labeled non-verified reminder. No fabricated GATE-official content.
    }
    all.push(item);
  }

  for (const item of all) {
    const notificationKey = getNotificationKey(userId, `${item.type}:${item.id}`, dateKey, 'baseline');
    const result = await createIfAbsent({
      user: userId,
      type: item.type,
      title: item.title,
      message: item.message,
      body: item.message,
      description: item.description || '',
      category: item.category,
      priority: item.priority || 'normal',
      isRead: false,
      isBookmarked: false,
      scheduledAt: now,
      deliveredAt: now,
      expiresAt: null,
      metadata: {
        slot: 'baseline',
        dateKey,
        source: 'baseline_seed',
        libraryId: item.id,
        verified: item.verified === true,
      },
      action: item.action || null,
      notificationKey,
    });
    if (result.created) summary.created += 1;
    else if (result.duplicate) summary.skippedDuplicate += 1;
    else summary.failed += 1;
  }

  if (summary.failed === 0 && (summary.created > 0 || summary.skippedDuplicate > 0 || all.length === 0)) {
    try {
      prefs.baselineSeeded = true;
      await prefs.save();
    } catch (_) { /* ignore */ }
  }
  return summary;
}

async function ensurePrefs(userId, now = getGateNexaNow()) {
  if (!isValidUserId(userId)) return null;
  const dateKey = getGateNexaDateKey(now);
  let prefs = await NotificationPrefs.findOne({ user: userId });
  if (!prefs) {
    const defaultCategories = {};
    for (const cat of ENGINE_CATEGORIES) defaultCategories[cat] = true;
    prefs = await NotificationPrefs.create({
      user: userId,
      enabled: true,
      maxPerDay: 5,
      todayCount: 0,
      todayDate: dateKey,
      categories: defaultCategories,
      onboardingSeeded: false,
    });
  } else {
    let normalized = false;
    const keys = prefs.categories ? Object.keys(prefs.categories) : [];
    const hasLegacy = keys.length && keys.some(k => !ENGINE_CATEGORIES.includes(k));
    const missingEngine = ENGINE_CATEGORIES.some(c => !prefs.categories || prefs.categories[c] == null);
    if (hasLegacy || missingEngine) {
      const merged = normalizePrefsCategories({ categories: prefs.categories || {} }) || {};
      for (const cat of ENGINE_CATEGORIES) {
        if (merged[cat] == null) merged[cat] = true;
      }
      prefs.categories = merged;
      normalized = true;
    }
    if (prefs.todayDate !== dateKey) {
      prefs.todayDate = dateKey;
      prefs.todayCount = 0;
      normalized = true;
    }
    if (normalized) await prefs.save();
  }
  if (prefs.todayDate !== dateKey) {
    prefs.todayDate = dateKey;
    prefs.todayCount = 0;
    await prefs.save();
  }
  return prefs;
}

async function createIfAbsent(payload) {
  const existing = await Notification.findOne({
    user: payload.user,
    notificationKey: payload.notificationKey,
  });
  if (existing) {
    return { created: false, duplicate: true, notification: existing };
  }
  try {
    const notification = await Notification.create(payload);
    return { created: true, duplicate: false, notification };
  } catch (err) {
    if (err && err.code === 11000) {
      const dup = await Notification.findOne({
        user: payload.user,
        notificationKey: payload.notificationKey,
      });
      return { created: false, duplicate: true, notification: dup };
    }
    console.error('[NotificationEngine] create failed');
    return { created: false, duplicate: false, error: true };
  }
}

async function recordDelivery(prefs) {
  prefs.todayCount = (prefs.todayCount || 0) + 1;
  prefs.lastSentAt = getGateNexaNow();
  await prefs.save();
}

async function generateDailyNotifications(userId, options = {}) {
  const now = options.now ? new Date(options.now) : getGateNexaNow();
  const slot = options.slot;
  const result = {
    created: 0,
    skippedDuplicate: 0,
    skipped: 0,
    slot: slot || null,
    dateKey: getGateNexaDateKey(now),
  };

  if (!isValidUserId(userId) || !slot || SLOT_MINUTES[slot] == null) {
    result.skipped += 1;
    return result;
  }

  const prefs = await ensurePrefs(userId, now);
  if (!prefs) {
    result.skipped += 1;
    return result;
  }
  if (!prefs.enabled) {
    result.skipped += 1;
    return result;
  }

  const maxPerDay = Number.isFinite(prefs.maxPerDay) ? prefs.maxPerDay : 5;
  const dateKey = getGateNexaDateKey(now);
  const dbTodayCount = await Notification.countDocuments({
    user: userId,
    'metadata.dateKey': dateKey,
    'metadata.slot': { $nin: ['onboarding', 'baseline'] },
  }).catch(() => 0);
  if (dbTodayCount >= maxPerDay) {
    result.skipped += 1;
    return result;
  }
  if ((prefs.todayCount || 0) >= maxPerDay && dbTodayCount >= (prefs.todayCount || 0)) {
    result.skipped += 1;
    return result;
  }

  if (!options.schedulerRun && !isNotificationSlotDue(slot, now)) {
    result.skipped += 1;
    return result;
  }

  if (!options.schedulerRun && isQuietHours(now, prefs) && slot === currentEligibleSlot(now)) {
    result.skipped += 1;
    return result;
  }

  const content = pickSlotContent(userId, dateKey, slot);
  if (!content) {
    result.skipped += 1;
    return result;
  }
  if (!categoryEnabled(prefs, content.category)) {
    result.skipped += 1;
    return result;
  }

  const notificationKey = getNotificationKey(userId, content.type, dateKey, slot);
  const scheduledAt = slotScheduledAt(dateKey, slot);
  const deliveredAt = now;
  const expiresAt = new Date(scheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const created = await createIfAbsent({
    user: userId,
    type: content.type,
    title: content.title,
    message: content.message,
    body: content.message,
    description: content.description || '',
    category: content.category,
    priority: content.priority || 'normal',
    isRead: false,
    isBookmarked: false,
    scheduledAt,
    deliveredAt,
    expiresAt,
    metadata: {
      slot,
      dateKey,
      source: options.schedulerRun ? 'scheduler' : 'engine',
    },
    action: content.action || null,
    notificationKey,
  });

  if (created.duplicate) {
    result.skippedDuplicate += 1;
    return result;
  }
  if (created.created) {
    await recordDelivery(prefs);
    result.created += 1;
    result.notificationKey = notificationKey;
    result.type = content.type;
    return result;
  }

  result.skipped += 1;
  return result;
}

async function generateOnboardingNotifications(userId, options = {}) {
  const now = options.now ? new Date(options.now) : getGateNexaNow();
  const summary = { created: 0, skippedDuplicate: 0, failed: 0, day: null, seeded: false };
  if (!isValidUserId(userId)) return summary;

  const prefs = await ensurePrefs(userId, now);
  if (!prefs || !prefs.enabled || !categoryEnabled(prefs, 'onboarding')) {
    return summary;
  }

  const User = require('../models/User');
  const user = await User.findById(userId).select('createdAt').lean();
  if (!user?.createdAt) return summary;

  const createdKey = getGateNexaDateKey(new Date(user.createdAt));
  const nowKey = getGateNexaDateKey(now);
  const createdDayUTC = new Date(createdKey + 'T00:00:00Z');
  const nowDayUTC = new Date(nowKey + 'T00:00:00Z');
  const currentDayNumber = Math.floor((nowDayUTC - createdDayUTC) / 86400000) + 1;
  summary.day = currentDayNumber;

  if (currentDayNumber < 1) return summary;

  const onboardingSeeded = Boolean(prefs.onboardingSeeded);
  let startDay = currentDayNumber;
  let endDay = currentDayNumber;
  if (!onboardingSeeded) {
    startDay = 1;
    endDay = Math.min(Math.max(currentDayNumber, 1), 5);
  } else if (currentDayNumber > 5) {
    return summary;
  }

  if (endDay < 1 || startDay > 5) return summary;
  startDay = Math.max(startDay, 1);
  endDay = Math.min(endDay, 5);

  const dateKey = getGateNexaDateKey(now);
  let anyCreated = false;
  for (let dayNumber = startDay; dayNumber <= endDay; dayNumber += 1) {
    const todayItems = ONBOARDING_ITEMS.filter((item) => item.day === dayNumber);
    for (const item of todayItems) {
      const notificationKey = getNotificationKey(userId, `${item.type}:day${dayNumber}`, dateKey, 'onboarding');
      const created = await createIfAbsent({
        user: userId,
        type: item.type,
        title: item.title,
        message: item.message,
        body: item.message,
        description: item.description || '',
        category: item.category,
        priority: item.priority || 'normal',
        isRead: false,
        isBookmarked: false,
        scheduledAt: now,
        deliveredAt: now,
        expiresAt: null,
        metadata: { slot: 'onboarding', dateKey, source: 'onboarding', day: dayNumber },
        action: item.action || null,
        notificationKey,
      });
      if (created.created) { summary.created += 1; anyCreated = true; }
      else if (created.duplicate) summary.skippedDuplicate += 1;
      else summary.failed += 1;
    }
  }

  if (!onboardingSeeded && summary.failed === 0 && (anyCreated || summary.skippedDuplicate > 0)) {
    try {
      prefs.onboardingSeeded = true;
      await prefs.save();
      summary.seeded = true;
    } catch (_) { /* ignore */ }
  }
  summary.anyCreated = anyCreated;
  return summary;
}

async function generateEventNotification(userId, eventType, context = {}) {
  const now = context.now ? new Date(context.now) : getGateNexaNow();
  const summary = { created: 0, skippedDuplicate: 0 };
  const template = EVENT_TYPES[eventType];
  if (!template || !isValidUserId(userId)) return summary;

  const prefs = await ensurePrefs(userId, now);
  if (!prefs || !prefs.enabled || !categoryEnabled(prefs, 'events')) return summary;

  const dateKey = getGateNexaDateKey(now);
  const notificationKey = getNotificationKey(userId, eventType, dateKey, 'event');
  const title = typeof context.title === 'string' ? context.title : template.title;
  const message = typeof context.message === 'string' ? context.message : template.message;

  const created = await createIfAbsent({
    user: userId,
    type: template.type,
    title,
    message,
    body: message,
    description: template.description || '',
    category: template.category,
    priority: template.priority,
    isRead: false,
    isBookmarked: false,
    scheduledAt: now,
    deliveredAt: now,
    expiresAt: null,
    metadata: {
      slot: 'event',
      dateKey,
      eventType,
      source: 'event',
      context: sanitizeContext(context),
    },
    action: template.action || null,
    notificationKey,
  });

  if (created.created) summary.created += 1;
  else if (created.duplicate) summary.skippedDuplicate += 1;
  return summary;
}

function sanitizeContext(context) {
  if (!context || typeof context !== 'object') return {};
  const allowed = {};
  for (const key of ['topicId', 'level', 'count', 'hours', 'label']) {
    if (context[key] != null && typeof context[key] !== 'object') {
      allowed[key] = context[key];
    }
  }
  return allowed;
}

async function generateAndDeliver(userId, options = {}, legacyContext) {
  if (typeof options === 'string') {
    const type = options;
    const context = legacyContext || {};
    const now = context.now ? new Date(context.now) : getGateNexaNow();
    const prefs = await ensurePrefs(userId, now);
    if (!prefs || !prefs.enabled) return null;
    if (prefs.maxPerDay != null && (prefs.todayCount || 0) >= prefs.maxPerDay) return null;
    if (isQuietHours(now, prefs)) return null;
    const dateKey = getGateNexaDateKey(now);
    const notificationKey = getNotificationKey(userId, type, dateKey, 'single');
    let content = null;
    for (const slot of Object.keys(SLOT_LIBRARY)) {
      const arr = SLOT_LIBRARY[slot] || [];
      const found = arr.find((i) => i.type === type);
      if (found) { content = found; break; }
    }
    if (!content) {
      const map = { motivation: SLOT_LIBRARY.late_morning?.[0], revision: SLOT_LIBRARY.evening?.[0] };
      content = map[type] || { type, category: 'general', priority: 'normal', title: type, message: context.message || `Notification ${type}`, description: context.description || '', action: context.action || null };
      if (context.title) content.title = context.title;
      if (context.message) content.message = context.message;
    }
    const category = content.category;
    if (prefs.categories && prefs.categories[category] === false) return null;
    const created = await createIfAbsent({
      user: userId,
      type: content.type,
      title: content.title,
      message: content.message,
      body: content.message,
      description: content.description || '',
      category: content.category || 'general',
      priority: content.priority || 'normal',
      isRead: false,
      isBookmarked: false,
      scheduledAt: now,
      deliveredAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      metadata: { slot: 'single', dateKey, source: 'legacy', type },
      action: content.action || null,
      notificationKey,
    });
    if (created.created) {
      await recordDelivery(prefs);
      return created.notification;
    }
    return null;
  }
  const now = options.now ? new Date(options.now) : getGateNexaNow();
  const onboarding = await generateOnboardingNotifications(userId, { now });
  const slot = options.slot || currentEligibleSlot(now);
  const daily = slot
    ? await generateDailyNotifications(userId, {
      slot,
      schedulerRun: Boolean(options.schedulerRun),
      now,
    })
    : { created: 0, skippedDuplicate: 0, skipped: 1 };
  return {
    onboarding,
    daily,
    dateKey: getGateNexaDateKey(now),
    slot: slot || null,
  };
}

module.exports = {
  TIMEZONE,
  SLOTS,
  ENGINE_CATEGORIES,
  LEGACY_TYPE_TO_CATEGORY,
  ensurePrefs,
  generateAndDeliver,
  generateDailyNotifications,
  generateOnboardingNotifications,
  generateEventNotification,
  seedBaselineNotifications,
  getNotificationKey,
  getGateNexaNow,
  getGateNexaDateKey,
  isNotificationSlotDue,
  setTestNow,
  currentEligibleSlot,
  ONBOARDING_ITEMS,
};
