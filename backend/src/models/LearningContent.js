const mongoose = require('mongoose');

const learningContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['roadmap', 'academy', 'success_story', 'resource', 'update'],
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  // Video content
  youtubeUrl: {
    type: String,
    default: null,
  },
  youtubeId: {
    type: String,
    default: null,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  duration: {
    type: String,
    default: null,
  },
  views: {
    type: Number,
    default: 0,
  },
  uploadDate: {
    type: Date,
    default: null,
  },
  // Roadmap fields
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', null],
    default: null,
  },
  estimatedWatches: {
    type: String,
    default: null,
  },
  // Resource fields
  resourceUrl: {
    type: String,
    default: null,
  },
  resourceCategory: {
    type: String,
    default: null,
  },
  // Tags and categorization
  tags: [{
    type: String,
    trim: true,
  }],
  category: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  // For updates (timeline)
  version: {
    type: String,
    default: null,
  },
  updateType: {
    type: String,
    enum: ['feature', 'improvement', 'fix', 'update', null],
    default: null,
  },
  // For resources
  resourceType: {
    type: String,
    enum: ['official', 'pdf', 'link', 'book', 'paper', null],
    default: null,
  },
  isOfficial: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

learningContentSchema.index({ type: 1, isActive: 1, order: 1 });
learningContentSchema.index({ tags: 1 });
learningContentSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('LearningContent', learningContentSchema);
