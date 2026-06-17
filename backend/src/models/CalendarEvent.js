const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  subject: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  hours: { type: Number, required: true, min: 0.5, max: 24 },
  notes: { type: String, default: '', trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
}, { timestamps: true });

calendarEventSchema.index({ user: 1, date: 1 });
calendarEventSchema.index({ user: 1, completed: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

module.exports = { CalendarEvent };