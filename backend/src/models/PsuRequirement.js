const mongoose = require('mongoose');

const psuRequirementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, default: '' },
  type: { type: String, default: 'PSU' },
  recruitmentType: { type: String, default: 'GATE-based' },
  year: { type: Number, required: true, index: true },
  paper: { type: String, default: 'CS' },
  category: { type: String, required: true, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'] },
  cutoffScore: { type: Number, required: true },
  cutoffRank: { type: Number, default: null },
  totalPosts: { type: Number, default: null },
  discipline: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  source: { type: String, enum: ['official', 'admin'], default: 'official' },
}, { timestamps: true });

psuRequirementSchema.index({ year: -1, category: 1 });
psuRequirementSchema.index({ name: 1, year: -1 });

module.exports = mongoose.model('PsuRequirement', psuRequirementSchema);
