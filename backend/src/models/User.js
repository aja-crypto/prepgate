// src/models/User.js – User Schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    required: function () { return !this.googleId; },
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: null,
  },
  targetYear: {
    type: Number,
    default: 2027,
  },
  studyGoalHours: {
    type: Number,
    default: 8, // daily target hours
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
  },
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    notifications: { type: Boolean, default: true },
  },
  progressBackup: {
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt: { type: Date, default: null },
  },
  fcmToken: { type: String, default: null },
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Email verification
  isVerified: { type: Boolean, default: false },
  verifyEmailToken: String,
  verifyEmailExpire: Date,
  lastLogin: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// ─── Hash password before save ──────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Generate email verification token ───────────────────────
userSchema.methods.generateVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verifyEmailToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// ─── Generate password reset token ─────────────────────────
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// ─── Update streak ──────────────────────────────────────────
userSchema.methods.updateStreak = function () {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastDate = this.streak.lastStudyDate
    ? new Date(this.streak.lastStudyDate).setHours(0, 0, 0, 0)
    : null;

  if (lastDate === today) return; // already logged today

  const yesterday = today - 86400000;
  if (lastDate === yesterday) {
    this.streak.current += 1;
  } else {
    this.streak.current = 1;
  }

  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
  this.streak.lastStudyDate = new Date();
};

module.exports = mongoose.model('User', userSchema);
