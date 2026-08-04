const STORAGE_KEY = 'gatenexa_ai_memory';
const MAX_EVENTS = 1000;
const SNAPSHOT_KEY = 'gatenexa_coaching_snapshots';
const MAX_SNAPSHOTS = 20;
const REVISION_KEY = 'gatenexa_revision_history';
const PYQ_HISTORY_KEY = 'gatenexa_pyq_history';
const LEARNING_KEY = 'gatenexa_learning_history';

let memoryCache = null;

function load() {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? JSON.parse(raw) : { events: [], sessions: [] };
  } catch {
    memoryCache = { events: [], sessions: [] };
  }
  return memoryCache;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {}
}

function loadSnapshots() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
  } catch {}
}

export function recordEvent(event, data) {
  const store = load();
  store.events.push({ event, data, timestamp: Date.now() });
  if (store.events.length > MAX_EVENTS) store.events.splice(0, store.events.length - MAX_EVENTS);
  persist();

  if (event === 'dashboard:study_hours_updated') {
    recordCoachingSnapshot();
  }
}

export function recordSession(data) {
  const store = load();
  store.sessions.push({ ...data, timestamp: Date.now() });
  if (store.sessions.length > 100) store.sessions.shift();
  persist();
}

export function getEvents(event, limit = 50) {
  const store = load();
  const filtered = event ? store.events.filter(e => e.event === event) : store.events;
  return filtered.slice(-limit);
}

export function getEventsSince(timestamp, event) {
  const store = load();
  return store.events.filter(e => e.timestamp > timestamp && (!event || e.event === event));
}

export function clearMemory() {
  memoryCache = { events: [], sessions: [] };
  persist();
}

function recordCoachingSnapshot() {
  const store = load();
  const snapshots = loadSnapshots();

  const recent = store.events.filter(e => e.timestamp > Date.now() - 86400000);
  const todayHours = recent.filter(e => e.event === 'dashboard:study_hours_updated').reduce((s, e) => s + (e.data.hours || 0), 0);
  const todayTopics = recent.filter(e => e.event === 'topics:topic_started' || e.event === 'topics:topic_completed').length;
  const todayAccuracy = (() => {
    const correct = recent.filter(e => e.event === 'pyq_correct').length;
    const wrong = recent.filter(e => e.event === 'pyq_wrong').length;
    const total = correct + wrong;
    return total > 0 ? Math.round((correct / total) * 100) : null;
  })();

  const today = new Date().toISOString().slice(0, 10);
  const lastSnapshot = snapshots[0];

  if (lastSnapshot && lastSnapshot.date === today) {
    lastSnapshot.studyHours = todayHours;
    lastSnapshot.topicsCovered = todayTopics;
    if (todayAccuracy !== null) lastSnapshot.accuracy = todayAccuracy;
    lastSnapshot.timestamp = Date.now();
  } else if (todayHours > 0) {
    snapshots.unshift({
      date: today,
      studyHours: todayHours,
      topicsCovered: todayTopics,
      accuracy: todayAccuracy,
      completedSubjects: 0,
      totalPyqsSolved: store.events.filter(e => e.event === 'pyq_solved').length,
      timestamp: Date.now(),
    });
    if (snapshots.length > MAX_SNAPSHOTS) snapshots.pop();
  }

  saveSnapshots(snapshots);
}

export function getCoachingTrends() {
  const snapshots = loadSnapshots();
  if (snapshots.length < 2) return null;

  const allHours = snapshots.map(s => s.studyHours);
  const avgHoursLastWeek = allHours.slice(0, Math.min(7, allHours.length)).reduce((s, h) => s + h, 0) / Math.min(7, allHours.length);
  const avgHoursPrevWeek = allHours.length > 7
    ? allHours.slice(7, Math.min(14, allHours.length)).reduce((s, h) => s + h, 0) / Math.min(7, allHours.length - 7)
    : null;

  const recentAccuracies = snapshots.filter(s => s.accuracy !== null).map(s => s.accuracy);
  const accuracyTrend = recentAccuracies.length >= 4
    ? recentAccuracies.slice(0, Math.min(7, recentAccuracies.length)).reduce((s, a) => s + a, 0) / Math.min(7, recentAccuracies.length)
    : null;
  const accuracyPrev = recentAccuracies.length >= 8
    ? recentAccuracies.slice(7, Math.min(14, recentAccuracies.length)).reduce((s, a) => s + a, 0) / Math.min(7, recentAccuracies.length - 7)
    : null;

  return {
    snapshots,
    weeklyTrend: {
      avgHoursPerDay: Math.round(avgHoursLastWeek * 10) / 10,
      previousWeekAvgHours: avgHoursPrevWeek !== null ? Math.round(avgHoursPrevWeek * 10) / 10 : null,
      hoursChange: avgHoursPrevWeek !== null ? Math.round(((avgHoursLastWeek - avgHoursPrevWeek) / avgHoursPrevWeek) * 100) : null,
    },
    accuracyTrend: accuracyTrend !== null ? {
      current: Math.round(accuracyTrend),
      previous: accuracyPrev !== null ? Math.round(accuracyPrev) : null,
      change: accuracyPrev !== null ? Math.round(accuracyTrend - accuracyPrev) : null,
    } : null,
    improvement: {
      studySpeed: 'calculating',
      consistency: allHours.filter(h => h > 0).length / Math.min(30, allHours.length),
      totalActiveDays: snapshots.length,
    },
  };
}

export function recordRevision(topic, method) {
  const store = load();
  const entry = { topic, method: method || 'active_recall', timestamp: Date.now() };
  if (!store.revisions) store.revisions = [];
  store.revisions.push(entry);
  if (store.revisions.length > 200) store.revisions.shift();
  persist();
  return entry;
}

export function getRevisionHistory(topic, limit = 10) {
  const store = load();
  const revisions = (store.revisions || []).filter(r => r.topic === topic);
  return revisions.slice(-limit);
}

export function getRevisionCount(topic) {
  const store = load();
  return (store.revisions || []).filter(r => r.topic === topic).length;
}

export function recordPyqResult(subject, topic, year, correct, difficulty) {
  const store = load();
  if (!store.pyqHistory) store.pyqHistory = [];
  store.pyqHistory.push({ subject, topic, year: year || 0, correct, difficulty: difficulty || 'medium', timestamp: Date.now() });
  if (store.pyqHistory.length > 500) store.pyqHistory.splice(0, store.pyqHistory.length - 500);
  persist();
}

export function getPyqHistory(subject, topic, year) {
  const store = load();
  let results = store.pyqHistory || [];
  if (subject) results = results.filter(r => r.subject === subject);
  if (topic) results = results.filter(r => r.topic === topic);
  if (year) results = results.filter(r => r.year === year);
  return results;
}

export function getPyqAccuracy(subject, topic) {
  const store = load();
  let results = store.pyqHistory || [];
  if (subject) results = results.filter(r => r.subject === subject);
  if (topic) results = results.filter(r => r.topic === topic);
  if (results.length === 0) return null;
  const correct = results.filter(r => r.correct).length;
  return { accuracy: Math.round((correct / results.length) * 100), total: results.length, correct };
}

export function getPyqAccuracyByYear(subject) {
  const store = load();
  const results = (store.pyqHistory || []).filter(r => !subject || r.subject === subject);
  const byYear = {};
  results.forEach(r => {
    if (!byYear[r.year]) byYear[r.year] = { correct: 0, total: 0 };
    byYear[r.year].total++;
    if (r.correct) byYear[r.year].correct++;
  });
  return Object.entries(byYear).map(([year, data]) => ({
    year: Number(year),
    accuracy: Math.round((data.correct / data.total) * 100),
    total: data.total,
    correct: data.correct,
  })).sort((a, b) => b.year - a.year);
}

export function recordLearningResource(subject, type, title) {
  const store = load();
  if (!store.learningHistory) store.learningHistory = [];
  store.learningHistory.push({ subject, type: type || 'video', title, timestamp: Date.now() });
  if (store.learningHistory.length > 200) store.learningHistory.splice(0, store.learningHistory.length - 200);
  persist();
}

export function getLearningHistory(subject, type) {
  const store = load();
  let results = store.learningHistory || [];
  if (subject) results = results.filter(r => r.subject === subject);
  if (type) results = results.filter(r => r.type === type);
  return results.slice(-20);
}

export function enrichWithMemory(studentState) {
  const store = load();
  const days = 30;

  const since = Date.now() - days * 86400000;
  const recent = store.events.filter(e => e.timestamp > since);

  const hoursByDay = {};
  const topicsByDay = {};
  const lastSeenTopics = {};

  recent.forEach(e => {
    const day = new Date(e.timestamp).toISOString().slice(0, 10);
    if (e.event === 'dashboard:study_hours_updated') {
      hoursByDay[day] = (hoursByDay[day] || 0) + (e.data.hours || 0);
    }
    if (e.event === 'topics:topic_started' || e.event === 'topics:topic_completed') {
      topicsByDay[day] = (topicsByDay[day] || 0) + 1;
      if (e.data?.topicName) lastSeenTopics[e.data.topicName] = e.timestamp;
    }
    if (e.event === 'learning:video_watched' && e.data?.title) {
      lastSeenTopics[e.data.title] = e.timestamp;
    }
  });

  const hourEntries = Object.entries(hoursByDay);
  const topicEntries = Object.entries(topicsByDay);
  const avgHours = hourEntries.length > 0
    ? hourEntries.reduce((s, [, h]) => s + h, 0) / hourEntries.length
    : 0;

  const favoriteHourBin = (() => {
    const bins = {};
    recent.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      const bin = hour < 6 ? 'Late Night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      bins[bin] = (bins[bin] || 0) + 1;
    });
    return Object.entries(bins).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Morning';
  })();

  const forgottenTopics = Object.entries(lastSeenTopics)
    .filter(([, ts]) => Date.now() - ts > 14 * 86400000)
    .slice(0, 5)
    .map(([name]) => name);

  const totalHours = hourEntries.reduce((s, [, h]) => s + h, 0);
  const topTopics = topicEntries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

  const dailyHoursArray = hourEntries.map(([, h]) => h);

  const coachingTrends = getCoachingTrends();

  const weeklyTopics = (() => {
    const weekSince = Date.now() - 7 * 86400000;
    const weekEvents = store.events.filter(e => e.timestamp > weekSince && (e.event === 'topics:topic_started' || e.event === 'topics:topic_completed'));
    return weekEvents.length;
  })();

  const recentWrongTopics = (() => {
    const weekSince = Date.now() - 7 * 86400000;
    const wrongEvents = store.events.filter(e => e.timestamp > weekSince && e.event === 'pyq_wrong');
    const topicMap = {};
    wrongEvents.forEach(e => {
      if (e.data?.topicName) topicMap[e.data.topicName] = (topicMap[e.data.topicName] || 0) + 1;
      if (e.data?.subject) topicMap[e.data.subject] = (topicMap[e.data.subject] || 0) + 1;
    });
    return Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  })();

  const skippedSubjects = (() => {
    const skipped = {};
    recent.forEach(e => {
      if (e.event === 'topics:topic_skipped' && e.data?.subjectName) {
        skipped[e.data.subjectName] = (skipped[e.data.subjectName] || 0) + 1;
      }
    });
    return Object.entries(skipped).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  })();

  return {
    averageStudyHours: Math.round(avgHours * 10) / 10,
    totalHours: Math.round(totalHours),
    favoriteStudyTime: favoriteHourBin,
    forgottenTopics,
    recentlyStudied: topTopics,
    activeDays: hourEntries.length,
    topicDays: topicEntries.length,
    recentEventCount: recent.length,
    dailyHoursArray,
    coachingTrends,
    weeklyTopics,
    recentWrongTopics,
    skippedSubjects,
    lastWeekAccuracy: coachingTrends?.accuracyTrend?.current || null,
    accuracyChange: coachingTrends?.accuracyTrend?.change || null,
    hoursChange: coachingTrends?.weeklyTrend?.hoursChange || null,

    pyqHistoryCount: (store.pyqHistory || []).length,
    recentPyqAccuracy: (() => {
      const recent = (store.pyqHistory || []).slice(-50);
      if (recent.length === 0) return null;
      const correct = recent.filter(r => r.correct).length;
      return Math.round((correct / recent.length) * 100);
    })(),
    pyqAccuracyByYear: getPyqAccuracyByYear(),
    revisionCount: (store.revisions || []).length,
    recentRevisions: (store.revisions || []).slice(-10),
    learningResourcesUsed: (store.learningHistory || []).slice(-10),
    learningCount: (store.learningHistory || []).length,
  };
}
