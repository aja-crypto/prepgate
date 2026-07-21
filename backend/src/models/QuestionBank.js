const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  // Core
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  diagram: { type: String, default: '' },

  // Classification
  subject: { type: String, required: true, index: true },
  topic: { type: String, required: true, index: true },
  year: { type: Number, default: null },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'very_hard'], default: 'medium' },
  questionType: { type: String, enum: ['mcq', 'msq', 'nat', 'numerical'], default: 'mcq' },

  // Source
  source: { type: String, enum: ['official', 'imported', 'ai_generated', 'manual', 'pyq', 'mock_test'], default: 'manual' },
  sourceId: { type: String, default: '' },
  tags: [{ type: String }],

  // Status
  status: { type: String, enum: ['draft', 'review', 'published', 'archived'], default: 'draft' },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // Duplicate tracking
  duplicateGroup: { type: String, default: null },
  isDuplicate: { type: Boolean, default: false },
  originalQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', default: null },

  // PYQ reference (if sourced from a GATE paper)
  pyq: {
    year: { type: Number },
    paper: { type: String },
    set: { type: String },
    marks: { type: Number },
  },
}, { timestamps: true });

questionBankSchema.index({ subject: 1, topic: 1, difficulty: 1 });
questionBankSchema.index({ year: -1, subject: 1 });
questionBankSchema.index({ status: 1, isActive: 1 });
questionBankSchema.index({ question: 'text', explanation: 'text' });
questionBankSchema.index({ tags: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
