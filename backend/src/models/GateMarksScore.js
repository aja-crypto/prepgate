const mongoose = require('mongoose');

const gateMarksScoreSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS', index: true },
  marks: { type: Number, required: true },
  score: { type: Number, required: true },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

gateMarksScoreSchema.index({ year: -1, paper: 1, marks: 1 });

module.exports = mongoose.model('GateMarksScore', gateMarksScoreSchema);
