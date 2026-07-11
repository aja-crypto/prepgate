const mongoose = require('mongoose');

const gateRankDataSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS' },
  marks: { type: Number, required: true },
  rank: { type: Number, required: true },
  percentile: { type: Number, default: null },
  totalCandidates: { type: Number, default: null },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateRankDataSchema.index({ year: -1, marks: 1 });
gateRankDataSchema.index({ year: -1, rank: 1 });

module.exports = mongoose.model('GateRankData', gateRankDataSchema);
