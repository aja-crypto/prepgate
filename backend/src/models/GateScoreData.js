const mongoose = require('mongoose');

const gateScoreDataSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS' },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  percentile: { type: Number, default: null },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateScoreDataSchema.index({ year: -1, score: 1 });

module.exports = mongoose.model('GateScoreData', gateScoreDataSchema);
