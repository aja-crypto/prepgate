const mongoose = require('mongoose');

const gateYearSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  paper: { type: String, default: 'CS' },
  paperName: { type: String, default: 'Computer Science & Information Technology' },
  totalMarks: { type: Number, default: 100 },
  totalQuestions: { type: Number, default: 65 },
  examDate: { type: Date, default: null },
  resultDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  dataSource: { type: String, enum: ['official', 'estimated', 'admin'], default: 'official' },
  notes: { type: String, default: '' },
}, { timestamps: true });

gateYearSchema.index({ year: -1 });
gateYearSchema.index({ isPublished: 1, year: -1 });

module.exports = mongoose.model('GateYear', gateYearSchema);
