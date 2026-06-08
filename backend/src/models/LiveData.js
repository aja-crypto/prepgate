// src/models/LiveData.js – Real-time GATE data models
const mongoose = require('mongoose');
const crypto = require('crypto');

const hashContent = (type, title, url) =>
  crypto.createHash('sha256').update(`${type}|${title}|${url || ''}`).digest('hex');

// ─── Live Update Feed ─────────────────────────────────────────
const liveUpdateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'gate_notification', 'syllabus_update', 'psu_recruitment',
      'mtech_admission', 'internship', 'placement_resource',
      'study_material', 'rss', 'counseling',
    ],
    required: true,
    index: true,
  },
  category: { type: String, index: true },
  title: { type: String, required: true, trim: true },
  summary: String,
  url: String,
  source: String,
  sourceUrl: String,
  publishedAt: Date,
  fetchedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'verified', 'published', 'rejected'],
    default: 'pending',
    index: true,
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  contentHash: { type: String, unique: true, sparse: true },
}, { timestamps: true });

liveUpdateSchema.index({ type: 1, status: 1, publishedAt: -1 });
liveUpdateSchema.pre('save', function (next) {
  if (!this.contentHash) {
    this.contentHash = hashContent(this.type, this.title, this.url);
  }
  next();
});

// ─── Exam Schedule ────────────────────────────────────────────
const examScheduleSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'application_start', 'application_end', 'admit_card',
      'exam', 'result', 'counseling', 'answer_key', 'correction_window',
    ],
    required: true,
  },
  label: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: Date,
  description: String,
  source: String,
  sourceUrl: String,
  year: { type: Number, default: 2027 },
  status: {
    type: String,
    enum: ['pending', 'verified', 'published', 'rejected'],
    default: 'published',
  },
}, { timestamps: true });

examScheduleSchema.index({ year: 1, eventType: 1 }, { unique: true });

// ─── Daily Content ────────────────────────────────────────────
const dailyContentSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  type: {
    type: String,
    enum: ['theory', 'question', 'formula', 'pyq'],
    required: true,
  },
  subject: String,
  topic: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  explanation: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

dailyContentSchema.index({ date: 1, type: 1 }, { unique: true });

// ─── Topic Analysis ───────────────────────────────────────────
const topicAnalysisSchema = new mongoose.Schema({
  analysisType: {
    type: String,
    enum: ['weightage', 'marks_distribution', 'frequent_topics', 'repeated_questions', 'important_topics'],
    required: true,
  },
  subject: { type: String, index: true },
  data: mongoose.Schema.Types.Mixed,
  yearsCovered: [Number],
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

topicAnalysisSchema.index({ analysisType: 1, subject: 1 }, { unique: true });

// ─── Trending Snapshot ────────────────────────────────────────
const trendingSnapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  type: {
    type: String,
    enum: ['subject_leaderboard', 'trending_topics'],
    required: true,
  },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

trendingSnapshotSchema.index({ date: 1, type: 1 }, { unique: true });

// ─── Fetch Job Log ────────────────────────────────────────────
const fetchJobLogSchema = new mongoose.Schema({
  jobName: { type: String, required: true, index: true },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  status: { type: String, enum: ['running', 'success', 'partial', 'failed'], default: 'running' },
  itemsFetched: { type: Number, default: 0 },
  itemsNew: { type: Number, default: 0 },
  error: String,
  details: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const LiveUpdate = mongoose.model('LiveUpdate', liveUpdateSchema);
const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);
const DailyContent = mongoose.model('DailyContent', dailyContentSchema);
const TopicAnalysis = mongoose.model('TopicAnalysis', topicAnalysisSchema);
const TrendingSnapshot = mongoose.model('TrendingSnapshot', trendingSnapshotSchema);
const FetchJobLog = mongoose.model('FetchJobLog', fetchJobLogSchema);

module.exports = {
  LiveUpdate,
  ExamSchedule,
  DailyContent,
  TopicAnalysis,
  TrendingSnapshot,
  FetchJobLog,
  hashContent,
};
