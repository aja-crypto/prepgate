const mongoose = require('mongoose');

const predictionFeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prediction: { type: mongoose.Schema.Types.ObjectId, ref: 'PredictionHistory', required: true },
  isCorrect: { type: Boolean, required: true },
  actualRank: { type: Number, default: null },
  actualScore: { type: Number, default: null },
  actualCollege: { type: String, default: '' },
  actualProgram: { type: String, default: '' },
  feedbackText: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PredictionFeedback', predictionFeedbackSchema);
