const mongoose = require('mongoose');

const gateScoreRankSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS', index: true },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateScoreRankSchema.index({ year: -1, paper: 1, score: 1 });

module.exports = mongoose.model('GateScoreRank', gateScoreRankSchema);
