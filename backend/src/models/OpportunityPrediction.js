const mongoose = require('mongoose');

const opportunityPredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  input: {
    name: { type: String, default: '' },
    paper: { type: String, default: 'CS' },
    expectedMarks: { type: Number, required: true },
    category: { type: String, required: true },
    admissionType: { type: String, default: 'M.Tech' },
    preferredState: { type: String, default: '' },
    collegeType: { type: String, default: 'Any' },
  },
  results: {
    estimatedScore: { type: Number, default: null },
    estimatedRank: { type: Number, default: null },
    estimatedPercentile: { type: Number, default: null },
    qualifyingCutoff: { type: Number, default: null },
    isQualified: { type: Boolean, default: false },
    confidence: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    opportunities: [{
      college: { type: String },
      collegeType: { type: String },
      program: { type: String },
      specialization: { type: String },
      category: { type: String },
      chance: { type: String, enum: ['High', 'Moderate', 'Competitive', 'Low'] },
      closingScore: { type: Number },
      location: { type: String },
      admissionType: { type: String },
    }],
    careerOpportunities: {
      iits: { type: Number, default: 0 },
      nits: { type: Number, default: 0 },
      iiits: { type: Number, default: 0 },
      gftis: { type: Number, default: 0 },
      psus: { type: Number, default: 0 },
      researchInstitutes: { type: Number, default: 0 },
    },
    recommendations: [{ type: String }],
  },
  year: { type: Number, required: true },
}, { timestamps: true });

opportunityPredictionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('OpportunityPrediction', opportunityPredictionSchema);
