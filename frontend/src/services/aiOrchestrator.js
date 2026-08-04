import { subscribe, subscribeMultiple, publish, EVENTS } from './aiEventSystem';
import { recordEvent, enrichWithMemory } from './aiMemoryService';
import { enrichWithAnalytics } from './aiAnalyticsService';
import { enrichWithKnowledge } from './aiKnowledgeBase';
import decisionEngine, { EVENT_TYPES } from './aiDecisionEngine';
import { generateRecommendations } from './aiRecommendationEngine';
import { computeRoadmap } from './aiRoadmapEngine';
import { generateNotificationsFromState, createNotification } from './aiNotificationService';

let dataProviders = {};
let stateSubscribers = new Set();
const pipelineLog = [];
const MAX_LOG = 50;

let pipelineState = {
  engineState: {
    currentSubject: null,
    currentTopic: null,
    completedTopics: 0,
    totalTopics: 0,
    completionPct: 0,
    studyHoursToday: 0,
    streak: 0,
    overallProgress: 0,
    pyqsSolved: 0,
    pyqAccuracy: 0,
    videosWatched: 0,
    videosCompleted: 0,
    notesOpened: 0,
    notesCompleted: 0,
    predictedAIR: null,
    predictedMarks: null,
    lastActive: null,
    currentPage: null,
    recentActivity: [],
  },
  unifiedState: null,
  recommendations: [],
  roadmap: null,
  notifications: [],
};

let unsubscribers = [];

function addActivity(type, detail) {
  pipelineState.engineState.recentActivity = [
    { type, detail, timestamp: Date.now() },
    ...pipelineState.engineState.recentActivity.slice(0, 49),
  ];
}

function updateEngineState(partial) {
  pipelineState.engineState = {
    ...pipelineState.engineState,
    ...partial,
    lastActive: Date.now(),
  };
}

function getCurrentData() {
  const profile = dataProviders.getProfile ? dataProviders.getProfile() : {};
  const topics = dataProviders.getTopics ? dataProviders.getTopics() : [];
  const studyStats = dataProviders.getStudyStats ? dataProviders.getStudyStats() : {};
  const gateFeatures = dataProviders.getGateFeatures ? dataProviders.getGateFeatures() : {};
  const pyqs = dataProviders.getPyqs ? dataProviders.getPyqs() : [];
  const mocks = dataProviders.getMocks ? dataProviders.getMocks() : [];
  return { profile, topics, studyStats, gateFeatures, pyqs, mocks };
}

function runPipeline(eventName, eventData) {
  const { profile, topics, studyStats, gateFeatures, pyqs, mocks } = getCurrentData();

  const baseState = {
    profile: { ...profile },
    studyStats: studyStats ? { ...studyStats } : {},
    gateFeatures: gateFeatures ? { ...gateFeatures } : {},
    topics: topics || [],
    pyqs: pyqs || [],
    mocks: mocks || [],
    timestamp: Date.now(),
    memory: null,
    analytics: null,
    knowledge: null,
  };

  const memoryEnrichment = enrichWithMemory(baseState);
  const analyticsEnrichment = enrichWithAnalytics({ ...baseState, memory: memoryEnrichment });
  const stateWithEnrichment = { ...baseState, memory: memoryEnrichment, analytics: analyticsEnrichment };
  const knowledgeEnrichment = enrichWithKnowledge(stateWithEnrichment);
  const enrichedState = { ...stateWithEnrichment, knowledge: knowledgeEnrichment };

  const decisionOutput = decisionEngine.process(eventName, {
    state: {
      ...enrichedState,
      pyqs: pyqs,
      mocks: mocks,
      studyStats: studyStats,
      topics: topics,
      subjects: profile.completedSubjects || [],
      dailyHours: profile.dailyStudyHours || 4,
      gateFeatures: gateFeatures,
    },
  });

  const recommendations = generateRecommendations(
    profile,
    pipelineState.engineState,
    topics || [],
    pyqs || [],
    studyStats || {},
    gateFeatures || {}
  );

  const roadmap = computeRoadmap(profile, studyStats, topics || []);

  const stateWithDecisions = {
    ...enrichedState,
    confidence: decisionOutput.confidence,
    prediction: decisionOutput.prediction,
    revision: decisionOutput.revision,
    review: decisionOutput.review,
  };

  const aiNotifications = generateNotificationsFromState(stateWithDecisions, roadmap, recommendations);
  const allNotifications = [...(decisionOutput.notifications || [])];

  pipelineState = {
    ...pipelineState,
    unifiedState: stateWithDecisions,
    recommendations,
    roadmap,
    notifications: allNotifications,
  };

  pipelineLog.push({ event: eventName, timestamp: Date.now() });
  if (pipelineLog.length > MAX_LOG) pipelineLog.shift();

  publish('ai:state_updated', {
    unifiedState: pipelineState.unifiedState,
    recommendations: pipelineState.recommendations,
    roadmap: pipelineState.roadmap,
    notifications: pipelineState.notifications,
    engineState: pipelineState.engineState,
  });

  notifySubscribers();
}

function notifySubscribers() {
  const snapshot = {
    engineState: { ...pipelineState.engineState },
    unifiedState: pipelineState.unifiedState ? { ...pipelineState.unifiedState } : null,
    recommendations: [...pipelineState.recommendations],
    roadmap: pipelineState.roadmap ? { ...pipelineState.roadmap } : null,
    notifications: [...pipelineState.notifications],
  };
  stateSubscribers.forEach(fn => {
    try { fn(snapshot); } catch (e) { console.error('[Orchestrator] Subscriber error:', e); }
  });
}

export function setDataProviders(providers) {
  dataProviders = providers;
}

export function onStateChange(fn) {
  stateSubscribers.add(fn);
  return () => stateSubscribers.delete(fn);
}

export function getState() {
  return {
    engineState: { ...pipelineState.engineState },
    unifiedState: pipelineState.unifiedState ? { ...pipelineState.unifiedState } : null,
    recommendations: [...pipelineState.recommendations],
    roadmap: pipelineState.roadmap ? { ...pipelineState.roadmap } : null,
    notifications: [...pipelineState.notifications],
  };
}

export function getRecentPipelineLog(limit = 10) {
  return pipelineLog.slice(-limit);
}

export function initOrchestrator(providers) {
  if (unsubscribers.length > 0) return;
  setDataProviders(providers);

  unsubscribers.push(subscribe(EVENTS.LOGIN, () => {
    addActivity('login', 'User logged in');
    runPipeline(EVENT_TYPES.DAY_START, {});
  }));

  unsubscribers.push(subscribe(EVENTS.TOPIC_STARTED, (data) => {
    updateEngineState({ currentSubject: data.subject, currentTopic: data.topicName });
    addActivity('topic_started', `Started ${data.topicName}`);
    recordEvent(EVENTS.TOPIC_STARTED, data);
    runPipeline(EVENT_TYPES.TOPIC_COMPLETED, { data });
  }));

  unsubscribers.push(subscribe(EVENTS.TOPIC_COMPLETED, (data) => {
    const dp = dataProviders;
    const topics = dp.getTopics ? dp.getTopics() : [];
    const done = topics.filter(t => {
      const p = t.progress || {};
      return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every(k => p[k]);
    }).length;
    updateEngineState({ completedTopics: done, totalTopics: topics.length, completionPct: topics.length ? Math.round((done / topics.length) * 100) : 0 });
    addActivity('topic_completed', `${done}/${topics.length} topics done`);
    recordEvent(EVENTS.TOPIC_COMPLETED, data);
    runPipeline(EVENT_TYPES.TOPIC_COMPLETED, { data, done, total: topics.length });
  }));

  unsubscribers.push(subscribe(EVENTS.REVISION_COMPLETED, (data) => {
    addActivity('revision_completed', `Revision ${data.revisionNumber} for ${data.topicName}`);
    recordEvent(EVENTS.REVISION_COMPLETED, data);
    runPipeline(EVENT_TYPES.REVISION_DONE, { data });
  }));

  unsubscribers.push(subscribe(EVENTS.STUDY_HOURS_UPDATED, (data) => {
    updateEngineState({ studyHoursToday: data.hours || 0 });
    recordEvent(EVENTS.STUDY_HOURS_UPDATED, data);
    runPipeline(EVENT_TYPES.SESSION_COMPLETED, { data });
  }));

  unsubscribers.push(subscribe(EVENTS.STREAK_UPDATED, (data) => {
    updateEngineState({ streak: data.streak || 0 });
    recordEvent('dashboard:streak_updated', data);
  }));

  unsubscribers.push(subscribe(EVENTS.OVERALL_PROGRESS_UPDATED, (data) => {
    updateEngineState({ overallProgress: data.progress || 0 });
    recordEvent('dashboard:overall_progress_updated', data);
  }));

  unsubscribers.push(subscribe(EVENTS.VIDEO_WATCHED, (data) => {
    updateEngineState({ videosWatched: (pipelineState.engineState.videosWatched || 0) + 1 });
    addActivity('video_watched', `Watched ${data.title || 'a video'}`);
    recordEvent(EVENTS.VIDEO_WATCHED, data);
  }));

  unsubscribers.push(subscribe(EVENTS.VIDEO_COMPLETED, (data) => {
    updateEngineState({ videosCompleted: (pipelineState.engineState.videosCompleted || 0) + 1 });
    addActivity('video_completed', `Completed ${data.title || 'a video'}`);
    recordEvent(EVENTS.VIDEO_COMPLETED, data);
    runPipeline(EVENT_TYPES.SESSION_COMPLETED, { data });
  }));

  unsubscribers.push(subscribe(EVENTS.NOTES_OPENED, () => {
    updateEngineState({ notesOpened: (pipelineState.engineState.notesOpened || 0) + 1 });
    addActivity('notes_opened', 'Opened notes');
    recordEvent(EVENTS.NOTES_OPENED, {});
  }));

  unsubscribers.push(subscribe(EVENTS.NOTES_COMPLETED, () => {
    updateEngineState({ notesCompleted: (pipelineState.engineState.notesCompleted || 0) + 1 });
    addActivity('notes_completed', 'Completed notes');
    recordEvent(EVENTS.NOTES_COMPLETED, {});
  }));

  unsubscribers.push(subscribe(EVENTS.PDF_OPENED, () => {
    addActivity('pdf_opened', 'Opened a PDF');
    recordEvent(EVENTS.PDF_OPENED, {});
  }));

  unsubscribers.push(subscribe(EVENTS.PYQ_SOLVED, (data) => {
    const stats = data.stats || {};
    updateEngineState({
      pyqsSolved: (pipelineState.engineState.pyqsSolved || 0) + 1,
      pyqAccuracy: stats.overallAccuracy || pipelineState.engineState.pyqAccuracy,
    });
    addActivity('pyq_solved', data.correct ? 'Solved PYQ correctly' : 'Solved PYQ incorrectly');
    recordEvent(EVENTS.PYQ_SOLVED, data);
    runPipeline(EVENT_TYPES.PYQ_SOLVED, { data });
  }));

  unsubscribers.push(subscribe(EVENTS.PYQ_CORRECT, (data) => {
    addActivity('pyq_correct', 'Correct PYQ answer');
    recordEvent(EVENTS.PYQ_CORRECT, data);
  }));

  unsubscribers.push(subscribe(EVENTS.PYQ_WRONG, (data) => {
    addActivity('pyq_wrong', 'Wrong PYQ answer');
    recordEvent(EVENTS.PYQ_WRONG, data);
  }));

  unsubscribers.push(subscribe(EVENTS.ACCURACY_CHANGED, (data) => {
    updateEngineState({ pyqAccuracy: data.accuracy || 0 });
    addActivity('accuracy_changed', `Accuracy at ${Math.round(data.accuracy || 0)}%`);
    recordEvent(EVENTS.ACCURACY_CHANGED, data);
  }));

  unsubscribers.push(subscribe(EVENTS.PREDICTED_AIR_UPDATED, (data) => {
    updateEngineState({ predictedAIR: data.air });
    addActivity('predicted_air', `Predicted AIR: ${data.air}`);
    recordEvent(EVENTS.PREDICTED_AIR_UPDATED, data);
  }));

  unsubscribers.push(subscribe(EVENTS.PREDICTED_MARKS_UPDATED, (data) => {
    updateEngineState({ predictedMarks: data.marks });
    addActivity('predicted_marks', `Predicted marks: ${data.marks}`);
    recordEvent(EVENTS.PREDICTED_MARKS_UPDATED, data);
  }));

  unsubscribers.push(subscribe(EVENTS.PROFILE_UPDATED, (data) => {
    if (data.targetAIR) updateEngineState({ predictedAIR: data.targetAIR });
    addActivity('profile_updated', 'Profile updated');
    recordEvent(EVENTS.PROFILE_UPDATED, data);
  }));

  unsubscribers.push(subscribe(EVENTS.ONBOARDING_COMPLETED, (data) => {
    addActivity('onboarding_completed', 'Onboarding completed');
    recordEvent(EVENTS.ONBOARDING_COMPLETED, data);
    runPipeline(EVENT_TYPES.DAY_START, {});
  }));

  runPipeline(EVENT_TYPES.DAY_START, {});
}

export function destroyOrchestrator() {
  unsubscribers.forEach(u => u());
  unsubscribers = [];
}
