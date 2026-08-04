const mongoose = require('mongoose');

const learningHubVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 300,
  },
  youtubeUrl: {
    type: String,
    required: [true, 'YouTube URL is required'],
    trim: true,
  },
  youtubeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  channel: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Roadmaps', 'Motivation', 'Success Stories',
      'Subject Resources', 'Resources', 'Insights',
      'Preparation Strategy', 'Subject Lectures', 'Revision',
      'Interview Preparation', 'Productivity', 'Career Guidance'
    ],
    index: true,
  },
  subject: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  thumbnail: {
    type: String,
    default: null,
  },
  duration: {
    type: String,
    default: null,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', null],
    default: null,
  },
  language: {
    type: String,
    default: 'English',
  },
  featured: {
    type: Boolean,
    default: false,
    index: true,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

learningHubVideoSchema.index({ category: 1, featured: -1 });
learningHubVideoSchema.index({ subject: 1 });
learningHubVideoSchema.index({ tags: 1 });
learningHubVideoSchema.index({ title: 'text', description: 'text' }, { language_override: 'lang' });

/** Extract youtubeId from various YouTube URL formats */
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

learningHubVideoSchema.statics.extractYoutubeId = extractYoutubeId;

/** Auto-set youtubeId and thumbnail before save */
learningHubVideoSchema.pre('validate', function (next) {
  if (this.youtubeUrl && !this.youtubeId) {
    this.youtubeId = extractYoutubeId(this.youtubeUrl);
  }
  if (this.youtubeId && !this.thumbnail) {
    this.thumbnail = `https://img.youtube.com/vi/${this.youtubeId}/hqdefault.jpg`;
  }
  next();
});

const LearningHubVideo = mongoose.model('LearningHubVideo', learningHubVideoSchema);

module.exports = LearningHubVideo;
