// src/models/Subject.js – Subject Schema
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    // e.g. 'OS', 'DBMS', 'CN', 'TOC'
  },
  icon: {
    type: String,
    default: '📚',
  },
  color: {
    type: String,
    default: '#4f8dff',
  },
  description: {
    type: String,
    maxlength: 500,
  },
  weightage: {
    type: Number, // marks weightage in GATE (out of 100)
    default: 9,
  },
  marksRange: {
    type: String, // e.g. "7–10 marks"
    default: '',
  },
  isHighPriority: {
    type: Boolean,
    default: false,
  },
  priorityRank: {
    type: Number,
    default: 99,
  },
  frequentlyAsked: [String],
  importantFormulas: [String],
  order: {
    type: Number,
    default: 0, // for sidebar ordering
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  syllabus: [{
    unit: String,
    topics: [String],
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: topic count
subjectSchema.virtual('topicCount', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'subject',
  count: true,
});

module.exports = mongoose.model('Subject', subjectSchema);
