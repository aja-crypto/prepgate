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
};
