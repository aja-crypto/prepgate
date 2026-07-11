const mongoose = require('mongoose');

const coapCutoffSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  institute: { type: String, required: true },
  instituteType: { type: String, enum: ['IIT', 'NIT', 'IIIT', 'GFTI', 'Other'], required: true },
  program: { type: String, required: true },
  specialization: { type: String, default: '' },
  category: { type: String, enum: ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'], required: true },
  offerRound: { type: Number, required: true },
  openingScore: { type: Number, default: null },
  closingScore: { type: Number, required: true },
  seats: { type: Number, default: null },
  filledSeats: { type: Number, default: null },
  vacancy: { type: Number, default: null },
  source: { type: String, enum: ['official', 'coap', 'admin'], default: 'coap' },
}, { timestamps: true });

coapCutoffSchema.index({ year: -1, institute: 1, program: 1 });
coapCutoffSchema.index({ year: -1, offerRound: 1 });

module.exports = mongoose.model('CoapCutoff', coapCutoffSchema);
