const mongoose = require('mongoose');

const visualizationSchema = new mongoose.Schema({
  type: { type: String, enum: ['chart', 'timeline', 'heatmap', 'comparison', 'progress', 'table', 'rank', 'gauge', 'map', 'custom'], required: true },
  title: String,
  chartType: { type: String, enum: ['bar', 'line', 'pie', 'doughnut', 'radar', 'scatter', 'area', 'horizontalBar'] },
  data: mongoose.Schema.Types.Mixed,
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const kpiSchema = new mongoose.Schema({
  label: String,
  value: mongoose.Schema.Types.Mixed,
  suffix: String,
  prefix: String,
  trend: { type: String, enum: ['up', 'down', 'neutral', 'new'] },
  changePercent: Number,
  icon: String,
  color: String,
  rank: Number,
  total: Number,
}, { _id: false });

const filterSchema = new mongoose.Schema({
  key: String,
  label: String,
  type: { type: String, enum: ['select', 'multi', 'range', 'search', 'date'], default: 'select' },
  options: [mongoose.Schema.Types.Mixed],
  defaultValue: mongoose.Schema.Types.Mixed,
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  title: String,
  description: String,
  action: String,
  actionUrl: String,
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  icon: String,
  color: String,
}, { _id: false });

const insightSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  type: { type: String, enum: ['blueprint', 'qa', 'subjects', 'high-roi', 'mistakes', 'strategies', 'community', 'dsa', 'roadmap', 'academy', 'resource', 'custom'], required: true },
  category: { type: String, default: 'General' },
  icon: String,
  color: { type: String, default: '#8B5CF6' },

  hero: {
    title: String,
    subtitle: String,
    aiConfidence: { type: Number, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
    backgroundGradient: [String],
  },

  summary: { type: String, maxlength: 2000 },
  content: mongoose.Schema.Types.Mixed,

  kpis: [kpiSchema],
  visualizations: [visualizationSchema],
  filters: [filterSchema],
  recommendations: [recommendationSchema],

  relatedInsights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IntelligenceReport' }],
  tags: [String],
  dataSources: [String],

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });

insightSchema.index({ type: 1, category: 1 });
insightSchema.index({ isActive: 1, isFeatured: 1 });
insightSchema.index({ slug: 1 });

module.exports = mongoose.model('IntelligenceReport', insightSchema);
