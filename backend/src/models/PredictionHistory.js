const mongoose = require('mongoose');

const predictionHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  input: {
    name: { type: String, default: '' },
    paper: { type: String, default: 'CS' },
    expectedMarks: { type: Number, required: true },
    normalizedScore: { type: Number, default: null },
    category: { type: String, required: true },
    admissionType: { type: String, default: 'M.Tech' },
    preferredState: { type: String, default: '' },
    collegeType: { type: String, default: 'Any' },
    preferredProgram: { type: String, default: '' },
    attemptNumber: { type: Number, default: 1 },
    targetYear: { type: Number, default: null },
    mockAverage: { type: Number, default: null },
    preparationLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', null], default: null },
  },
  output: {
    predictedScore: { type: Number, default: null },
    predictedRank: { type: Number, default: null },
    predictedPercentile: { type: Number, default: null },
    confidence: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    confidenceScore: { type: Number, default: 0 },
    isQualified: { type: Boolean, default: false },
    qualifyingCutoff: { type: Number, default: null },
    dreamColleges: [{ institute: String, program: String, probability: Number }],
    targetColleges: [{ institute: String, program: String, probability: Number }],
    safeColleges: [{ institute: String, program: String, probability: Number }],
    backupColleges: [{ institute: String, program: String, probability: Number }],
    eligibleIITs: { type: Number, default: 0 },
    eligibleNITs: { type: Number, default: 0 },
    eligibleIIITs: { type: Number, default: 0 },
    eligibleGFTIs: { type: Number, default: 0 },
    eligiblePSUs: [{ name: String, cutoffScore: Number, posts: Number }],
    branchRecommendations: [{ branch: String, reason: String }],
    scholarshipOpportunities: [{ name: String, eligibility: String, amount: String }],
    admissionProbability: { type: Number, default: 0 },
    last5YearTrend: {
      scores: [Number],
      ranks: [Number],
      years: [Number],
    },
    whyThisPrediction: {
      basedOn: [String],
      confidenceFactors: [String],
      dataQuality: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
    },
  },
  aiReport: {
    strengths: [String],
    weaknesses: [String],
    improvements: [String],
    recommendedSubjects: [String],
    dreamIITStrategy: String,
    targetIITStrategy: String,
    safeCollegeStrategy: String,
    estimatedMarksNeeded: { type: Number, default: null },
  },
  datasetsUsed: [{
    name: String,
    year: Number,
    entries: Number,
    source: String,
  }],
  whatIfScenarios: [{
    marks: Number,
    rank: Number,
    score: Number,
    opportunities: { type: Number, default: 0 },
  }],
  year: { type: Number, required: true },
  validation: {
    isCorrect: { type: Boolean, default: null },
    validatedAt: { type: Date, default: null },
    userFeedback: { type: String, default: '' },
  },
}, { timestamps: true });

predictionHistorySchema.index({ user: 1, createdAt: -1 });
predictionHistorySchema.index({ 'validation.isCorrect': 1 });

module.exports = mongoose.model('PredictionHistory', predictionHistorySchema);
