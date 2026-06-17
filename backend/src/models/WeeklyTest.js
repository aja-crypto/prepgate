const mongoose = require('mongoose');

const weeklyTestSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true },
  subjectName: { type: String, required: true },
  testNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: Number, default: 30 },
  totalMarks: { type: Number, default: 25 },
  questionCount: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  topics: [String],
  pdfUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

weeklyTestSchema.index({ subject: 1, testNumber: 1 }, { unique: true });

const userTestProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyTest', required: true },
  isCompleted: { type: Boolean, default: false },
  score: { type: Number, default: null },
  totalMarks: { type: Number, default: null },
  accuracy: { type: Number, default: null },
  timeTaken: { type: Number, default: null },
  attemptedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

userTestProgressSchema.index({ user: 1, test: 1 }, { unique: true });

let WeeklyTest, UserTestProgress;
try {
  WeeklyTest = mongoose.model('WeeklyTest');
} catch {
  WeeklyTest = mongoose.model('WeeklyTest', weeklyTestSchema);
}
try {
  UserTestProgress = mongoose.model('UserTestProgress');
} catch {
  UserTestProgress = mongoose.model('UserTestProgress', userTestProgressSchema);
}

module.exports = { WeeklyTest, UserTestProgress };
