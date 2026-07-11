const mongoose = require('mongoose');

const branchStatisticsSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  branch: { type: String, required: true },
  category: { type: String, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'], required: true },
  avgScore: { type: Number, default: null },
  medianScore: { type: Number, default: null },
  minScore: { type: Number, default: null },
  maxScore: { type: Number, default: null },
  totalSeats: { type: Number, default: null },
  filledSeats: { type: Number, default: null },
  vacancyRate: { type: Number, default: null },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

branchStatisticsSchema.index({ year: -1, branch: 1, category: 1 });

module.exports = mongoose.model('BranchStatistics', branchStatisticsSchema);
