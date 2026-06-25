const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  category: {
    type: String,
    enum: ['study', 'mock_tests', 'notes', 'motivation', 'announcement', 'emergency', 'achievement'],
    default: 'announcement',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  imageUrl: { type: String, default: null },
  actionButtonText: { type: String, default: null },
  actionUrl: { type: String, default: null },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'active_users', 'inactive_users', 'premium_users', 'free_users', 'subject_cs', 'subject_math', 'subject_aptitude'],
    default: 'all',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft',
  },
  scheduledAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  recurrence: {
    type: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    nextRunAt: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  analytics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    dismissed: { type: Number, default: 0 },
  },
  isAutomated: { type: Boolean, default: false },
  automatedType: {
    type: String,
    enum: [null, 'focus_reminder', 'mock_test_reminder', 'goal_reminder', 'streak_reminder'],
    default: null,
  },
}, { timestamps: true });

notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ targetAudience: 1, status: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
