const mongoose = require('mongoose');

const predictionCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true, index: true },
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  output: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
  hitCount: { type: Number, default: 0 },
}, { timestamps: true });

predictionCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PredictionCache', predictionCacheSchema);
