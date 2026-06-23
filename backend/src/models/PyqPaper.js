const mongoose = require('mongoose');

const pyqPaperSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  set: { type: Number, required: true },
  title: { type: String, required: true },
  subject: { type: String, default: 'CSE' },
  pdfUrl: { type: String, required: true },
  fileName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PyqPaper', pyqPaperSchema);