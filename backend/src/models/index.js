try {
// src/models/Subject.js
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: String,
  color: { type: String, default: '#4f8dff' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Topic.js
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  description: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  weightage: { type: Number, default: 3 }, // estimated % within subject
  content: {
    theoryNotes: String,
    keyConcepts: [String],
    formulas: [{ name: String, expression: String, note: String }],
    definitions: [{ term: String, definition: String }],
    shortNotes: String,
    revisionNotes: String,
    commonMistakes: [String],
    faqQuestions: [{ question: String, answer: String }],
    frequentlyAskedConcepts: [String],
    expectedQuestions2027: [String],
    gatePriority: { type: String, enum: ['HIGH', 'STANDARD'], default: 'STANDARD' },
    marksRange: String,
    bookReferences: [{ title: String, author: String, chapter: String }],
    practiceQuestions: [{ question: String, hint: String }],
  },
  resources: [{
    title: String,
    url: String,
    type: { type: String, enum: ['video', 'article', 'book', 'pdf'] },
  }],
  isDefault: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

topicSchema.index({ subject: 1, order: 1 });
topicSchema.index({ name: 1, subject: 1 });

const Topic = mongoose.model('Topic', topicSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Progress.js – User progress per topic
const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  // Detailed Completion Checklist
  completionTasks: {
    lecture: { type: Boolean, default: false },
    notes: { type: Boolean, default: false },
    pyqs: { type: Boolean, default: false },
    test: { type: Boolean, default: false },
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  confidence: {
    type: Number,
    min: 1,
    max: 5,
    default: 3, // self-rated confidence
  },
  studyTimeMinutes: {
    type: Number,
    default: 0,
  },
  revisionCount: {
    type: Number,
    default: 0,
  },
  nextRevisionDate: Date,
  notes: String,
  isBookmarked: { type: Boolean, default: false },
  revisionNeeded: { type: Boolean, default: false },
  markedDifficult: { type: Boolean, default: false },
  accuracy: { type: Number, default: 0 }, // 0-100 from PYQ attempts in topic
  lastStudiedAt: Date,
}, { timestamps: true });

// Unique per user-topic pair
progressSchema.index({ user: 1, topic: 1 }, { unique: true });
const Progress = mongoose.model('Progress', progressSchema);

// ─────────────────────────────────────────────────────────────
// src/models/StudyLog.js – Daily study hours
const studyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  subjects: [{
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    hours: Number,
  }],
  notes: String,
}, { timestamps: true });

studyLogSchema.index({ user: 1, date: 1 }, { unique: true });
const StudyLog = mongoose.model('StudyLog', studyLogSchema);

// ─────────────────────────────────────────────────────────────
// src/models/MockTest.js
const mockTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
  },
  provider: {
    type: String,
    enum: ['MADE Easy', 'ACE Academy', 'GATE Wallah', 'Testbook', 'BYJU\'s', 'Self', 'Other'],
    default: 'Other',
  },
  testDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxScore: {
    type: Number,
    default: 100,
  },
  rank: Number,
  totalStudents: Number,
  subjectScores: [{
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    score: Number,
    maxScore: Number,
  }],
  weakAreas: [String],
  notes: String,
  analysisUrl: String, // link to detailed analysis
}, { timestamps: true });

// Virtual: percentage score
mockTestSchema.virtual('percentage').get(function () {
  return ((this.score / this.maxScore) * 100).toFixed(1);
});

const MockTest = mongoose.model('MockTest', mockTestSchema);

// ─────────────────────────────────────────────────────────────
// src/models/PYQ.js – Previous Year Questions
const pyqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
  },
  year: {
    type: Number,
    required: true,
    min: 1990,
    max: 2027,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  marks: {
    type: Number,
    enum: [1, 2],
    default: 2,
  },
  questionType: {
    type: String,
    enum: ['MCQ', 'MSQ', 'NAT'],
    default: 'MCQ',
  },
  questionText: { type: String, default: '' },
  options: [{
    key: { type: String, required: true },
    text: { type: String, required: true },
  }],
  correctAnswer: mongoose.Schema.Types.Mixed, // string for MCQ/NAT, array for MSQ
  explanation: String,
  imageUrl: String,
  tags: [String],
  source: {
    type: String,
    default: 'GATE Official',
  },
  paperSet: String,
  isActive: { type: Boolean, default: true },
  // Aggregate attempt stats (updated on each user attempt)
  stats: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    incorrectAttempts: { type: Number, default: 0 },
    skipAttempts: { type: Number, default: 0 },
  },
}, { timestamps: true });

pyqSchema.index({ subject: 1, year: -1 });
pyqSchema.index({ topic: 1, difficulty: 1 });
pyqSchema.index({ year: 1, difficulty: 1 });
pyqSchema.index({ isActive: 1 });

const PYQ = mongoose.model('PYQ', pyqSchema);

// ─────────────────────────────────────────────────────────────
// src/models/UserPYQ.js – User's solved PYQ tracking
const userPYQSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pyq: { type: mongoose.Schema.Types.ObjectId, ref: 'PYQ', required: true },
  isSolved: { type: Boolean, default: false },
  solvedAt: Date,
  timeTaken: Number, // seconds
  isBookmarked: { type: Boolean, default: false },
  revisionNeeded: { type: Boolean, default: false },
  markedDifficult: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  lastStatus: { type: String, enum: ['correct', 'incorrect', 'skipped', null], default: null },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  skipCount: { type: Number, default: 0 },
}, { timestamps: true });

userPYQSchema.index({ user: 1, pyq: 1 }, { unique: true });
userPYQSchema.index({ user: 1, isBookmarked: 1 });
userPYQSchema.index({ user: 1, revisionNeeded: 1 });
const UserPYQ = mongoose.model('UserPYQ', userPYQSchema);

// ─────────────────────────────────────────────────────────────
// src/models/MockSession.js – Interactive mock tests from PYQ bank
const mockSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['topic', 'subject', 'full', 'custom', 'year'],
    required: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  config: {
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    years: [Number],
    difficulties: [String],
    count: { type: Number, default: 10 },
    durationMinutes: { type: Number, default: 180 },
  },
  questions: [{
    pyq: { type: mongoose.Schema.Types.ObjectId, ref: 'PYQ', required: true },
    order: Number,
    marks: Number,
  }],
  answers: [{
    pyq: { type: mongoose.Schema.Types.ObjectId, ref: 'PYQ' },
    selectedAnswer: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['correct', 'incorrect', 'skipped'] },
    timeTaken: Number,
    marksAwarded: { type: Number, default: 0 },
  }],
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  resultStats: {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
  },
}, { timestamps: true });

mockSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
const MockSession = mongoose.model('MockSession', mockSessionSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Note.js
const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: false,
    maxlength: 50000,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
  },
  tags: [String],
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  type: { 
    type: String, 
    enum: ['text', 'formula_sheet', 'handwritten', 'screenshot', 'pdf', 'image'], 
    default: 'text' 
  },
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  lastViewed: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0 },
  ocrText: String,
  color: {
    type: String,
    default: '#4f8dff',
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for public image URL
noteSchema.virtual('imageUrl').get(function() {
  if (!this.fileUrl) return null;
  if (this.fileUrl.startsWith('http')) return this.fileUrl;
  return this.fileUrl; // Frontend handles the base URL via proxy or absolute path
});

// Text search index
noteSchema.index({ title: 'text', content: 'text', ocrText: 'text', tags: 'text' });
const Note = mongoose.model('Note', noteSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Mistake.js – Wrong question pattern analysis
const mistakeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  question: { type: String, required: true },
  mistakeType: { 
    type: String, 
    enum: ['concept', 'formula', 'silly', 'time', 'guess'], 
    required: true 
  },
  notes: String,
  isResolved: { type: Boolean, default: false },
}, { timestamps: true });

const Mistake = mongoose.model('Mistake', mistakeSchema);

// ─────────────────────────────────────────────────────────────
// src/models/StudySession.js – Timer logs
const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  startTime: { type: Date, required: true },
  endTime: Date,
  durationMinutes: Number,
  type: { type: String, enum: ['study', 'revision', 'practice'], default: 'study' },
}, { timestamps: true });

const StudySession = mongoose.model('StudySession', sessionSchema);

// ─────────────────────────────────────────────────────────────
module.exports = { Topic, Subject, Progress, StudyLog, MockTest, PYQ, UserPYQ, MockSession, Note, Mistake, StudySession };
} catch (e) {
  // Models unavailable — routes will use local data store instead
  module.exports = { 
    Topic: {}, Subject: {}, Progress: {}, StudyLog: {}, 
    MockTest: {}, PYQ: {}, UserPYQ: {}, MockSession: {}, 
    Note: {}, Mistake: {}, StudySession: {} 
  };
}
