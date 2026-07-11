const mongoose = require('mongoose');

const psuRecruitmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, default: '' },
  type: { type: String, default: 'PSU' },
  recruitmentType: { type: String, default: 'GATE-based' },
  year: { type: Number, required: true, index: true },
  notificationDate: { type: Date, default: null },
  applicationDeadline: { type: Date, default: null },
  examDate: { type: Date, default: null },
  papers: [{ type: String }],
  categories: [{
    category: { type: String, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'] },
    cutoffScore: Number,
    cutoffRank: Number,
    totalPosts: Number,
  }],
  totalPosts: { type: Number, default: null },
  discipline: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  salary: { type: String, default: '' },
  eligibility: { type: String, default: '' },
  status: { type: String, enum: ['Open', 'Closed', 'Upcoming', 'Result Awaited'], default: 'Upcoming' },
  source: { type: String, enum: ['official', 'admin'], default: 'official' },
}, { timestamps: true });

psuRecruitmentSchema.index({ year: -1, status: 1 });

module.exports = mongoose.model('PsuRecruitment', psuRecruitmentSchema);
