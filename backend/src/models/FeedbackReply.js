const mongoose = require('mongoose');

const feedbackReplySchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackTicket', required: true },
  author: { type: String, required: true },
  authorRole: { type: String, enum: ['user', 'admin'], default: 'user' },
  message: { type: String, required: true, maxlength: 5000 },
  isAdminReply: { type: Boolean, default: false },
}, { timestamps: true });

feedbackReplySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('FeedbackReply', feedbackReplySchema);
