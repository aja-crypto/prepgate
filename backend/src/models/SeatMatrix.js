const mongoose = require('mongoose');

const seatMatrixSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  institute: { type: String, required: true },
  instituteType: { type: String, enum: ['IIT', 'NIT', 'IIIT', 'GFTI', 'Other'], required: true },
  program: { type: String, required: true },
  specialization: { type: String, default: '' },
  totalSeats: { type: Number, required: true },
  seatsByCategory: {
    General: { type: Number, default: 0 },
    EWS: { type: Number, default: 0 },
    'OBC-NCL': { type: Number, default: 0 },
    SC: { type: Number, default: 0 },
    ST: { type: Number, default: 0 },
    PwD: { type: Number, default: 0 },
  },
  quotaSeats: {
    AI: { type: Number, default: 0 },
    HS: { type: Number, default: 0 },
    OS: { type: Number, default: 0 },
  },
  source: { type: String, enum: ['official', 'admin'], default: 'official' },
}, { timestamps: true });

seatMatrixSchema.index({ year: -1, institute: 1, program: 1 });

module.exports = mongoose.model('SeatMatrix', seatMatrixSchema);
