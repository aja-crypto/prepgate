const mongoose = require('mongoose');

const mockQuestionSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const mockTestSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true },
  subjectName: { type: String, required: true },
  testType: { type: String, enum: ['subject', 'topic', 'full'], default: 'subject' },
  topic: { type: String, default: '' },
  testNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: Number, default: 30 },
  totalMarks: { type: Number, default: 25 },
  questionCount: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  topics: [String],
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MockTestQuestion' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

mockTestSchema.index({ subject: 1, testNumber: 1 }, { unique: true });

const attemptAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTestQuestion', required: true },
  selectedAnswer: { type: Number, default: null },
  isCorrect: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
  mistakeCategory: {
    type: String,
    enum: ['', 'concept_error', 'formula_error', 'silly_mistake', 'time_pressure', 'guess'],
    default: '',
  },
}, { _id: false });

const userMockAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  attemptNumber: { type: Number, default: 1, min: 1 },
  answers: [attemptAnswerSchema],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  weakAreas: [String],
  strongAreas: [String],
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

userMockAttemptSchema.index({ user: 1, test: 1, attemptNumber: 1 }, { unique: true });

const mistakeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionText: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  yourAnswer: { type: String, default: '' },
  category: {
    type: String,
    enum: ['concept_error', 'formula_error', 'silly_mistake', 'time_pressure', 'guess'],
    required: true,
  },
  notes: { type: String, default: '' },
  sourceTest: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

mistakeEntrySchema.index({ user: 1, createdAt: -1 });

let MockTestQuestion, MockTest, UserMockAttempt, MistakeEntry;
try { MockTestQuestion = mongoose.model('MockTestQuestion'); } catch { MockTestQuestion = mongoose.model('MockTestQuestion', mockQuestionSchema); }
try { MockTest = mongoose.model('PreSeededMockTest'); } catch { MockTest = mongoose.model('PreSeededMockTest', mockTestSchema); }
try { UserMockAttempt = mongoose.model('UserMockAttempt'); } catch { UserMockAttempt = mongoose.model('UserMockAttempt', userMockAttemptSchema); }
try { MistakeEntry = mongoose.model('MistakeEntry'); } catch { MistakeEntry = mongoose.model('MistakeEntry', mistakeEntrySchema); }

module.exports = { MockTestQuestion, MockTest, UserMockAttempt, MistakeEntry };
