const mongoose = require('mongoose');

const pyqPaperSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  set: { type: Number, required: true },
  title: { type: String, required: true },
  subject: { type: String, default: 'CSE' },
  pdfUrl: { type: String, required: true },
  pdfFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaFile', default: null }, // MediaFile reference (single source of truth)
  fileName: { type: String },
}, { timestamps: true });

pyqPaperSchema.index({ year: -1, set: 1 });

module.exports = mongoose.model('PyqPaper', pyqPaperSchema);