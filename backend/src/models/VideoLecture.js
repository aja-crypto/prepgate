const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/VideoLecture.js – NPTEL and YouTube video lectures
const videoLectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  description: {
    type: String,
    maxlength: 2000,
  },
  subject: {
    type: String,
    required: true,
    index: true,
  },
  topic: {
    type: String,
    required: true,
    index: true,
  },
  // Video source
  source: {
    type: String,
    enum: ['NPTEL', 'YouTube', 'Coursera', 'Udemy', 'Gate Wallah', 'Other'],
    required: true,
  },
  sourceId: String, // YouTube video ID or NPTEL course ID
  sourceUrl: {
    type: String,
    required: true,
  },
  // Thumbnail
  thumbnailUrl: String,
  // Duration
  duration: {
    minutes: Number,
    seconds: Number,
  },
  // Instructor
  instructor: {
    name: String,
    bio: String,
    institution: String,
  },
  // Content metadata
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  language: {
    type: String,
    enum: ['English', 'Hindi', 'Bilingual'],
    default: 'English',
  },
  // GATE relevance
  gateRelevance: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  // Topics covered (sub-topics)
  topicsCovered: [String],
  // Timestamps for key sections (for YouTube videos)
  chapters: [{
    timestamp: String, // "0:00"
    title: String,
  }],
  // Quality and ratings
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  // Playlist info
  playlist: {
    name: String,
    sourceUrl: String,
    order: Number,
  },
  // Status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Transcript/captions available
  hasCaptions: {
    type: Boolean,
    default: false,
  },
  captionLanguages: [String],
  // Tags
  tags: [String],
  // Source-specific metadata
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Indexes
videoLectureSchema.index({ subject: 1, topic: 1 });
videoLectureSchema.index({ source: 1, gateRelevance: 1 });
videoLectureSchema.index({ difficulty: 1, gateRelevance: 1 });
videoLectureSchema.index({ helpfulCount: -1, viewCount: -1 });
videoLectureSchema.index({ tags: 1 });

// Virtual for formatted duration
videoLectureSchema.virtual('formattedDuration').get(function () {
  if (!this.duration) return '0:00';
  const { minutes, seconds } = this.duration;
  return `${minutes}:${String(seconds || 0).padStart(2, '0')}`;
});

// Virtual for YouTube thumbnail
videoLectureSchema.virtual('youtubeThumbnail').get(function () {
  if (this.source === 'YouTube' && this.sourceId) {
    return `https://img.youtube.com/vi/${this.sourceId}/hqdefault.jpg`;
  }
  return this.thumbnailUrl;
});

const VideoLecture = mongoose.model('VideoLecture', videoLectureSchema);

module.exports = VideoLecture;