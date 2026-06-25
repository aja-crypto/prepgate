// src/controllers/authController.js – Authentication Controller
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const { MockTest, Note } = require('../models');
const { generateTokens } = require('../middleware/auth');
const { sendEmail, isSmtpConfigured } = require('../utils/email');
const { isMockAuthEnabled } = require('../config/devMode');
const { getEmptyProgressData } = require('../utils/emptyProgress');
const mockStore = require('../store/mockStore');

const mockUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  streak: user.streak,
  preferences: user.preferences,
  targetYear: user.targetYear,
  studyGoalHours: user.studyGoalHours,
  isVerified: user.isVerified ?? false,
  authProvider: user.authProvider || 'local',
});

async function verifyGoogleToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Google TokenInfo] Status:', res.status, 'Body:', body);
    throw new Error(`Invalid Google token (status ${res.status}): ${body}`);
  }
  const payload = await res.json();
  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    console.error('[Google TokenInfo] Audience mismatch:', { expected: process.env.GOOGLE_CLIENT_ID, got: payload.aud });
    throw new Error('Google token audience mismatch');
  }
  return payload;
}

async function sendVerificationEmail(user, rawToken) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'GATE 2027 – Verify Your Email',
    html: `
      <h2>Welcome to GATE 2027!</h2>
      <p>Hi ${user.name},</p>
      <p>Please verify your email address to secure your account.</p>
      <a href="${verifyUrl}" style="background:#4f8dff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (isMockAuthEnabled()) {
      if (mockStore.emailExists(email)) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      const user = await mockStore.createMockUser({ name, email, password });
      const { accessToken, refreshToken } = generateTokens(user._id);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: { user: mockStore.formatUser(user), accessToken, refreshToken },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user with empty progress — no demo data
    const emptyData = getEmptyProgressData();
    const user = await User.create({
      name,
      email,
      password,
      progressBackup: { data: emptyData, updatedAt: new Date() },
    });

    // Send verification email (non-blocking)
    try {
      const verifyToken = user.generateVerifyToken();
      await user.save({ validateBeforeSave: false });
      await sendVerificationEmail(user, verifyToken);
      if (process.env.NODE_ENV === 'development' && !isSmtpConfigured()) {
        user.isVerified = true;
        user.verifyEmailToken = undefined;
        user.verifyEmailExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Email optional — account still created
      if (process.env.NODE_ENV === 'development' && !isSmtpConfigured()) {
        user.isVerified = true;
        await user.save({ validateBeforeSave: false });
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          streak: user.streak,
          preferences: user.preferences,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/google
 * @desc   Sign in / register with Google ID token
 * @access Public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token required.' });
    }

    const payload = await verifyGoogleToken(idToken);
    const { email, name, sub: googleId, picture } = payload;

    if (isMockAuthEnabled()) {
      let user = mockStore.findByEmail(email);
      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        user = await mockStore.createMockUser({
          name: name || email.split('@')[0],
          email,
          password: crypto.randomBytes(16).toString('hex'),
        });
      }
      // Always sync Google profile fields (covers both new and existing users)
      user.googleId = googleId;
      user.authProvider = 'google';
      user.isVerified = true;
      if (picture) user.avatar = picture;
      user.lastLogin = new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(user._id);
      return res.json({
        success: true,
        message: 'Google sign-in successful!',
        data: { user: mockUserResponse(user), accessToken, refreshToken, isNewUser },
      });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const emptyData = getEmptyProgressData();
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        isVerified: true,
        avatar: picture || null,
        progressBackup: { data: emptyData, updatedAt: new Date() },
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      user.isVerified = true;
      if (picture) user.avatar = picture;
      await user.save({ validateBeforeSave: false });
    }

    if (user.deletedAt) {
      return res.status(403).json({ success: false, message: 'Account is scheduled for deletion. Contact support to restore.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    res.json({
      success: true,
      message: isNewUser ? 'Account created with Google!' : 'Google sign-in successful!',
      data: { user: mockUserResponse(user), accessToken, refreshToken, isNewUser },
    });
  } catch (error) {
    console.error('[Google Auth Error]', error.message || error);
    return res.status(401).json({ success: false, message: 'Google authentication failed.', detail: error.message });
  }
};

/**
 * @route  GET /api/auth/verify-email/:token
 * @desc   Verify email address
 * @access Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Email verification skipped in mock mode.' });
    }

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      verifyEmailToken: hashed,
      verifyEmailExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }

    user.isVerified = true;
    user.verifyEmailToken = undefined;
    user.verifyEmailExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/resend-verification
 * @desc   Resend email verification
 * @access Private
 */
exports.resendVerification = async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      const mockUser = mockStore.findById(req.user._id);
      if (mockUser) mockUser.isVerified = true;
      return res.json({ success: true, message: 'Email auto-verified in dev mode.' });
    }

    const user = await User.findById(req.user._id);
    if (user.isVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    const verifyToken = user.generateVerifyToken();
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user, verifyToken);

    if (process.env.NODE_ENV === 'development' && !isSmtpConfigured()) {
      user.isVerified = true;
      user.verifyEmailToken = undefined;
      user.verifyEmailExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.json({
        success: true,
        message: 'Email auto-verified in dev mode (check server console for verification link).',
      });
    }

    res.json({ success: true, message: 'Verification email sent!' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/auth/change-password
 * @desc   Change password (logged in)
 * @access Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (!user || !(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.json({ success: true, message: 'Password changed successfully.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ success: false, message: 'Set a password via forgot-password flow for Google accounts.' });
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/auth/account
 * @desc   Soft-delete account (recoverable for 30 days)
 * @access Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (isMockAuthEnabled()) {
      mockStore.deleteUser(userId);
      return res.json({ success: true, message: 'Account deleted (mock mode).' });
    }

    const user = await User.findById(userId).select('+password');
    if (user.authProvider === 'local' && password) {
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }
    }

    const snapshotData = user.progressBackup?.data || getEmptyProgressData();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await ProgressSnapshot.create({
      user: userId,
      data: snapshotData,
      reason: 'account_delete',
      expiresAt,
    });

    user.deletedAt = new Date();
    user.progressBackup = { data: getEmptyProgressData(), updatedAt: new Date() };
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Account scheduled for deletion. Data recoverable for 30 days.',
      data: { expiresAt },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/login
 * @desc   Login user and return JWT tokens
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    if (isMockAuthEnabled()) {
      const user = mockStore.findByEmail(email);
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
      user.updateStreak();
      user.lastLogin = new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(user._id);
      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: { user: mockUserResponse(user), accessToken, refreshToken },
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update streak
    user.updateStreak();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: mockUserResponse(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/refresh
 * @desc   Refresh access token using refresh token
 * @access Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
      }
      const tokens = generateTokens(user._id);
      return res.json({ success: true, data: tokens });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

/**
 * @route  GET /api/auth/me
 * @desc   Get current logged-in user
 * @access Private
 */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * @route  PUT /api/auth/profile
 * @desc   Update user profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, studyGoalHours, targetYear, preferences } = req.body;

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      if (name) user.name = name;
      if (studyGoalHours !== undefined) user.studyGoalHours = studyGoalHours;
      if (targetYear !== undefined) user.targetYear = targetYear;
      if (preferences) user.preferences = { ...user.preferences, ...preferences };
      return res.json({ success: true, data: { user: mockStore.formatUser(user) } });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, studyGoalHours, targetYear, preferences },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

exports.registerFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'FCM token required' });

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (user) user.fcmToken = token;
      return res.json({ success: true, message: 'FCM token registered (mock mode)' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/forgot-password
 * @desc   Send password reset email
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.json({
        success: true,
        message: 'Password reset is unavailable in mock auth mode. Use demo credentials or register a new account.',
      });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Don't reveal if email exists (security)
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent.',
      });
    }

    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'GATE 2027 – Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset for your GATE 2027 account.</p>
          <a href="${resetUrl}" style="background:#4f8dff;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
            Reset Password
          </a>
          <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        `,
      });

      res.json({ success: true, message: 'Reset email sent!' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/auth/reset-password/:token
 * @desc   Reset password with token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Password reset is unavailable in mock auth mode.',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      message: 'Password reset successful!',
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

