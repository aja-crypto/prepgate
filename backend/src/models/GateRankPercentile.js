const mongoose = require('mongoose');

const gateRankPercentileSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS', index: true },
  rank: { type: Number, required: true },
  percentile: { type: Number, required: true },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateRankPercentileSchema.index({ year: -1, paper: 1, rank: 1 });

module.exports = mongoose.model('GateRankPercentile', gateRankPercentileSchema);
