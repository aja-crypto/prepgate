const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
      'welcome', 'onboarding_roadmap', 'onboarding_pyq', 'onboarding_focus',
      'onboarding_notes', 'onboarding_mistakes', 'onboarding_progress',
      'onboarding_ai', 'onboarding_weekly_review',
      'onboarding_consolidate', 'onboarding_next_week', 'onboarding_gatenexa_ai',
      'first_topic', 'streak_7', 'pyq_100', 'first_mock', 'hours_50', 'level_up',
      'todays_focus', 'deep_work_reminder', 'revision_due', 'revision_reminder',
      'planner_reminder', 'daily_insight', 'weekly_progress', 'streak_at_risk',
      'weekend_sprint', 'mock_reminder', 'pyq_streak', 'formula_drill',
      'community_highlight', 'brain_byte', 'weekend_warrior', 'weekly_challenge',
      'daily_nudge', 'daily_digest', 'focus_timer_end', 'leaderboard_update',
      'error_analyzer', 'mentor_reply', 'community_post', 'social_study',
      'learning_suggestion', 'roadmap_suggestion', 'ai_recommendation',
      'early_access', 'maintenance', 'feature_update',
      'study_suggestion', 'preparation_milestone', 'weekly_summary',
      'resource_update', 'gate_update',
      'feedback_received', 'feedback_reply', 'feedback_status',
    ],
    default: 'feature_update',
  },
  title: { type: String, required: true },
  body: { type: String },
  message: { type: String },
  emoji: { type: String, default: '🔔' },
  category: { type: String, default: 'announcement', index: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'active_users', 'inactive_users', 'premium_users', 'free_users'],
    default: 'all',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft',
  },
  imageUrl: { type: String, default: '' },
  actionButtonText: { type: String, default: '' },
  actionUrl: { type: String, default: '' },
  action: {
    label: { type: String, default: 'View' },
    path: { type: String },
    href: { type: String },
  },
  recurrence: { type: mongoose.Schema.Types.Mixed, default: { type: 'none' } },
  analytics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    dismissed: { type: Number, default: 0 },
  },
  sentAt: { type: Date, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
    index: true,
  },
  metadata: {
    videoId: String,
    storyId: String,
    subject: String,
    topic: String,
    duration: Number,
    difficulty: String,
    progress: Number,
    ticketId: String,
    replyId: String,
    feedbackType: String,
    status: String,
  },
  isRead: { type: Boolean, default: false },
  isBookmarked: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: Date.now },
  deliveredAt: Date,
  expiresAt: Date,
  notificationKey: {
    type: String,
    trim: true,
    index: true,
  },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, scheduledAt: -1 });
notificationSchema.index({ user: 1, type: 1, scheduledAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, type: 1, scheduledAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, scheduledAt: -1 });
notificationSchema.index(
  { user: 1, notificationKey: 1 },
  {
    unique: true,
    name: 'user_notificationKey_unique',
    partialFilterExpression: {
      notificationKey: { $exists: true, $type: 'string', $gt: '' },
    },
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
