const mongoose = require('mongoose');

const collegeCutoffSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeProgram', default: null, index: true },
  collegeName: { type: String, required: true },
  collegeType: { type: String, required: true },
  program: { type: String, required: true },
  specialization: { type: String, default: '' },
  category: { type: String, required: true, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'] },
  admissionType: { type: String, required: true, enum: ['M.Tech', 'MS Research', 'PhD', 'PSU'] },
  year: { type: Number, required: true, index: true },
  closingScore: { type: Number, required: true },
  closingRank: { type: Number, default: null },
  openingScore: { type: Number, default: null },
  openingRank: { type: Number, default: null },
  round: { type: String, default: 'Final' },
  state: { type: String, default: '' },
  source: { type: String, enum: ['official', 'ccmt', 'coap', 'admin'], default: 'official' },
}, { timestamps: true });

collegeCutoffSchema.index({ year: -1, category: 1, collegeType: 1 });
collegeCutoffSchema.index({ college: 1, year: -1 });
collegeCutoffSchema.index({ program: 1, category: 1 });

module.exports = mongoose.model('CollegeCutoff', collegeCutoffSchema);
