const listeners = new Map();
const history = [];
const MAX_HISTORY = 500;

export const EVENTS = {
  // Profile
  PROFILE_UPDATED: 'profile:updated',
  ONBOARDING_COMPLETED: 'profile:onboarding_completed',
  STUDY_GOAL_UPDATED: 'profile:study_goal_updated',
  DAILY_HOURS_UPDATED: 'profile:daily_hours_updated',
  TARGET_AIR_UPDATED: 'profile:target_air_updated',
  PREPARATION_YEAR_UPDATED: 'profile:preparation_year_updated',

  // Dashboard
  LOGIN: 'dashboard:login',
  STUDY_HOURS_UPDATED: 'dashboard:study_hours_updated',
  STREAK_UPDATED: 'dashboard:streak_updated',
  DAILY_GOAL_UPDATED: 'dashboard:daily_goal_updated',
  OVERALL_PROGRESS_UPDATED: 'dashboard:overall_progress_updated',

  // Topics
  TOPIC_STARTED: 'topics:topic_started',
  TOPIC_COMPLETED: 'topics:topic_completed',
  REVISION_COMPLETED: 'topics:revision_completed',
  COMPLETION_PERCENTAGE_CHANGED: 'topics:completion_pct_changed',
  CURRENT_TOPIC_CHANGED: 'topics:current_topic_changed',

  // Learning Hub
  VIDEO_WATCHED: 'learning:video_watched',
  VIDEO_COMPLETED: 'learning:video_completed',
  VIDEO_SKIPPED: 'learning:video_skipped',
  NOTES_OPENED: 'learning:notes_opened',
  NOTES_COMPLETED: 'learning:notes_completed',
  PDF_OPENED: 'learning:pdf_opened',
  REVISION_CLICKED: 'learning:revision_clicked',
  TOPIC_COMPLETED_FROM_HUB: 'learning:topic_completed',

  // PYQs
  PYQ_SOLVED: 'pyq:solved',
  PYQ_CORRECT: 'pyq:correct',
  PYQ_WRONG: 'pyq:wrong',
  PYQ_SKIPPED: 'pyq:skipped',
  ACCURACY_CHANGED: 'pyq:accuracy_changed',
  TOPIC_ACCURACY_CHANGED: 'pyq:topic_accuracy_changed',

  // Predictor
  PREDICTED_AIR_UPDATED: 'predictor:predicted_air_updated',
  PREDICTED_MARKS_UPDATED: 'predictor:predicted_marks_updated',
  DREAM_COLLEGE_UPDATED: 'predictor:dream_college_updated',
  ADMISSION_REPORT_VIEWED: 'predictor:admission_report_viewed',
};

export function publish(event, data = {}) {
  const handlers = listeners.get(event);
  if (handlers) {
    handlers.forEach(fn => {
      try { fn(data); } catch (e) { console.error(`[AiEvent] Handler error for ${event}:`, e); }
    });
  }
  history.push({ event, data, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.shift();
}

export function subscribe(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => unsubscribe(event, fn);
}

export function subscribeMultiple(events, fn) {
  const unsubs = events.map(e => subscribe(e, fn));
  return () => unsubs.forEach(u => u());
}

export function unsubscribe(event, fn) {
  const handlers = listeners.get(event);
  if (handlers) handlers.delete(fn);
}

export function getEventHistory(event) {
  if (event) return history.filter(h => h.event === event);
  return [...history];
}

export function clearHistory() {
  history.length = 0;
}
