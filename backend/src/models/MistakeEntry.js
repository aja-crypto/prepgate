const mongoose = require('mongoose');

const mistakeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionText: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  subtopic: { type: String, default: '' },
  source: { type: String, enum: ['PYQ', 'Mock', 'Topic Test', 'Practice', 'Other'], default: 'Other' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', ''], default: '' },
  questionLink: { type: String, default: '' },
  questionImage: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  userAnswer: { type: String, default: '' },
  marksLost: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  mistakeType: {
    type: String,
    enum: [
      'concept_error', 'calculation_mistake', 'silly_mistake', 'formula_forgotten',
      'time_management', 'question_misread', 'guessing_error', 'logic_error',
      'memory_error', 'panic_during_exam', 'wrong_option_elimination',
      'didnt_revise', 'careless_reading'
    ],
    default: 'concept_error',
  },
  reason: { type: String, default: '' },
  learning: { type: String, default: '' },
  aiAnalysis: { type: String, default: '' },
  revisionDates: [{ type: Date }],
  reviewCount: { type: Number, default: 0 },
  resolved: { type: Boolean, default: false },
  repeated: { type: Number, default: 0 },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  attachments: [{
    name: String,
    url: String,
    type: { type: String, enum: ['pdf', 'image', 'note', 'formula', 'video'] },
  }],
  tags: [String],
  sourceTest: { type: String, default: '' },
  isBookmarked: { type: Boolean, default: false },
}, { timestamps: true });

mistakeEntrySchema.index({ user: 1, createdAt: -1 });
mistakeEntrySchema.index({ user: 1, subject: 1 });
mistakeEntrySchema.index({ user: 1, resolved: 1 });
mistakeEntrySchema.index({ user: 1, mistakeType: 1 });

let MistakeEntry;
try { MistakeEntry = mongoose.model('MistakeEntry'); } catch { MistakeEntry = mongoose.model('MistakeEntry', mistakeEntrySchema); }
module.exports = MistakeEntry;
