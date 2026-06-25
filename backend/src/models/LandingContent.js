const mongoose = require('mongoose');

const monthlyInsightSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: Number, default: 1, min: 1, max: 10 },
  featuredSubjects: [{ type: String }],
  topics: [{
    name: { type: String, required: true },
    weightage: { type: Number, default: 0 },
    pyqFrequency: { type: Number, default: 0 },
    trend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
  }],
  pyqPatterns: [{ type: String }],
  recommendations: [{ type: String }],
  isActive: { type: Boolean, default: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
}, { timestamps: true });

monthlyInsightSchema.index({ month: 1, year: 1, isActive: 1 });

const questionOfMonthSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '' },
  hint: { type: String, default: '' },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
}, { timestamps: true });

questionOfMonthSchema.index({ month: 1, year: 1, isActive: 1 });

const motivationQuoteSchema = new mongoose.Schema({
  quote: { type: String, required: true },
  author: { type: String, default: 'GateApex Team' },
  category: { type: String, enum: ['motivation', 'study_tips', 'success_mindset', 'gate_success', 'daily'], default: 'daily' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

motivationQuoteSchema.index({ isActive: 1 });

const featuredResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  category: { type: String, enum: ['notes', 'pyq', 'resource', 'mock', 'video'], required: true },
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  url: { type: String, default: '' },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
}, { timestamps: true });

featuredResourceSchema.index({ category: 1, isActive: 1, priority: -1 });

const LandingContent = mongoose.models.MonthlyInsight || mongoose.model('MonthlyInsight', monthlyInsightSchema);
const QuestionOfMonth = mongoose.models.QuestionOfMonth || mongoose.model('QuestionOfMonth', questionOfMonthSchema);
const MotivationQuote = mongoose.models.MotivationQuote || mongoose.model('MotivationQuote', motivationQuoteSchema);
const FeaturedResource = mongoose.models.FeaturedResource || mongoose.model('FeaturedResource', featuredResourceSchema);

module.exports = { LandingContent, QuestionOfMonth, MotivationQuote, FeaturedResource };
