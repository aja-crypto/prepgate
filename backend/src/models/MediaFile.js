// src/models/MediaFile.js — single metadata source of truth for ALL files (Decision 2)
// Holds metadata + cloud references only. NEVER stores binary data.
// Category A (frontend assets) is intentionally NOT stored here.

const mongoose = require('mongoose');

const MEDIA_CATEGORIES = [
  'gate-papers', 'short-notes', 'resources', 'notes', 'gatevault', 'pyq',
  'weekly-tests', 'video', 'admin-pdf', 'user', 'ai',
];
const MEDIA_VISIBILITY = ['public', 'premium', 'private'];
const MEDIA_TYPES = ['pdf', 'image', 'video', 'raw'];
const MEDIA_RESOURCE_TYPES = ['image', 'video', 'raw', 'auto'];

const mediaFileSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    topic: { type: String, default: '' },
    category: { type: String, enum: MEDIA_CATEGORIES, required: true, index: true },
    type: { type: String, enum: MEDIA_TYPES, required: true },
    public_id: { type: String, required: true, unique: true },
    secure_url: { type: String, required: true },
    resource_type: { type: String, enum: MEDIA_RESOURCE_TYPES, default: 'auto' },
    mime_type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    sha256: { type: String, default: '' },
    visibility: { type: String, enum: MEDIA_VISIBILITY, default: 'public' },
    folder: { type: String, default: '' },
    storage_provider: { type: String, default: 'cloudinary' },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    tags: [{ type: String }],
    version: { type: Number, default: 1 },
    download_count: { type: Number, default: 0 },
    view_count: { type: Number, default: 0 },
    // Legacy relative path (e.g. /uploads/gate-papers/GATE2008.pdf) used for
    // redirects during migration (Decision 6) and rollback.
    legacy_path: { type: String, default: '' },
    // Domain extras (year, set, folder, testNumber ...) kept here, not duplicated.
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

mediaFileSchema.index({ legacy_path: 1 });
mediaFileSchema.index({ category: 1, visibility: 1 });
mediaFileSchema.index({ subject: 1 });
mediaFileSchema.index({ owner: 1 });

let MediaFile;
try {
  MediaFile = mongoose.model('MediaFile');
} catch {
  MediaFile = mongoose.model('MediaFile', mediaFileSchema);
}

// Boot hook: create/refresh indexes once connected. Idempotent + never throws.
async function ensureMediaFileIndexes() {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await MediaFile.init();
    console.log('✅ [MediaFile] indexes ensured');
    return true;
  } catch (e) {
    console.error('❌ [MediaFile] index init failed:', e.message);
    return false;
  }
}

module.exports = MediaFile;
module.exports.MediaFile = MediaFile;
module.exports.mediaFileSchema = mediaFileSchema;
module.exports.MEDIA_CATEGORIES = MEDIA_CATEGORIES;
module.exports.MEDIA_VISIBILITY = MEDIA_VISIBILITY;
module.exports.MEDIA_TYPES = MEDIA_TYPES;
module.exports.MEDIA_RESOURCE_TYPES = MEDIA_RESOURCE_TYPES;
module.exports.ensureMediaFileIndexes = ensureMediaFileIndexes;