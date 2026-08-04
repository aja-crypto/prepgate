const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['logout', 'refresh_rotate', 'password_reset', 'admin_revoke'],
    default: 'logout',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
}, { timestamps: true });

tokenBlacklistSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
