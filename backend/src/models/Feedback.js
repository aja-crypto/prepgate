const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  anonymous: { type: Boolean, default: false },

  // Ratings
  ratings: {
    overall: { type: Number, min: 1, max: 10 },
    uiux: { type: Number, min: 1, max: 10 },
    aiMentor: { type: Number, min: 1, max: 10 },
    revision: { type: Number, min: 1, max: 10 },
    mobile: { type: Number, min: 1, max: 10 },
  },

  // Feature requests
  featureRequests: [{
    title: String,
    description: String,
    votes: { type: Number, default: 1 },
  }],

  // Bug reports
  bugReports: [{
    title: { type: String, required: true },
    description: String,
    pageName: String,
    screenshotUrl: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
  }],

  // GATE prep questions
  preparation: {
    targetRank: String,
    targetScore: String,
    weakestSubject: String,
    strongestSubject: String,
    biggestChallenge: String,
  },

  // Recommendation
  recommendation: {
    wouldRecommend: { type: String, enum: ['yes', 'no', 'maybe'] },
    likes: String,
    improvements: String,
    mostUsedFeature: String,
  },

  // Quick poll answers
  polls: [{
    questionId: String,
    answer: String,
  }],
}, {
  timestamps: true,
});

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'ratings.overall': -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
