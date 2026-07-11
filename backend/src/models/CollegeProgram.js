const mongoose = require('mongoose');

const collegeProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, default: '' },
  type: { type: String, required: true, enum: ['IIT', 'NIT', 'IIIT', 'GFTI', 'PSU', 'Research Institute', 'Private'] },
  location: { type: String, default: '' },
  state: { type: String, default: '' },
  website: { type: String, default: '' },
  nirfRanking: { type: Number, default: null },
  tier: { type: Number, default: null },

  // Placement data
  avgPlacement: { type: Number, default: null },
  highestPlacement: { type: Number, default: null },
  medianPlacement: { type: Number, default: null },
  placementPercentage: { type: Number, default: null },
  topRecruiters: { type: [String], default: [] },

  // Fee data
  fees: { type: Number, default: null },
  hostelFee: { type: Number, default: null },
  totalCost: { type: Number, default: null },
  roiScore: { type: Number, default: null },

  // Program data
  duration: { type: String, default: '2 Years' },
  intake: { type: Number, default: null },
  acceptedPapers: { type: [String], default: [] },
  curriculum: { type: String, default: '' },
  researchAreas: { type: [String], default: [] },

  // Ratings
  academicsRating: { type: Number, default: null },
  placementsRating: { type: Number, default: null },
  researchRating: { type: Number, default: null },
  campusRating: { type: Number, default: null },
  roiRating: { type: Number, default: null },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

collegeProgramSchema.index({ type: 1, state: 1 });
collegeProgramSchema.index({ name: 'text', shortName: 'text' });

module.exports = mongoose.model('CollegeProgram', collegeProgramSchema);
