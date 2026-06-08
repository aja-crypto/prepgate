import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String }, // For text notes
  type: { 
    type: String, 
    enum: ['note', 'formula_sheet', 'handwritten', 'screenshot', 'pdf', 'image'], 
    required: true 
  },
  fileUrl: { type: String }, // Path to uploaded file
  fileType: { type: String }, // mime-type
  fileSize: { type: Number },
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  lastViewed: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  ocrText: { type: String }, // Extracted text from images/PDFs
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Index for search
ResourceSchema.index({ title: 'text', content: 'text', ocrText: 'text', subject: 'text', tags: 'text' });

export default mongoose.model('Resource', ResourceSchema);
