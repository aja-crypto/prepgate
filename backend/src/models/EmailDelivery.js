const mongoose = require('mongoose');

const emailDeliverySchema = new mongoose.Schema({
  eventKey: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  eventId: { type: String, required: true },
  recipient: { type: String, required: true },
  status: { type: String, enum: ['sending', 'sent', 'failed'], required: true },
  providerMessageId: { type: String, default: null },
  errorCode: { type: String, default: null },
  errorMessage: { type: String, default: null },
  sentAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('EmailDelivery', emailDeliverySchema);
