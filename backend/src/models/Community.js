const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/Question.js – Community Q&A - Questions
const questionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  subject: {
    type: String,
    required: true,
    index: true,
  },
  topic: {
    type: String,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  // Type of question
  type: {
    type: String,
    enum: ['concept', 'doubt', 'problem', 'formula', 'strategy', 'career', 'other'],
    default: 'concept',
  },
  // GATE specific metadata
  gateYear: Number,
  gatePaper: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
  },
  // Voting
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  voters: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number, enum: [1, -1] },
    votedAt: { type: Date, default: Date.now },
  }],
  // Answer count
  answerCount: {
    type: Number,
    default: 0,
  },
  // Views
  viewCount: {
    type: Number,
    default: 0,
  },
  // Accepted answer
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
  },
  // Status
  status: {
    type: String,
    enum: ['open', 'answered', 'closed', 'duplicate'],
    default: 'open',
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  // Moderation
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flagReason: String,
  // Related resources
  resources: [{
    type: { type: String, enum: ['link', 'video', 'pdf', 'image'] },
    url: String,
    title: String,
  }],
}, { timestamps: true });

// Indexes
questionSchema.index({ user: 1, createdAt: -1 });
questionSchema.index({ subject: 1, topic: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ upvotes: -1, answerCount: -1 });
questionSchema.index({ 'voters.user': 1 });

// Virtual for vote score
questionSchema.virtual('score').get(function () {
  return this.upvotes - this.downvotes;
});

// Method to check if user voted
questionSchema.methods.getUserVote = function (userId) {
  const voter = this.voters.find(v => v.user.toString() === userId.toString());
  return voter ? voter.vote : 0;
};

const Question = mongoose.model('Question', questionSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Answer.js – Community Q&A - Answers
const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  body: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  // Voting
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  voters: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number, enum: [1, -1] },
    votedAt: { type: Date, default: Date.now },
  }],
  // Accepted
  isAccepted: {
    type: Boolean,
    default: false,
  },
  acceptedAt: Date,
  // Status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  // Moderation
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flagReason: String,
  // Resources
  resources: [{
    type: { type: String, enum: ['link', 'video', 'pdf', 'image', 'code'] },
    url: String,
    title: String,
  }],
  // Code blocks (for technical answers)
  codeBlocks: [{
    language: String,
    code: String,
    explanation: String,
  }],
}, { timestamps: true });

// Indexes
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ user: 1, createdAt: -1 });
answerSchema.index({ upvotes: -1 });

// Virtual for vote score
answerSchema.virtual('score').get(function () {
  return this.upvotes - this.downvotes;
});

const Answer = mongoose.model('Answer', answerSchema);

// ─────────────────────────────────────────────────────────────
// src/models/Comment.js – Community Q&A - Comments on Q&A
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  body: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  // Reference to either Question or Answer
  referenceType: {
    type: String,
    enum: ['question', 'answer'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'commentSchema.refModel',
  },
  refModel: {
    type: String,
    enum: ['Question', 'Answer'],
  },
  // Voting
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  voters: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: Number, enum: [1, -1] },
  }],
  // Status
  isAccepted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Indexes
commentSchema.index({ referenceType: 1, referenceId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Question, Answer, Comment };