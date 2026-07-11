const mongoose = require('mongoose');

const gateStatisticsSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS', index: true },
  totalCandidates: { type: Number, default: null },
  totalRegistered: { type: Number, default: null },
  totalAppeared: { type: Number, default: null },
  meanMarks: { type: Number, default: null },
  medianMarks: { type: Number, default: null },
  stdDev: { type: Number, default: null },
  highestMarks: { type: Number, default: null },
  lowestMarks: { type: Number, default: null },
  qualifyingMarks: { type: Number, default: null },
  qualifyingPercentile: { type: Number, default: null },
  topPercentileThreshold: { type: Number, default: null },
  difficultyIndex: { type: String, enum: ['Easy', 'Moderate', 'Difficult', 'Very Difficult', null], default: null },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateStatisticsSchema.index({ year: -1, paper: 1 });

module.exports = mongoose.model('GateStatistics', gateStatisticsSchema);
