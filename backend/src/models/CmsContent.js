const mongoose = require('mongoose');

// ─── 1. Monthly GATE Insights ───────────────────────────────
const insightSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  month: { type: String, required: true }, // "YYYY-MM"
  description: { type: String, required: true },
  priority: { type: Number, default: 1, min: 1, max: 10 },
  relatedSubjects: [{ type: String }],
  topics: [{
    name: { type: String },
    weightage: { type: Number },
    pyqFrequency: { type: Number },
    trend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
  }],
  recommendations: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

insightSchema.index({ month: -1, priority: -1 });
insightSchema.index({ isPublished: 1, isDeleted: 1 });

// ─── 2. Challenges ─────────────────────────────────────────
const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  goal: { type: String, required: true }, // e.g., "Solve 50 PYQs"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rewardBadge: { type: String, default: '' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  thumbnail: { type: String, default: '' },
  rules: [{ type: String }],
  milestones: [{
    name: String,
    target: Number,
    badge: String,
  }],
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

challengeSchema.index({ isPublished: 1, startDate: -1 });
challengeSchema.index({ isDeleted: 1 });

// ─── 3. Daily Motivation ────────────────────────────────────
const motivationQuoteSchema = new mongoose.Schema({
  quote: { type: String, required: true },
  author: { type: String, default: 'PrepGate Team' },
  category: {
    type: String,
    enum: ['daily', 'study_tips', 'success_mindset', 'gate_success', 'motivation'],
    default: 'daily',
  },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

motivationQuoteSchema.index({ isActive: 1 });
motivationQuoteSchema.index({ isDeleted: 1 });

// ─── 4. Featured Resources ──────────────────────────────────
const featuredResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  resourceType: {
    type: String,
    enum: ['notes', 'short_notes', 'formula_sheet', 'strategy_guide', 'video', 'pdf'],
    required: true,
  },
  thumbnail: { type: String, default: '' },
  url: { type: String, default: '' },
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

featuredResourceSchema.index({ isFeatured: 1, priority: -1 });
featuredResourceSchema.index({ resourceType: 1, isPublished: 1 });
featuredResourceSchema.index({ isDeleted: 1 });

// ─── 5. Featured Content ────────────────────────────────────
const featuredContentSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['notes', 'pyq', 'mock_test', 'subject', 'topic'],
    required: true,
  },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  link: { type: String, default: '' },
  priority: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

featuredContentSchema.index({ isFeatured: 1, priority: -1 });
featuredContentSchema.index({ contentType: 1, isPublished: 1 });
featuredContentSchema.index({ isDeleted: 1 });

// ─── 6. Announcements ───────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notificationEnabled: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

announcementSchema.index({ isPublished: 1, startDate: -1, priority: -1 });
announcementSchema.index({ isDeleted: 1 });

// ─── Export all models ──────────────────────────────────────
const Insight = mongoose.models.Insight || mongoose.model('Insight', insightSchema);
const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);
const MotivationQuote = mongoose.models.MotivationQuote || mongoose.model('MotivationQuote', motivationQuoteSchema);
const CmsFeaturedResource = mongoose.models.CmsFeaturedResource || mongoose.model('CmsFeaturedResource', featuredResourceSchema);
const FeaturedContent = mongoose.models.FeaturedContent || mongoose.model('FeaturedContent', featuredContentSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

module.exports = { Insight, Challenge, MotivationQuote, CmsFeaturedResource, FeaturedContent, Announcement };
