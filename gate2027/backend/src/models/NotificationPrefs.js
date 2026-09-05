// src/models/NotificationPrefs.js – Per-user notification preferences (timezone-aware)
const mongoose = require('mongoose');

const notificationPrefsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    enabled: { type: Boolean, default: true },
    maxPerDay: { type: Number, default: 5, min: 0, max: 20 },
    // Daily counters — reset when todayDate changes (Asia/Kolkata).
    todayCount: { type: Number, default: 0, min: 0 },
    todayDate: { type: String, default: '' }, // YYYY-MM-DD (Asia/Kolkata)
    lastSentAt: { type: Date, default: null },
    quietHoursStart: { type: String, default: null }, // "HH:MM" or null
    quietHoursEnd: { type: String, default: null },
    categories: {
      daily: { type: Boolean, default: true },
      onboarding: { type: Boolean, default: true },
      event: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      reminder: { type: Boolean, default: true },
      milestone: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationPrefs', notificationPrefsSchema);
