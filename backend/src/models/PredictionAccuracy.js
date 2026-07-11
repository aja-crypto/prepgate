const mongoose = require('mongoose');

const predictionAccuracySchema = new mongoose.Schema({
  overallAccuracy: { type: Number, default: 0 },
  totalPredictions: { type: Number, default: 0 },
  correctPredictions: { type: Number, default: 0 },
  incorrectPredictions: { type: Number, default: 0 },
  averageError: { type: Number, default: null },
  lastCalculated: { type: Date, default: Date.now },
  breakdownByYear: [{
    year: Number,
    total: Number,
    correct: Number,
    accuracy: Number,
  }],
  breakdownByCategory: [{
    category: String,
    total: Number,
    correct: Number,
    accuracy: Number,
  }],
  breakdownByRange: [{
    range: String,
    total: Number,
    correct: Number,
    accuracy: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('PredictionAccuracy', predictionAccuracySchema);
