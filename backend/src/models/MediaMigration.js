// src/models/MediaMigration.js — per-folder migration job state.
// Enables resumable, idempotent backfill (Requirement 3) and phase tracking.

const mongoose = require('mongoose');

const mediaMigrationSchema = new mongoose.Schema(
  {
    folder: { type: String, required: true, unique: true }, // source dir name
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
    },
    total: { type: Number, default: 0 },
    done: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 }, // already-migrated, idempotency counter
    errored: [{ type: String }],
    startedAt: { type: Date },
    finishedAt: { type: Date },
    lastError: { type: String, default: '' },
  },
  { timestamps: true }
);

mediaMigrationSchema.index({ status: 1 });

let MediaMigration;
try {
  MediaMigration = mongoose.model('MediaMigration');
} catch {
  MediaMigration = mongoose.model('MediaMigration', mediaMigrationSchema);
}

module.exports = MediaMigration;
module.exports.MediaMigration = MediaMigration;
module.exports.mediaMigrationSchema = mediaMigrationSchema;