// Soft-deleted progress snapshots — recoverable for 30 days
const mongoose = require('mongoose');

const progressSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  reason: {
    type: String,
    enum: ['reset', 'account_delete'],
    required: true,
  },
  deletedAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, { timestamps: true });

progressSnapshotSchema.index({ user: 1, deletedAt: -1 });

module.exports = mongoose.model('ProgressSnapshot', progressSnapshotSchema);
