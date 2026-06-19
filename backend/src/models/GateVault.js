const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '' },
  subject: { type: String, required: true, index: true },
  topic: { type: String, default: '' },
  importanceScore: { type: Number, default: 5, min: 1, max: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

flashcardSchema.index({ subject: 1, importanceScore: -1 });

const monthlySetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  month: { type: String, required: true }, // e.g., "2026-06"
  year: { type: Number, required: true },
  monthName: { type: String, required: true }, // e.g., "June"
  totalQuestions: { type: Number, default: 50 },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  flashcardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard' }],
  subjectDistribution: {
    type: Map,
    of: Number,
    default: {
      'APT': 10,
      'DS': 6,
      'DBMS': 6,
      'OS': 6,
      'CN': 5,
      'CO': 5,
      'TOC': 4,
      'CD': 4,
      'AL': 4
    }
  },
}, { timestamps: true });

monthlySetSchema.index({ month: 1, year: 1 }, { unique: true });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monthlySet: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlySet', required: true },
  currentIndex: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number,
  }],
  score: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  streak: { type: Number, default: 0 },
  lastStudiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

userProgressSchema.index({ user: 1, monthlySet: 1 }, { unique: true });

let Flashcard, MonthlySet, UserFlashcardProgress;
try { Flashcard = mongoose.model('Flashcard'); } catch { Flashcard = mongoose.model('Flashcard', flashcardSchema); }
try { MonthlySet = mongoose.model('MonthlySet'); } catch { MonthlySet = mongoose.model('MonthlySet', monthlySetSchema); }
try { UserFlashcardProgress = mongoose.model('UserFlashcardProgress'); } catch { UserFlashcardProgress = mongoose.model('UserFlashcardProgress', userProgressSchema); }

module.exports = { Flashcard, MonthlySet, UserFlashcardProgress };