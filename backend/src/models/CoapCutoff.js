const mongoose = require('mongoose');

const coapCutoffSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  institute: { type: String, required: true },
  instituteType: { type: String, enum: ['IIT', 'NIT', 'IIIT', 'GFTI', 'Other'], required: true },
  program: { type: String, required: true },
  specialization: { type: String, default: '' },
  category: { type: String, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'], required: true },
  offerRound: { type: Number, required: true },
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
  seats: { type: Number, default: null },
  filledSeats: { type: Number, default: null },
  vacancy: { type: Number, default: null },
  source: { type: String, enum: ['official', 'coap', 'admin'], default: 'coap' },
  dataStatus: { type: String, enum: ['verified', 'fallback', 'placeholder', 'estimated'], default: 'fallback' },
}, { timestamps: true });

coapCutoffSchema.index({ year: -1, institute: 1, program: 1 });
coapCutoffSchema.index({ year: -1, offerRound: 1 });

module.exports = mongoose.model('CoapCutoff', coapCutoffSchema);
