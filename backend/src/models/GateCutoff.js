const mongoose = require('mongoose');

const gateCutoffSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS' },
  category: { type: String, required: true, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'] },
  qualifyingMarks: { type: Number, required: true },
  qualifyingPercentile: { type: Number, default: null },
  qualifyingRank: { type: Number, default: null },
  totalCandidates: { type: Number, default: null },
  source: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
}, { timestamps: true });

gateCutoffSchema.index({ year: -1, category: 1 });
gateCutoffSchema.index({ year: -1, paper: 1 });
gateCutoffSchema.index({ year: -1, category: 1, paper: 1 });

module.exports = mongoose.model('GateCutoff', gateCutoffSchema);
