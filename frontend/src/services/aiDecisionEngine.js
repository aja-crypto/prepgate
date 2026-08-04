/**
 * AI Decision Engine — Orchestration Layer
 * Every user action (session, mock, topic completion) flows through here.
 * Updates all engines in sequence, then emits new CoachState.
 *
 * Event flow:
 *   Action → DecisionEngine.process(event) → Confidence → Prediction → Revision → Review → Notifications → CoachState
 */

import { calculateConfidence } from './aiConfidenceEngine';
import { predictScore, predictCompletion } from './aiPredictiveEngine';
import { getRevisionQueue } from './aiRevisionEngine';
import { generateWeeklyReview, generateMonthlyReview } from './aiReviewGenerator';

const EVENT_TYPES = {
  SESSION_COMPLETED: 'session_completed',
  MOCK_COMPLETED: 'mock_completed',
  TOPIC_COMPLETED: 'topic_completed',
  PYQ_SOLVED: 'pyq_solved',
  REVISION_DONE: 'revision_done',
  DAY_START: 'day_start',
  WEEK_START: 'week_start',
  MONTH_START: 'month_start',
};

class DecisionEngine {
  constructor() {
    this.lastProcessed = null;
    this.eventLog = [];
  }

  /**
   * Process any user action. Returns the updated decision output.
   */
  process(eventType, data = {}) {
    const timestamp = new Date().toISOString();
    this.eventLog.push({ eventType, timestamp, data: { ...data } });
    if (this.eventLog.length > 100) this.eventLog.shift();

    const state = data.state || {};
    const output = {
      timestamp,
      eventType,
      confidence: null,
      prediction: null,
      revision: null,
      review: null,
      notifications: [],
    };

    // 1. Update confidence for any action with data
    output.confidence = calculateConfidence(null, {
      pyqs: state.pyqs || [],
      mocks: state.mocks || [],
      studyStats: state.studyStats || {},
      topics: state.topics || [],
    });

    // 2. Update predictions for session/mock/topic events
    if ([EVENT_TYPES.SESSION_COMPLETED, EVENT_TYPES.MOCK_COMPLETED, EVENT_TYPES.TOPIC_COMPLETED].includes(eventType)) {
      output.prediction = predictScore({
        pyqs: state.pyqs || [],
        mocks: state.mocks || [],
        studyStats: state.studyStats || {},
        subjects: state.subjects || [],
      });
      output.prediction.completion = predictCompletion(state.subjects || [], state.dailyHours || 4);
    }

    // 3. Update revision queue after session/PYQ/revision
    if ([EVENT_TYPES.SESSION_COMPLETED, EVENT_TYPES.PYQ_SOLVED, EVENT_TYPES.REVISION_DONE].includes(eventType)) {
      output.revision = getRevisionQueue(state.topics || [], state.pyqs || []);
    }

    // 4. Generate review on week/month boundaries
    if (eventType === EVENT_TYPES.WEEK_START) {
      output.review = generateWeeklyReview({
        studyStats: state.studyStats || {},
        pyqs: state.pyqs || [],
        mocks: state.mocks || [],
        subjects: state.subjects || [],
        gateFeatures: state.gateFeatures || {},
        history: state.history || [],
      });
    }
    if (eventType === EVENT_TYPES.MONTH_START) {
      output.review = generateMonthlyReview({
        studyStats: state.studyStats || {},
        pyqs: state.pyqs || [],
        mocks: state.mocks || [],
        subjects: state.subjects || [],
        gateFeatures: state.gateFeatures || {},
        history: state.history || [],
      });
    }

    // 5. Generate notifications based on state
    output.notifications = this._generateNotifications(eventType, output, state);

    this.lastProcessed = output;
    return output;
  }

  _generateNotifications(eventType, output, state) {
    const notes = [];
    const streak = state.gateFeatures?.streak?.current || 0;

    if (eventType === EVENT_TYPES.SESSION_COMPLETED) {
      notes.push({ type: 'session', text: 'Session completed. Progress updated.', icon: '✅' });
      if (streak > 0 && streak % 7 === 0) {
        notes.push({ type: 'streak', text: `🔥 ${streak}-day streak! Keep going!`, icon: '🔥' });
      }
    }
    if (eventType === EVENT_TYPES.MOCK_COMPLETED) {
      notes.push({ type: 'mock', text: 'Mock recorded. Recommendations updated.', icon: '📊' });
    }
    if (output.revision?.overdue > 0) {
      notes.push({ type: 'revision', text: `${output.revision.overdue} topics need revision.`, icon: '🔄' });
    }
    if (output.review?.recommendations?.length > 0) {
      notes.push({ type: 'recommendation', text: output.review.recommendations[0], icon: '💡' });
    }

    return notes;
  }

  getEventLog() {
    return this.eventLog;
  }

  getLastProcessed() {
    return this.lastProcessed;
  }
}

// Singleton
const decisionEngine = new DecisionEngine();

// Backward compatibility — wrap process() as makeDecisions for AiMentorTracker
export function makeDecisions(state) {
  const result = decisionEngine.process(EVENT_TYPES.DAY_START, { state });
  return {
    roadmap: result.prediction,
    recommendations: [],
    notifications: result.notifications,
    confidence: result.confidence,
    revision: result.revision,
  };
}

export { decisionEngine as default, EVENT_TYPES };
