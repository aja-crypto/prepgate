const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/AIConversation.js – Persist AI Mentor conversations
const aiConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['mentor', 'coach', 'planner', 'doubt', 'daily_coach'],
    default: 'mentor',
  },
  subject: {
    type: String,
  },
  topic: {
    type: String,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      model: String,
      tokens: Number,
      latency: Number,
    },
  }],
  context: {
    rank: Number,
    score: Number,
    weakTopics: [String],
    strongTopics: [String],
    subjects: [String],
    daysToExam: Number,
    dailyTarget: Number,
    streak: Number,
  },
  summary: {
    type: String,
    maxlength: 500,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  rating: {
    helpful: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
    feedback: String,
  },
}, { timestamps: true });

// Indexes
aiConversationSchema.index({ user: 1, type: 1, isArchived: 1 });
aiConversationSchema.index({ user: 1, lastMessageAt: -1 });
aiConversationSchema.index({ user: 1, 'context.rank': 1 });

// Update message count before saving
aiConversationSchema.pre('save', function (next) {
  this.messageCount = this.messages.length;
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

// Virtual for duration
aiConversationSchema.virtual('durationMinutes').get(function () {
  if (this.messages.length < 2) return 0;
  const first = this.messages[0].timestamp;
  const last = this.messages[this.messages.length - 1].timestamp;
  return Math.round((last - first) / (1000 * 60));
});

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = AIConversation;