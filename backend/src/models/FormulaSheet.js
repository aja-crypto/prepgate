const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// src/models/FormulaSheet.js – Subject-wise formula sheets for GATE
const formulaSheetSchema = new mongoose.Schema({
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
  // Formula details
  formulas: [{
    name: {
      type: String,
      required: true,
    },
    latex: String, // LaTeX format for rendering
    text: String, // Plain text version
    description: String,
    derivation: String, // How to derive
    conditions: [String], // When to use
    examples: [String], // Example applications
    memoryTip: String, // Mnemonic or tip to remember
    gateImportance: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    marksWeight: {
      type: Number,
      default: 1, // Expected marks in GATE
    },
    relatedFormulas: [String], // Related formula names
    source: String, // Reference book or resource
    imageUrl: String, // Diagram if applicable
  }],
  // Quick reference sections
  sections: [{
    title: String,
    content: String,
    order: Number,
  }],
  // Important constants
  constants: [{
    name: {
      type: String,
      required: true,
    },
    symbol: String,
    value: {
      type: String,
      required: true,
    },
    unit: String,
  }],
  // Key concepts
  keyConcepts: [{
    concept: String,
    explanation: String,
    example: String,
  }],
  // GATE-specific notes
  gateNotes: {
    type: String,
    maxlength: 2000,
  },
  // Previous GATE questions using these formulas
  gateQuestions: [{
    year: Number,
    questionNumber: Number,
    topic: String,
    marks: Number,
    url: String,
  }],
  // Creator info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationVotes: {
    type: Number,
    default: 0,
  },
  // Community stats
  viewCount: {
    type: Number,
    default: 0,
  },
  saveCount: {
    type: Number,
    default: 0,
  },
  // Status
  isPublished: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Tags for search
  tags: [String],
  // Difficulty level
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
}, { timestamps: true });

// Indexes
formulaSheetSchema.index({ subject: 1, topic: 1 });
formulaSheetSchema.index({ 'formulas.gateImportance': 1 });
formulaSheetSchema.index({ tags: 1 });
formulaSheetSchema.index({ viewCount: -1 });
formulaSheetSchema.index({ saveCount: -1 });

// Virtual for total formulas count
formulaSheetSchema.virtual('totalFormulas').get(function () {
  return this.formulas ? this.formulas.length : 0;
});

// Virtual for total marks weight
formulaSheetSchema.virtual('totalMarksWeight').get(function () {
  return this.formulas 
    ? this.formulas.reduce((sum, f) => sum + (f.marksWeight || 0), 0) 
    : 0;
});

const FormulaSheet = mongoose.model('FormulaSheet', formulaSheetSchema);

module.exports = FormulaSheet;