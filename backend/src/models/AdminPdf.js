const mongoose = require('mongoose');

const CATEGORIES = ['pyq', 'notes', 'study_material', 'syllabus'];

const adminPdfSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, enum: CATEGORIES, required: true },
  subject: { type: String, default: '' },
  year: { type: Number },
  fileUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String, default: 'application/pdf' },
  isPublished: { type: Boolean, default: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

adminPdfSchema.index({ category: 1, isPublished: 1 });
adminPdfSchema.index({ subject: 1 });

module.exports = mongoose.model('AdminPdf', adminPdfSchema);
module.exports.CATEGORIES = CATEGORIES;
