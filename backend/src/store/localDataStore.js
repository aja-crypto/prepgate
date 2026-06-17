// In-memory GATE syllabus when MongoDB is unavailable (local dev)
const crypto = require('crypto');
const { GATE_SYLLABUS, buildTopicDocument } = require('../services/topicContentService');

const subjects = [];
const topics = [];
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '../../data/local_storage.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

let localNotes = []; // In-memory store for notes when MongoDB is down
const localProgress = new Map();
const subjectIdMap = new Map(); // code -> id
const topicIdMap = new Map();   // id -> topic doc

function oid() {
  return crypto.randomBytes(12).toString('hex');
}

// Persistence helpers
function loadLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      localNotes = data.notes || [];
      if (data.progress) {
        Object.entries(data.progress).forEach(([k, v]) => localProgress.set(k, v));
      }
      console.log('--- Local Data Store Loaded from Disk ---');
    }
  } catch (err) {
    console.error('Failed to load local data store:', err.message);
  }
}

let saveTimer = null;
function saveToDisk(immediate = false) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  const doSave = () => {
    try {
      const progressObj = {};
      localProgress.forEach((v, k) => { progressObj[k] = v; });
      const data = JSON.stringify({ notes: localNotes, progress: progressObj }, null, 2);
      fs.writeFileSync(DATA_FILE, data);
      console.log('--- Local Data Saved to Disk ---');
    } catch (err) {
      console.error('Failed to save local data store:', err.message);
    }
  };

  if (immediate) {
    doSave();
  } else {
    saveTimer = setTimeout(doSave, 1000); // Debounce disk writes by 1 second
  }
}

// Flush on exit
process.on('SIGINT', () => {
  saveToDisk(true);
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveToDisk(true);
  process.exit(0);
});

// Initial load
loadLocalData();

// ─────────────────────────────────────────────────────────────
// Local Notes Store
// ─────────────────────────────────────────────────────────────
function saveLocalNote(data) {
  const note = {
    _id: oid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false,
    isFavorite: false,
    viewCount: 0,
    ...data,
  };
  localNotes.unshift(note);
  saveToDisk();
  return note;
}

function getLocalNotes(filter = {}) {
  let list = [...localNotes];
  if (filter.user) list = list.filter(n => String(n.user) === String(filter.user));
  if (filter.subject) list = list.filter(n => n.subject === filter.subject);
  if (filter.isPinned) list = list.filter(n => n.isPinned);
  
  if (filter.search) {
    const s = filter.search.toLowerCase();
    list = list.filter(n => 
      n.title?.toLowerCase().includes(s) || 
      n.content?.toLowerCase().includes(s) ||
      n.ocrText?.toLowerCase().includes(s)
    );
  }
  return list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);
}

function updateLocalNote(id, data) {
  const idx = localNotes.findIndex(n => n._id === id);
  if (idx === -1) return null;
  localNotes[idx] = { ...localNotes[idx], ...data, updatedAt: new Date() };
  saveToDisk();
  return localNotes[idx];
}

function deleteLocalNote(id) {
  localNotes = localNotes.filter(n => n._id !== id);
  saveToDisk();
  return true;
}

function seedLocalSyllabus() {
  if (subjects.length) return;

  Object.entries(GATE_SYLLABUS).forEach(([code, meta]) => {
    const subjectId = oid();
    subjectIdMap.set(code, subjectId);
    subjects.push({
      _id: subjectId,
      name: meta.name,
      code,
      icon: meta.icon,
      color: meta.color,
      weightage: meta.weightage,
      marksRange: meta.marksRange,
      isHighPriority: meta.isHighPriority,
      priorityRank: meta.priorityRank,
      frequentlyAsked: meta.frequentlyAsked,
      importantFormulas: meta.importantFormulas,
      order: meta.order,
      description: meta.description,
      syllabus: meta.units,
      isActive: true,
    });

    meta.topics.forEach((topicName, i) => {
      const doc = buildTopicDocument(code, meta, topicName, i + 1);
      const topicId = oid();
      const topic = {
        _id: topicId,
        ...doc,
        subject: subjectId,
      };
      topics.push(topic);
      topicIdMap.set(topicId, topic);
    });
  });

  console.log(`📚 Local syllabus loaded: ${subjects.length} subjects, ${topics.length} topics (no MongoDB)`);
}

function getSubjects() {
  return subjects;
}

function getSubjectById(id) {
  return subjects.find((s) => s._id === id) || null;
}

function getTopics(filter = {}) {
  let list = topics;
  if (filter.subject) list = list.filter((t) => t.subject === filter.subject || t.subject?._id === filter.subject);
  if (filter.isDefault !== undefined) list = list.filter((t) => t.isDefault === filter.isDefault);
  return list.sort((a, b) => a.order - b.order);
}

function getTopicById(id) {
  const t = topicIdMap.get(id);
  if (!t) return null;
  const sub = getSubjectById(t.subject);
  return { ...t, subject: sub };
}

function enrichWithProgress(list, progressMap = {}) {
  return list.map((t) => {
    const p = progressMap[t._id] || {};
    return {
      ...t,
      subject: getSubjectById(t.subject),
      progress: p.isCompleted !== undefined ? p : {
        isCompleted: false, isBookmarked: false, revisionNeeded: false,
        markedDifficult: false, studyTimeMinutes: 0, revisionCount: 0, accuracy: 0,
      },
    };
  });
}

function getHierarchy(progressMap = {}) {
  return subjects.map((sub) => {
    const subTopics = topics.filter((t) => t.subject === sub._id);
    const enriched = subTopics.map((t) => {
      const p = progressMap[t._id] || {};
      return {
        _id: t._id,
        name: t.name,
        difficulty: t.difficulty,
        weightage: t.weightage,
        order: t.order,
        isCompleted: p.isCompleted || false,
        isBookmarked: p.isBookmarked || false,
        revisionNeeded: p.revisionNeeded || false,
        markedDifficult: p.markedDifficult || false,
        accuracy: p.accuracy || 0,
      };
    });
    const completed = enriched.filter((t) => t.isCompleted).length;
    return {
      ...sub,
      topics: enriched,
      topicCount: enriched.length,
      completedTopics: completed,
      completionPct: enriched.length ? Math.round((completed / enriched.length) * 100) : 0,
    };
  });
}

function updateProgress(userId, topicId, updates) {
  const key = `${userId}:${topicId}`;
  const prev = localProgress.get(key) || {
    isCompleted: false, isBookmarked: false, revisionNeeded: false,
    markedDifficult: false, studyTimeMinutes: 0, revisionCount: 0, accuracy: 0, confidence: 3,
    completionTasks: { lecture: false, notes: false, pyqs: false, revision: false, test: false },
    completionPercentage: 0,
  };
  const next = { ...prev, ...updates };
  if (updates.studyTimeMinutes) next.studyTimeMinutes = (prev.studyTimeMinutes || 0) + updates.studyTimeMinutes;
  localProgress.set(key, next);
  saveToDisk();
  return next;
}

function getProgress(userId, topicId) {
  return localProgress.get(`${userId}:${topicId}`) || null;
}

function getAllProgress(userId) {
  const map = {};
  localProgress.forEach((v, k) => {
    if (k.startsWith(`${userId}:`)) map[k.split(':')[1]] = v;
  });
  return map;
}

// ─── Local Feedback Store ────────────────────────────────────
const localFeedback = new Map();

function getLocalFeedback(userId) {
  return localFeedback.get(String(userId)) || null;
}

function saveLocalFeedback(userId, data) {
  const existing = localFeedback.get(String(userId));
  const doc = existing ? { ...existing, ...data } : { ...data, _id: oid(), user: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (existing) doc.createdAt = existing.createdAt;
  doc.updatedAt = new Date().toISOString();
  localFeedback.set(String(userId), doc);
  saveToDisk();
  return doc;
}

function getAllLocalFeedback() {
  return Array.from(localFeedback.values());
}

// ─── Local Weekly Test Store ────────────────────────────────
const localWeeklyTests = [];
const localTestProgress = new Map();

function seedLocalWeeklyTests(seedData) {
  if (localWeeklyTests.length) return;
  seedData.forEach((t, i) => {
    localWeeklyTests.push({
      _id: oid(),
      ...t,
      pdfUrl: `/resources/weekly-tests/${t.subject}/Test-${String(t.testNumber).padStart(2, '0')}.pdf`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  console.log(`📝 Local weekly tests seeded: ${localWeeklyTests.length} tests`);
}

function getLocalWeeklyTests() {
  return localWeeklyTests.filter(t => t.isActive).sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.testNumber - b.testNumber;
  });
}

function getLocalWeeklyTestById(id) {
  return localWeeklyTests.find(t => t._id === id) || null;
}

function getLocalWeeklyTestSubjectCounts() {
  const counts = {};
  localWeeklyTests.filter(t => t.isActive).forEach(t => {
    if (!counts[t.subject]) counts[t.subject] = { subject: t.subject, subjectName: t.subjectName, count: 0, difficulty: t.difficulty };
    counts[t.subject].count++;
  });
  return Object.values(counts).sort((a, b) => a.subject.localeCompare(b.subject));
}

function saveLocalWeeklyTest(data) {
  const doc = { _id: oid(), ...data, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  localWeeklyTests.push(doc);
  return doc;
}

function updateLocalWeeklyTestPdfUrl(id, pdfUrl) {
  const idx = localWeeklyTests.findIndex(t => t._id === id);
  if (idx === -1) return null;
  localWeeklyTests[idx].pdfUrl = pdfUrl;
  localWeeklyTests[idx].updatedAt = new Date().toISOString();
  return localWeeklyTests[idx];
}

function getLocalWeeklyTestProgress(userId, testId) {
  return localTestProgress.get(`${userId}:${testId}`) || null;
}

function getAllLocalWeeklyTestProgress(userId) {
  const list = [];
  localTestProgress.forEach((v, k) => {
    if (k.startsWith(`${userId}:`)) {
      const testId = k.split(':')[1];
      const test = getLocalWeeklyTestById(testId);
      list.push({ ...v, test });
    }
  });
  return list;
}

function saveLocalWeeklyTestProgress(userId, testId, data) {
  const key = `${userId}:${testId}`;
  const prev = localTestProgress.get(key) || {
    _id: oid(), user: userId, test: testId, isCompleted: false, score: null,
    totalMarks: null, accuracy: null, timeTaken: null, attemptedAt: null, completedAt: null,
  };
  const next = { ...prev, ...data, updatedAt: new Date().toISOString() };
  if (!prev.attemptedAt && data.isCompleted) next.attemptedAt = new Date().toISOString();
  localTestProgress.set(key, next);
  return next;
}

// ─── Local Mock Test Store ──────────────────────────────────
const localMockQuestions = [];
const localMockTests = [];
const localMockAttempts = new Map();
const localMistakeEntries = [];

function seedLocalMockData(seedData) {
  if (localMockTests.length) return;

  seedData.questions.forEach((q, i) => {
    localMockQuestions.push({ _id: oid(), ...q, isActive: true, createdAt: new Date().toISOString() });
  });

  seedData.tests.forEach((t, i) => {
    let pool = localMockQuestions.filter(q => q.subject === t.subject);

    if (t.testType === 'topic') {
      const exact = pool.filter(q => q.topic === t.topic);
      pool = exact.length >= 2 ? exact : pool.filter(q =>
        t.topic?.split('&').some(kw => q.topic?.toLowerCase().includes(kw.trim().toLowerCase()))
      );
    } else {
      const byDiff = pool.filter(q => q.difficulty === t.difficulty);
      pool = byDiff.length >= 3 ? byDiff : pool;
    }

    const qIds = pool.slice(0, t.questionCount).map(q => q._id);
    const marks = qIds.reduce((sum, id) => {
      const q = localMockQuestions.find(qq => qq._id === id);
      return sum + (q ? q.marks : 1);
    }, 0);
    const testDoc = { ...t };
    delete testDoc.questionIds;
    localMockTests.push({
      _id: oid(),
      ...testDoc,
      questionIds: qIds,
      totalMarks: marks || t.totalMarks,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  console.log(`📝 Local mock tests seeded: ${localMockTests.length} tests, ${localMockQuestions.length} questions`);
}

function getLocalMockTests(filter = {}) {
  let list = localMockTests.filter(t => t.isActive);
  if (filter.subject) list = list.filter(t => t.subject === filter.subject);
  if (filter.testType) list = list.filter(t => t.testType === filter.testType);
  if (filter.difficulty) list = list.filter(t => t.difficulty === filter.difficulty);
  return list.sort((a, b) => a.subject.localeCompare(b.subject) || a.testNumber - b.testNumber);
}

function getLocalMockTestById(id) {
  return localMockTests.find(t => t._id === id) || null;
}

function getLocalMockQuestionsByIds(ids) {
  return localMockQuestions.filter(q => ids.includes(q._id));
}

function getLocalMockTestSubjectCounts() {
  const counts = {};
  localMockTests.filter(t => t.isActive).forEach(t => {
    if (!counts[t.subject]) counts[t.subject] = { subject: t.subject, subjectName: t.subjectName, count: 0, types: {} };
    counts[t.subject].count++;
    counts[t.subject].types[t.testType] = (counts[t.subject].types[t.testType] || 0) + 1;
  });
  return Object.values(counts).sort((a, b) => a.subject.localeCompare(b.subject));
}

function saveLocalMockAttempt(userId, data) {
  const prefix = `${userId}:${data.test}:`;
  let maxAttempt = 0;
  localMockAttempts.forEach((v, k) => {
    if (k.startsWith(prefix)) {
      const attemptNum = parseInt(k.split(':')[2], 10);
      if (!isNaN(attemptNum) && attemptNum > maxAttempt) maxAttempt = attemptNum;
    }
  });
  const nextAttempt = maxAttempt + 1;
  const key = `${userId}:${data.test}:${nextAttempt}`;
  const attempt = { _id: oid(), user: userId, attemptNumber: nextAttempt, ...data, createdAt: new Date().toISOString() };
  localMockAttempts.set(key, attempt);
  return attempt;
}

function getLocalMockAttempt(userId, testId) {
  const prefix = `${userId}:${testId}:`;
  let latest = null;
  localMockAttempts.forEach((v, k) => {
    if (k.startsWith(prefix)) {
      if (!latest || new Date(v.createdAt) > new Date(latest.createdAt)) {
        latest = v;
      }
    }
  });
  return latest || null;
}

function getAllLocalMockAttempts(userId) {
  const list = [];
  localMockAttempts.forEach((v, k) => {
    if (k.startsWith(`${userId}:`)) {
      const test = getLocalMockTestById(v.test);
      list.push({ ...v, test });
    }
  });
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getLocalMockAnalytics(userId) {
  const attempts = [];
  localMockAttempts.forEach((v, k) => {
    if (k.startsWith(`${userId}:`)) attempts.push(v);
  });
  if (!attempts.length) {
    return { count: 0, avgScore: 0, avgAccuracy: 0, bestScore: 0, improvement: 0, trend: [] };
  }
  const scores = attempts.map(a => a.score || 0);
  const accuracies = attempts.map(a => a.accuracy || 0);
  const sorted = attempts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return {
    count: attempts.length,
    avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    avgAccuracy: (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(1),
    bestScore: Math.max(...scores, 0),
    improvement: scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : 0,
    trend: sorted.map(a => ({ score: a.score, accuracy: a.accuracy, date: a.createdAt })),
  };
}

// ─── Local Mistake Entry Store ─────────────────────────────
function saveLocalMistakeEntry(userId, data) {
  const entry = { _id: oid(), user: userId, ...data, createdAt: new Date().toISOString() };
  localMistakeEntries.push(entry);
  return entry;
}

function getLocalMistakeEntries(userId, filter = {}) {
  let list = localMistakeEntries.filter(e => e.user === userId);
  if (filter.subject) list = list.filter(e => e.subject === filter.subject);
  if (filter.category) list = list.filter(e => e.category === filter.category);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function deleteLocalMistakeEntry(id, userId) {
  const idx = localMistakeEntries.findIndex(e => e._id === id && e.user === userId);
  if (idx === -1) return false;
  localMistakeEntries.splice(idx, 1);
  return true;
}

function getLocalMistakeAggregates(userId) {
  const entries = localMistakeEntries.filter(e => e.user === userId);
  const byCategory = {};
  const bySubject = {};
  entries.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
  });
  const total = entries.length;
  const topCategory = total ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0] : null;
  const topSubject = total ? Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0][0] : null;
  return { total, byCategory, bySubject, topCategory, topSubject };
}

// ─── Admin Mock Test Store ──────────────────────────────────
function saveLocalMockTest(data) {
  const maxTestNumber = localMockTests
    .filter(t => t.subject === data.subject)
    .reduce((max, t) => Math.max(max, t.testNumber || 0), 0);
  const doc = {
    _id: oid(),
    ...data,
    testNumber: data.testNumber || maxTestNumber + 1,
    isActive: true,
    questionIds: data.questionIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localMockTests.push(doc);
  saveToDisk();
  return doc;
}

function updateLocalMockTest(id, data) {
  const idx = localMockTests.findIndex(t => t._id === id);
  if (idx === -1) return null;
  localMockTests[idx] = { ...localMockTests[idx], ...data, updatedAt: new Date().toISOString() };
  saveToDisk();
  return localMockTests[idx];
}

function deleteLocalMockTest(id) {
  const idx = localMockTests.findIndex(t => t._id === id);
  if (idx === -1) return false;
  localMockTests[idx].isActive = false;
  localMockTests[idx].updatedAt = new Date().toISOString();
  saveToDisk();
  return true;
}

function saveLocalMockQuestion(data) {
  const doc = { _id: oid(), ...data, isActive: true, createdAt: new Date().toISOString() };
  localMockQuestions.push(doc);
  saveToDisk();
  return doc;
}

function updateLocalMockQuestion(id, data) {
  const idx = localMockQuestions.findIndex(q => q._id === id);
  if (idx === -1) return null;
  localMockQuestions[idx] = { ...localMockQuestions[idx], ...data };
  saveToDisk();
  return localMockQuestions[idx];
}

function deleteLocalMockQuestion(id) {
  const idx = localMockQuestions.findIndex(q => q._id === id);
  if (idx === -1) return false;
  localMockQuestions.splice(idx, 1);
  saveToDisk();
  return true;
}

function getLocalMockQuestionsAll(filter = {}) {
  let list = [...localMockQuestions];
  if (filter.subject) list = list.filter(q => q.subject === filter.subject);
  if (filter.topic) list = list.filter(q => q.topic === filter.topic);
  if (filter.difficulty) list = list.filter(q => q.difficulty === filter.difficulty);
  return list;
}

module.exports = {
  seedLocalSyllabus,
  getSubjects,
  getSubjectById,
  getTopics,
  getTopicById,
  enrichWithProgress,
  getHierarchy,
  saveLocalNote,
  getLocalNotes,
  updateLocalNote,
  deleteLocalNote,
  updateProgress,
  getProgress,
  getAllProgress,
  getLocalFeedback,
  saveLocalFeedback,
  getAllLocalFeedback,
  seedLocalWeeklyTests,
  getLocalWeeklyTests,
  getLocalWeeklyTestById,
  getLocalWeeklyTestSubjectCounts,
  saveLocalWeeklyTest,
  updateLocalWeeklyTestPdfUrl,
  getLocalWeeklyTestProgress,
  getAllLocalWeeklyTestProgress,
  saveLocalWeeklyTestProgress,
  seedLocalMockData,
  getLocalMockTests,
  getLocalMockTestById,
  getLocalMockQuestionsByIds,
  getLocalMockTestSubjectCounts,
  saveLocalMockAttempt,
  getLocalMockAttempt,
  getAllLocalMockAttempts,
  getLocalMockAnalytics,
  saveLocalMistakeEntry,
  getLocalMistakeEntries,
  deleteLocalMistakeEntry,
  getLocalMistakeAggregates,
  saveLocalMockTest,
  updateLocalMockTest,
  deleteLocalMockTest,
  saveLocalMockQuestion,
  updateLocalMockQuestion,
  deleteLocalMockQuestion,
  getLocalMockQuestionsAll,
};
