const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/UserFlashcard.js – User's Flashcards with SRS scheduling
const userFlashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  flashcard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard',
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
  
  // Spaced Repetition Scheduling (SM-2 algorithm fields)
  easeFactor: {
    type: Number,
    default: 2.5, // EF starts at 2.5
    min: 1.3,
    max: 5.0,
  },
  
  intervalDays: {
    type: Number,
    default: 0, // next review interval in days
  },
  
  repetitions: {
    type: Number,
    default: 0, // number of successful repetitions
  },
  
  // Review history for algorithm
  reviewHistory: [{
    date: {
      type: Date,
      default: Date.now,
    },
    qualityOfResponse: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
    }, // 0-5 scale
    reviewTime: Number, // seconds taken to review
    note: String, // user's note about this review
  }],
  
  // Review status and scheduling
  reviewStatus: {
    type: String,
    enum: ['due', 'reviewed', 'suspended', 'mastered'],
    default: 'due',
  },
  
  // Due date for next review
  nextReviewDate: Date,
  
  // When was last reviewed
  lastReviewedAt: Date,
  
  // When was created in user's deck
  addedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Source of this flashcard for user (why added)
  source: {
    type: String,
    enum: ['weak_topic', 'manual', 'revision', 'mock_test', 'gate_paper', 'topic_revision'],
    default: 'weak_topic',
  },
  
  // User's performance on this card
  performance: {
    correctStreak: { type: Number, default: 0 },
    wrongStreak: { type: Number, default: 0 },
    currentConfidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    totalReviews: { type: Number, default: 0 },
    correctReviews: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // calculated
  },
  
  // User's personal notes on this flashcard
  personalNotes: String,
  
  // Tags or categories for user's organization
  tags: [String],
  
  // File attachments
  mediaFiles: [{
    filename: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'audio', 'video'],
    },
    caption: String,
  }],
  
  // Scheduling adjustments by user
  intervalAdjustments: [{
    date: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      enum: ['easier', 'harder', 'suspended', 'mastered'],
    },
    reason: String,
  }],
  
  // Review reminders
  remindMe: {
    enabled: { type: Boolean, default: true },
    remindDays: [Number], // days of week (0-6) or specific dates
    notificationTime: {
      hour: { type: Number, default: 20 }, // 8 PM
      minute: { type: Number, default: 0 },
    },
  },
}, { timestamps: true });

// Compound indexes for efficient queries
userFlashcardSchema.index({ user: 1, flashcard: 1 }, { unique: true }); // One entry per user per flashcard
userFlashcardSchema.index({ user: 1, reviewStatus: 1 }); // Find all user's due cards
userFlashcardSchema.index({ user: 1, source: 1 }); // Group by source
userFlashcardSchema.index({ user: 1, addedAt: -1 }); // Chronological addition
userFlashcardSchema.index({ nextReviewDate: 1, reviewStatus: 1 }); // Due date ordering

// Virtual for next review (formatted)
userFlashcardSchema.virtual('nextReviewFormatted').get(function () {
  if (!this.nextReviewDate) return null;
  return this.nextReviewDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

// Virtual for review countdown (days until due)
userFlashcardSchema.virtual('reviewCountdown').get(function () {
  if (!this.nextReviewDate) return null;
  const today = new Date();
  const diffTime = this.nextReviewDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for difficulty level based on performance
userFlashcardSchema.virtual('difficultyLevel').get(function () {
  if (this.performance.accuracy >= 80) return 'strong';
  if (this.performance.accuracy >= 60) return 'moderate';
  if (this.performance.accuracy >= 40) return 'weak';
  return 'very_weak';
});

// Virtual for mastery level (SRS based)
userFlashcardSchema.virtual('masteryLevel').get(function () {
  if (this.repetitions >= 5 && this.easeFactor > 2.8) return 'mastered';
  if (this.repetitions >= 3 && this.easeFactor > 2.5) return 'good';
  if (this.repetitions >= 1 && this.easeFactor > 2.3) return 'learning';
  return 'new';
});

const UserFlashcard = mongoose.model('UserFlashcard', userFlashcardSchema);

module.exports = UserFlashcard;