// User notification inbox — DB is source of truth for generation state
const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'daily_study', 'revision', 'mock_test', 'goal_completion',
      'streak', 'exam_countdown', 'weekly_summary', 'achievement', 'insight',
    ],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  refId: { type: String, default: null },
  entityId: { type: String, default: null },
  dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD (IST)
  dedupeKey: { type: String, required: true },
  actionUrl: { type: String, default: null },
  read: { type: Boolean, default: false, index: true },
  scheduledFor: { type: Date, default: null },
}, { timestamps: true });

userNotificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
userNotificationSchema.index({ user: 1, dateKey: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
