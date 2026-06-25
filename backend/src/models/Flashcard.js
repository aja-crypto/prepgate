const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/Flashcard.js – Spaced Repetition cards for weak topics
const flashcardSchema = new mongoose.Schema({
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
  // Question data
  question: {
    type: String,
    required: true,
    trim: true,
  },
  questionImage: String, // optional image/diagram for the question
  questionAudio: String, // optional audio explanation
  
  // Answer options for MCQ type
  options: [{
    key: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  
  // For fill-in-the-blank, short answer type
  answer: {
    type: String,
    trim: true,
  },
  
  // Explanation and additional details
  explanation: String,
  hint: String,
  shortExplanation: String, // for quick review
  
  // Metadata for categorization
  questionType: {
    type: String,
    enum: ['MCQ', 'MSQ', 'NAT', 'FITB', 'SHORT_ANSWER', 'TRUE_FALSE'],
    default: 'MCQ',
  },
  
  // Difficulty and importance
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'GATE priority'],
    default: 'medium',
  },
  
  // From which GATE years appeared (1990-2027)
  years: [{
    type: Number,
    min: 1990,
    max: 2027,
  }],
  
  // Which question sets (previous GATE papers) this appears in
  gatePapers: [{
    year: { type: Number, min: 1990, max: 2027 },
    paperSet: String, // A, B, C, etc.
    questionNumber: Number,
  }],
  
  // Keywords for search
  keywords: [String],
  
  // Formula if applicable
  formula: {
    latex: String,
    text: String,
    explanation: String,
  },
  
  // Tags for grouping
  tags: [String],
  
  // Image references for diagrams
  imageRefs: [{
    caption: String,
    url: String,
  }],
  
  // Source and references
  source: {
    type: String,
    default: 'GATE Official',
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Sequence in topic
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes for efficient querying
flashcardSchema.index({ topic: 1, order: 1 });
flashcardSchema.index({ subject: 1 });
flashcardSchema.index({ difficulty: 1 });
flashcardSchema.index({ questionType: 1 });
flashcardSchema.index({ years: 1 });
flashcardSchema.index({ keywords: 1 });
flashcardSchema.index({ isActive: 1 });

// Virtual for question count
flashcardSchema.virtual('optionCount').get(function () {
  return this.options ? this.options.length : 0;
});

// Virtual for correct option key (for MCQ)
flashcardSchema.virtual('correctOptionKey').get(function () {
  if (this.questionType === 'MCQ' && this.correctAnswer) {
    return this.correctAnswer;
  }
  return null;
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

module.exports = Flashcard;