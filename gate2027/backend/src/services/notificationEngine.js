// src/services/notificationEngine.js – Deterministic notification generation
// Asia/Kolkata-aware, MongoDB-backed, deduplication-safe, scheduler-ready.

const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationPrefs = require('../models/NotificationPrefs');

// ─────────────────────────────────────────────────────────────
// Time injection (test mode)
// ─────────────────────────────────────────────────────────────
// In production, the engine uses real Asia/Kolkata time. When
// `process.env.NODE_ENV === 'test'` is set, callers may push
// a fake "now" via `__setTestNow(Date)` and reset via `__resetTestNow()`.
let __testNow = null;

function getGateNexaNow() {
  if (__testNow) return new Date(__testNow);
  return new Date();
}

// Asia/Kolkata is UTC+05:30 — fixed offset, no DST.
const IST_OFFSET_MINUTES = 330;

function getGateNexaDateKey(date = getGateNexaNow()) {
  // Convert to IST wall-clock YYYY-MM-DD using fixed offset.
  // Using Intl with timeZone would also work but is slower; this is explicit.
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getGateNexaTimeOfDay(date = getGateNexaNow()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const h = String(ist.getUTCHours()).padStart(2, '0');
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─────────────────────────────────────────────────────────────
// Slot definitions (Asia/Kolkata)
// ─────────────────────────────────────────────────────────────
const SLOTS = ['morning', 'late_morning', 'afternoon', 'evening', 'night'];
const SLOT_HOURS_IST = {
  morning: 8,
  late_morning: 11,
  afternoon: 15,
  evening: 19,
  night: 21,
};
// Window in minutes after the slot's hour during which the slot is "due".
const SLOT_WINDOW_MINUTES = 60;

function isNotificationSlotDue(slot, now = getGateNexaNow()) {
  const hour = SLOT_HOURS_IST[slot];
  if (hour === undefined) return false;
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const slotStart = new Date(ist);
  slotStart.setUTCHours(hour, 0, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + SLOT_WINDOW_MINUTES * 60 * 1000);
  return ist >= slotStart && ist < slotEnd;
}

// ─────────────────────────────────────────────────────────────
// Deterministic key generation
// ─────────────────────────────────────────────────────────────
function getNotificationKey(userId, type, dateKey, slot) {
  // Normalize userId — ObjectId has toString, strings are passed through.
  const uid = (userId && userId.toString) ? userId.toString() : String(userId);
  return `${uid}:${dateKey}:${slot}:${type}`;
}

// ─────────────────────────────────────────────────────────────
// Prefs management
// ─────────────────────────────────────────────────────────────
async function ensurePrefs(userId) {
  if (!userId) throw new Error('ensurePrefs requires a userId');
  const uid = userId.toString();
  let prefs = await NotificationPrefs.findOne({ user: uid });
  if (!prefs) {
    prefs = await NotificationPrefs.create({
      user: uid,
      enabled: true,
      maxPerDay: 5,
      todayCount: 0,
      todayDate: getGateNexaDateKey(),
    });
  }
  // Reset daily counter if the IST date has rolled over.
  const todayKey = getGateNexaDateKey();
  if (prefs.todayDate !== todayKey) {
    prefs.todayDate = todayKey;
    prefs.todayCount = 0;
    await prefs.save();
  }
  return prefs;
}

// ─────────────────────────────────────────────────────────────
// Quiet hours check
// ─────────────────────────────────────────────────────────────
function isInQuietHours(prefs, timeStr) {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;
  const toMinutes = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const cur = toMinutes(timeStr);
  const start = toMinutes(prefs.quietHoursStart);
  const end = toMinutes(prefs.quietHoursEnd);
  // Window may wrap midnight (e.g. 22:00 → 07:00).
  if (start <= end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

// ─────────────────────────────────────────────────────────────
// Content bank (concise, useful, deterministic per day)
// ─────────────────────────────────────────────────────────────
const CONTENT = {
  morning: [
    { type: 'morning_mission', title: 'Good morning — let\u2019s start strong',
      message: 'Open today\u2019s study plan and complete your first session before 10 AM.',
      action: '/dashboard' },
    { type: 'today_focus', title: 'Today\u2019s focus',
      message: 'Pick the highest-weightage topic you haven\u2019t finished yet.',
      action: '/topics' },
    { type: 'morning_brief', title: 'Daily briefing ready',
      message: 'Your AI-curated daily content is now available. Take 5 minutes to review.',
      action: '/dashboard' },
  ],
  late_morning: [
    { type: 'motivation', title: 'Keep the momentum',
      message: 'You\u2019ve already started today — that\u2019s the hardest part. Push for one more hour.',
      action: '/dashboard' },
    { type: 'learning_suggestion', title: 'Try a new learning angle',
      message: 'Struggling with a concept? Watch a short video or read a summary before re-reading notes.',
      action: '/resources' },
    { type: 'success_story', title: 'Topper\u2019s tip',
      message: 'Most toppers revise the previous day\u2019s topics before starting new ones.',
      action: '/revision' },
    { type: 'campus_insight', title: 'Campus insight',
      message: 'IIT and NIT shortlisting uses normalized scores — accuracy matters more than volume.',
      action: '/analytics' },
  ],
  afternoon: [
    { type: 'ai_recommendation', title: 'AI has a suggestion for you',
      message: 'Based on your weak areas, a 30-minute targeted drill would help today.',
      action: '/ai-mentor' },
    { type: 'roadmap_suggestion', title: 'Roadmap check-in',
      message: 'You\u2019re slightly behind on weekly hours. Consider a focused 2-hour block this afternoon.',
      action: '/study-planner' },
    { type: 'dsa_challenge', title: 'DSA micro-challenge',
      message: 'Solve 2 medium-difficulty array problems before your next break.',
      action: '/pyq' },
    { type: 'learning_suggestion', title: 'Switch study mode',
      message: 'If you\u2019ve been reading for an hour, switch to practice questions for better retention.',
      action: '/pyq' },
  ],
  evening: [
    { type: 'revision_reminder', title: 'Revision time',
      message: 'Revisit topics you studied yesterday — spaced repetition beats re-reading.',
      action: '/revision' },
    { type: 'focus_reminder', title: 'One focused block left',
      message: 'A 45-minute deep-work block now will close the day strong.',
      action: '/productivity' },
    { type: 'planner_reminder', title: 'Plan tomorrow tonight',
      message: 'Spend 5 minutes planning tomorrow\u2019s topics before you wind down.',
      action: '/study-planner' },
    { type: 'discovery', title: 'Discover a new resource',
      message: 'Browse today\u2019s curated resources — there\u2019s a 90-second read that may surprise you.',
      action: '/resources' },
  ],
  night: [
    { type: 'daily_inspiration', title: 'One thought before bed',
      message: 'Consistency compounds. Tomorrow\u2019s success is built by tonight\u2019s rest.',
      action: '/dashboard' },
    { type: 'quick_fact', title: 'Quick GATE fact',
      message: 'General Aptitude contributes 15 marks — don\u2019t leave easy points on the table.',
      action: '/dashboard' },
    { type: 'daily_insight', title: 'Your daily insight',
      message: 'You studied focused topics today. Tomorrow, balance with one weak-area drill.',
      action: '/analytics' },
    { type: 'weekly_progress', title: 'Weekly progress snapshot',
      message: 'Check your week-at-a-glance and set a small goal for tomorrow.',
      action: '/analytics' },
  ],
};

const ONBOARDING = [
  { type: 'welcome', title: 'Welcome to GateNexa',
    message: 'Your personalized GATE 2027 prep journey starts here. Tap to explore the dashboard.',
    action: '/dashboard' },
  { type: 'tour_dashboard', title: 'Tour your dashboard',
    message: 'Your dashboard tracks streaks, daily targets, and today\u2019s plan in one place.',
    action: '/dashboard' },
  { type: 'set_target', title: 'Set your daily target',
    message: 'A clear daily target turns effort into progress. Configure yours in 30 seconds.',
    action: '/settings' },
];

// Event templates — type → notification content
const EVENT_TEMPLATES = {
  first_topic: {
    title: 'First topic completed \uD83C\uDF89',
    message: 'You finished your first topic. Momentum starts now.',
    action: '/dashboard',
  },
  streak_7: {
    title: '7-day streak unlocked \uD83D\uDD25',
    message: 'A full week of consistent prep. Keep the chain alive.',
    action: '/dashboard',
  },
  pyq_100: {
    title: '100 PYQs solved \uD83C\uDFC6',
    message: 'You\u2019ve crossed the 100-PYQ mark. Exam-pattern fluency unlocked.',
    action: '/pyq',
  },
  first_mock: {
    title: 'First mock test done \uD83C\uDFAF',
    message: 'Your first mock is logged. Use the analysis to plan the next one.',
    action: '/mocks',
  },
  hours_50: {
    title: '50 study hours this month',
    message: 'Half a hundred hours invested. That\u2019s how ranks are built.',
    action: '/analytics',
  },
  level_up: {
    title: 'Level up!',
    message: 'You\u2019ve reached a new level. New challenges await.',
    action: '/dashboard',
  },
};

// Deterministic rotation so the user gets a different item each day/slot,
// but the same inputs always pick the same content.
function pickDailyContent(slot, dateKey) {
  const list = CONTENT[slot] || [];
  if (list.length === 0) return null;
  // Hash dateKey+slot to a stable index.
  let h = 0;
  const s = `${dateKey}:${slot}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

// ─────────────────────────────────────────────────────────────
// Core write path (dedupe-safe)
// ─────────────────────────────────────────────────────────────
async function createNotificationDoc({ userId, type, title, message, description = '',
  category = 'daily', priority = 'normal', scheduledAt, expiresAt = null,
  metadata = {}, action = null, notificationKey }) {
  if (!userId) throw new Error('userId required');
  if (!notificationKey) throw new Error('notificationKey required');
  try {
    const doc = await Notification.create({
      user: userId,
      type,
      title,
      message,
      description,
      category,
      priority,
      scheduledAt: scheduledAt || getGateNexaNow(),
      expiresAt,
      metadata,
      action,
      notificationKey,
    });
    return { created: true, notification: doc };
  } catch (err) {
    if (err && err.code === 11000) {
      // Duplicate key — already exists.
      const existing = await Notification.findOne({ user: userId, notificationKey });
      return { created: false, notification: existing, duplicate: true };
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// Daily generation
// ─────────────────────────────────────────────────────────────
async function generateDailyNotifications(userId, opts = {}) {
  const { slot, dateKey: dateKeyOverride, schedulerRun = false } = opts;
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId.toString())
    : userId;

  const prefs = await ensurePrefs(userObjectId);
  if (!prefs.enabled) {
    return { created: 0, skipped: 0, reason: 'disabled' };
  }
  const todayKey = dateKeyOverride || getGateNexaDateKey();
  const timeStr = getGateNexaTimeOfDay();
  if (isInQuietHours(prefs, timeStr)) {
    return { created: 0, skipped: 0, reason: 'quiet_hours' };
  }

  // Reset counter if date has rolled.
  if (prefs.todayDate !== todayKey) {
    prefs.todayDate = todayKey;
    prefs.todayCount = 0;
  }

  const slots = slot ? [slot] : SLOTS;
  let created = 0;
  let skipped = 0;

  for (const s of slots) {
    if (prefs.todayCount >= prefs.maxPerDay) {
      skipped++;
      continue;
    }
    const content = pickDailyContent(s, todayKey);
    if (!content) {
      skipped++;
      continue;
    }
    const key = getNotificationKey(userObjectId, content.type, todayKey, s);
    // Quick existence check — also serves as a safety net if the index
    // is unavailable (e.g. mock mode).
    const existing = await Notification.findOne({ user: userObjectId, notificationKey: key });
    if (existing) {
      skipped++;
      continue;
    }
    const res = await createNotificationDoc({
      userId: userObjectId,
      type: content.type,
      title: content.title,
      message: content.message,
      description: '',
      category: 'daily',
      priority: 'normal',
      scheduledAt: getGateNexaNow(),
      action: content.action,
      notificationKey: key,
      metadata: { slot: s, dateKey: todayKey, schedulerRun },
    });
    if (res.created) {
      created++;
      prefs.todayCount += 1;
      prefs.lastSentAt = getGateNexaNow();
    } else {
      skipped++;
    }
  }
  await prefs.save();
  return { created, skipped };
}

// ─────────────────────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────────────────────
async function generateOnboardingNotifications(userId, opts = {}) {
  const { dateKey: dateKeyOverride } = opts;
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId.toString())
    : userId;

  const prefs = await ensurePrefs(userObjectId);
  if (!prefs.enabled) return { created: 0, skipped: 0, reason: 'disabled' };

  const todayKey = dateKeyOverride || getGateNexaDateKey();
  let created = 0;
  let skipped = 0;

  for (const item of ONBOARDING) {
    const key = getNotificationKey(userObjectId, item.type, todayKey, 'onboarding');
    const existing = await Notification.findOne({ user: userObjectId, notificationKey: key });
    if (existing) { skipped++; continue; }
    const res = await createNotificationDoc({
      userId: userObjectId,
      type: item.type,
      title: item.title,
      message: item.message,
      description: '',
      category: 'onboarding',
      priority: 'normal',
      scheduledAt: getGateNexaNow(),
      action: item.action,
      notificationKey: key,
      metadata: { dateKey: todayKey, slot: 'onboarding' },
    });
    if (res.created) created++; else skipped++;
  }
  return { created, skipped };
}

// ─────────────────────────────────────────────────────────────
// Event notifications
// ─────────────────────────────────────────────────────────────
async function generateEventNotification(userId, eventType, context = {}) {
  if (!EVENT_TEMPLATES[eventType]) {
    throw new Error(`Unknown event type: ${eventType}`);
  }
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId.toString())
    : userId;

  const prefs = await ensurePrefs(userObjectId);
  if (!prefs.enabled) return { created: 0, skipped: 0, reason: 'disabled' };

  // Event keys use eventType as "slot" so they don't collide with daily slots.
  const todayKey = getGateNexaDateKey();
  const key = getNotificationKey(userObjectId, eventType, todayKey, 'event');
  const existing = await Notification.findOne({ user: userObjectId, notificationKey: key });
  if (existing) return { created: 0, skipped: 1, reason: 'duplicate_event' };

  const tpl = EVENT_TEMPLATES[eventType];
  const res = await createNotificationDoc({
    userId: userObjectId,
    type: eventType,
    title: tpl.title,
    message: tpl.message,
    description: '',
    category: 'event',
    priority: 'high',
    scheduledAt: getGateNexaNow(),
    action: tpl.action,
    notificationKey: key,
    metadata: { ...context, dateKey: todayKey, slot: 'event' },
  });
  return res.created ? { created: 1, skipped: 0 } : { created: 0, skipped: 1 };
}

// ─────────────────────────────────────────────────────────────
// Manual fallback trigger (used by API to lazily fill today's
// eligible slot if the scheduler hasn't run yet — only inserts
// at most one slot).
// ─────────────────────────────────────────────────────────────
async function generateAndDeliver(userId, opts = {}) {
  const { slot } = opts;
  if (slot) return generateDailyNotifications(userId, { slot });
  // No slot — find the current IST slot and only fill it.
  const now = getGateNexaNow();
  const todayKey = getGateNexaDateKey();
  const timeStr = getGateNexaTimeOfDay();
  // Pick the latest slot whose hour is <= current IST hour.
  const hour = Number(timeStr.split(':')[0]);
  const orderedSlots = ['morning', 'late_morning', 'afternoon', 'evening', 'night'];
  let eligible = null;
  for (const s of orderedSlots) {
    if (SLOT_HOURS_IST[s] <= hour) eligible = s;
  }
  if (!eligible) eligible = 'morning';
  return generateDailyNotifications(userId, { slot: eligible, dateKey: todayKey });
}

// ─────────────────────────────────────────────────────────────
// Test-only hooks (do not use in production code)
// ─────────────────────────────────────────────────────────────
function __setTestNow(dateOrIso) {
  if (dateOrIso === null || dateOrIso === undefined) {
    __testNow = null;
    return;
  }
  __testNow = dateOrIso instanceof Date ? dateOrIso.getTime() : new Date(dateOrIso).getTime();
}
function __resetTestNow() { __testNow = null; }
function __isTestMode() { return process.env.NODE_ENV === 'test' || __testNow !== null; }

module.exports = {
  // core
  ensurePrefs,
  generateAndDeliver,
  generateDailyNotifications,
  generateOnboardingNotifications,
  generateEventNotification,
  // helpers
  getNotificationKey,
  getGateNexaNow,
  getGateNexaDateKey,
  getGateNexaTimeOfDay,
  isNotificationSlotDue,
  isInQuietHours,
  pickDailyContent,
  // constants
  SLOTS,
  SLOT_HOURS_IST,
  EVENT_TEMPLATES,
  // test hooks
  __setTestNow,
  __resetTestNow,
  __isTestMode,
};
