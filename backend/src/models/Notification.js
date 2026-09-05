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
    required: true,
    trim: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  },
  category: {
    type: String,
    default: 'study',
    trim: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  action: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  notificationKey: {
    type: String,
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ user: 1, scheduledAt: -1 });

// Partial unique index: old documents without notificationKey stay valid.
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

module.exports = mongoose.models.Notification
  || mongoose.model('Notification', notificationSchema);
