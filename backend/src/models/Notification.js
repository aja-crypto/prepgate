const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'morning_mission', 'motivation', 'success_story', 'roadmap',
      'recommendation', 'dsa_challenge', 'revision', 'focus_reminder',
      'daily_content', 'weekly_report', 'did_you_know', 'quick_fact',
      'productivity_tip', 'campus_insight', 'success_spotlight',
      'learning_hub', 'discovery', 'smart_reminder', 'daily_inspiration',
      'login_day', 'milestone',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  emoji: { type: String, default: '🔔' },
  action: {
    label: { type: String, required: true },
    path: { type: String, required: true },
  },
  metadata: {
    videoId: String,
    storyId: String,
    subject: String,
    topic: String,
    duration: Number,
    difficulty: String,
    progress: Number,
  },
  isRead: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: Date.now },
  deliveredAt: Date,
  expiresAt: Date,
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, scheduledAt: -1 });
notificationSchema.index({ user: 1, type: 1, scheduledAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
