const mongoose = require('mongoose');

const ccmtCutoffSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  institute: { type: String, required: true },
  instituteType: { type: String, enum: ['IISc', 'IIT', 'NIT', 'IIIT', 'IIEST', 'GFTI', 'Other', 'Private'], required: true },
  program: { type: String, required: true },
  programCode: { type: String, default: '' },
  specialization: { type: String, default: '' },
  category: { type: String, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'], required: true },
  round: { type: Number, required: true },
  totalRounds: { type: Number, default: 7 },
  openingScore: {
    type: Number,
    default: null,
    min: [0, 'openingScore must be >= 0'],
    max: [1000, 'openingScore must be <= 1000'],
    validate: {
      validator: function (v) {
        if (v == null) return true;
        if (this.closingScore == null) return true;
        return v >= this.closingScore;
      },
      message: 'openingScore must be >= closingScore when both are present',
    },
  },
  closingScore: {
    type: Number,
    required: true,
    min: [0, 'closingScore must be >= 0'],
    max: [1000, 'closingScore must be <= 1000'],
  },
  openingRank: { type: Number, default: null },
  closingRank: { type: Number, default: null },
  seats: { type: Number, default: null },
  quota: { type: String, enum: ['AI', 'Home State', 'Other State', 'OS', 'HS', null], default: 'AI' },
  state: { type: String, default: '' },
  source: { type: String, enum: ['official', 'ccmt', 'coap', 'admin'], default: 'ccmt' },
  dataStatus: { type: String, enum: ['verified', 'fallback', 'placeholder', 'estimated'], default: 'fallback' },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: '' },
  dataHash: { type: String, default: '' },
}, { timestamps: true });

ccmtCutoffSchema.index({ year: -1, institute: 1, program: 1 });
ccmtCutoffSchema.index({ year: -1, instituteType: 1, category: 1 });
ccmtCutoffSchema.index({ year: -1, category: 1, round: 1 });
ccmtCutoffSchema.index({ year: -1, institute: 1, program: 1, category: 1 });

module.exports = mongoose.model('CcmtCutoff', ccmtCutoffSchema);
