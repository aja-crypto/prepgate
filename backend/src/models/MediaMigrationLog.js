// src/models/MediaMigrationLog.js — per-file migration audit trail (Requirement 7).
// Stored separately from MediaFile so runtime records stay clean.
// Fields: old path, Cloudinary public_id, category, upload result, verification result, rollback status.

const mongoose = require('mongoose');

const mediaMigrationLogSchema = new mongoose.Schema(
  {
    oldPath: { type: String, required: true },
    publicId: { type: String, default: '' },
    category: { type: String, default: '' },
    sha256: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    upload: {
      status: { type: String, enum: ['not_run', 'ok', 'failed', 'skipped'], default: 'not_run' },
      error: { type: String, default: '' },
      at: { type: Date },
    },
    verification: {
      status: { type: String, enum: ['not_run', 'ok', 'failed'], default: 'not_run' },
      errors: [{ type: String }],
      at: { type: Date },
    },
    rollback: {
      status: { type: String, enum: ['not_run', 'kept', 'reverted'], default: 'not_run' },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

mediaMigrationLogSchema.index({ oldPath: 1 }, { unique: true });
mediaMigrationLogSchema.index({ category: 1, 'upload.status': 1 });
mediaMigrationLogSchema.index({ 'verification.status': 1 });

let MediaMigrationLog;
try {
  MediaMigrationLog = mongoose.model('MediaMigrationLog');
} catch {
  MediaMigrationLog = mongoose.model('MediaMigrationLog', mediaMigrationLogSchema);
}

module.exports = MediaMigrationLog;
module.exports.MediaMigrationLog = MediaMigrationLog;
module.exports.mediaMigrationLogSchema = mediaMigrationLogSchema;