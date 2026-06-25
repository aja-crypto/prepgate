const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 2000 },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestedByName: { type: String, default: 'Anonymous' },
  votes: { type: Number, default: 1 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'rejected'],
    default: 'planned',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  sourceTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackTicket', default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

userRequestSchema.index({ status: 1, votes: -1 });
userRequestSchema.index({ votes: -1 });

module.exports = mongoose.model('UserRequest', userRequestSchema);
