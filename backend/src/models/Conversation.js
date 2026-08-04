const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['mentor', 'coach', 'planner', 'doubt', 'daily_coach'],
    default: 'mentor',
  },
  title: {
    type: String,
    default: 'AI Chat',
    maxlength: 200,
  },
  summary: {
    type: String,
    maxlength: 500,
    default: '',
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  context: {
    subjects: [String],
    weakTopics: [String],
    strongTopics: [String],
    daysToExam: Number,
    overallProgress: Number,
    mockAvg: Number,
  },
}, { timestamps: true });

conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ user: 1, isArchived: 1, lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
