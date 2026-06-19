const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  description: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  weightage: { type: Number, default: 3 },
  content: {
    theoryNotes: String,
    keyConcepts: [String],
    formulas: [{ name: String, expression: String, note: String }],
    definitions: [{ term: String, definition: String }],
    shortNotes: String,
    revisionNotes: String,
    commonMistakes: [String],
    faqQuestions: [{ question: String, answer: String }],
    gatePriority: { type: String, enum: ['HIGH', 'STANDARD'], default: 'STANDARD' },
    bookReferences: [{ title: String, author: String, chapter: String }],
  },
  resources: [{ title: String, url: String, type: String }],
  isDefault: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

topicSchema.index({ subject: 1, order: 1 });

const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

module.exports = Topic;
