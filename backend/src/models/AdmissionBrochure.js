const mongoose = require('mongoose');

const admissionBrochureSchema = new mongoose.Schema({
  institute: { type: String, required: true },
  instituteType: { type: String, enum: ['IIT', 'NIT', 'IIIT', 'GFTI', 'Other'] },
  year: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  cloudinaryId: { type: String, default: '' },
  programType: { type: String, enum: ['M.Tech', 'MS Research', 'PhD', 'All'], default: 'All' },
  isActive: { type: Boolean, default: true },
  source: { type: String, enum: ['official', 'admin'], default: 'admin' },
}, { timestamps: true });

admissionBrochureSchema.index({ institute: 1, year: -1 });

module.exports = mongoose.model('AdmissionBrochure', admissionBrochureSchema);
