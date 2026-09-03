const mongoose = require('mongoose');

const notifPrefsSchema = new mongoose.Schema({
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
    default: 3,
    min: 1,
    max: 5,
  },
  quietHoursStart: { type: Number, default: 22 },
  quietHoursEnd: { type: Number, default: 7 },
  categories: {
    study: { type: Boolean, default: true },
    onboarding: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    motivation: { type: Boolean, default: true },
    revision: { type: Boolean, default: true },
    insights: { type: Boolean, default: true },
    gate_updates: { type: Boolean, default: true },
    gatenexa: { type: Boolean, default: true },
  },
  seenStories: [String],
  seenMotivations: [String],
  seenLearningHub: [String],
  seenDiscovery: [String],
  seenSuccessStories: [String],
  lastSentAt: { type: Date, default: null },
  todayCount: { type: Number, default: 0 },
  todayDate: { type: String, default: '' },
  onboardingSeeded: { type: Boolean, default: false },
  baselineSeeded: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('NotificationPrefs', notifPrefsSchema);
