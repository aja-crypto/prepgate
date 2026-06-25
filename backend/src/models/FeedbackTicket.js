const mongoose = require('mongoose');

const feedbackTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'Anonymous' },
  userEmail: { type: String, default: '' },
  category: {
    type: String,
    enum: ['bug_report', 'feature_request', 'question', 'complaint', 'suggestion', 'appreciation'],
    required: true,
  },
  subject: { type: String, default: '' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 5000 },
  screenshotUrl: { type: String, default: null },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['unread', 'in_progress', 'resolved', 'archived'],
    default: 'unread',
  },
  deviceInfo: {
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    screen: { type: String, default: '' },
  },
  replyCount: { type: Number, default: 0 },
  lastReplyAt: { type: Date, default: null },
  lastReplyBy: { type: String, default: null },
  resolvedAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

feedbackTicketSchema.index({ status: 1, createdAt: -1 });
feedbackTicketSchema.index({ category: 1, status: 1 });
feedbackTicketSchema.index({ priority: 1, status: 1 });
feedbackTicketSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('FeedbackTicket', feedbackTicketSchema);
