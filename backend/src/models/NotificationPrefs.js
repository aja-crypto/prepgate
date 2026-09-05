const mongoose = require('mongoose');

const notificationPrefsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  maxPerDay: {
    type: Number,
    default: 5,
    min: 0,
    max: 20,
  },
  todayCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  todayDate: {
    type: String,
    default: '',
  },
  lastSentAt: {
    type: Date,
    default: null,
  },
  quietHoursStart: {
    type: String,
    default: '23:00',
  },
  quietHoursEnd: {
    type: String,
    default: '06:30',
  },
  categories: {
    study: { type: Boolean, default: true },
    motivation: { type: Boolean, default: true },
    revision: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    insights: { type: Boolean, default: true },
    onboarding: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

notificationPrefsSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.models.NotificationPrefs
  || mongoose.model('NotificationPrefs', notificationPrefsSchema);
