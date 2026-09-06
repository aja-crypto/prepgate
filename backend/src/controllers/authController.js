// src/controllers/authController.js – Authentication Controller
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const { MockTest, Note } = require('../models');
const { generateTokens } = require('../middleware/auth');
const { add: blacklistToken, has: isTokenBlacklisted, blacklistAllForUser } = require('../middleware/tokenBlacklist');
const { isSmtpConfigured } = require('../utils/email');
const { sendTransactionalEmail, tokenEventId, maskRecipient } = require('../services/emailDeliveryService');
const { isMockAuthEnabled } = require('../config/devMode');
const { isDemoUser } = require('../utils/permissions');
const { getEmptyProgressData } = require('../utils/emptyProgress');
const mockStore = require('../store/mockStore');

const mockUserResponse = (user) => {
  const testUses = user.nexaPredictorTestUses || 0;
  const hasPremium = user.isPremium || user.premiumUnlockedViaReferral;
  return {
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
  isGuest: isDemoUser(user),
  isPremium: user.isPremium || false,
  plan: user.isPremium ? 'premium' : 'basic',
  avatar: user.avatar,
  badges: user.badges || [],
  nexaPredictorTestUses: testUses,
  ...(!hasPremium ? {
    testingAccess: true,
    testingLimit: 10,
    testingUsed: testUses,
    testingRemaining: Math.max(0, 10 - testUses),
  } : {}),
};
};

async function verifyGoogleToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // Try google-auth-library first (more reliable, no rate limits)
  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    return payload;
  } catch (libErr) {
    console.warn('[Google Auth] Library verification failed, falling back to tokeninfo:', libErr.message);
  }
  // Fallback: use tokeninfo endpoint
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Google TokenInfo] Status:', res.status, 'Body:', body);
    throw new Error(`Google authentication failed (status ${res.status})`);
  }
  const payload = await res.json();
  if (clientId && payload.aud !== clientId) {
    console.error('[Google TokenInfo] Audience mismatch:', { expected: clientId, got: payload.aud });
    throw new Error('Google token audience mismatch');
  }
  return payload;
}

const emailTemplates = require('../utils/emailTemplates');

async function sendWelcomeEmail(user) {
  const t = emailTemplates.welcome(user.name);
  return sendTransactionalEmail({
    type: 'welcome',
    eventId: String(user._id),
    to: user.email,
    subject: t.subject,
    html: t.html,
    text: t.text,
  });
}

async function sendVerificationEmail(user, rawToken) {
  const t = emailTemplates.verification(user.name, `${process.env.FRONTEND_URL}/verify-email/${rawToken}`);
  return sendTransactionalEmail({
    type: 'verification',
    eventId: tokenEventId(rawToken),
    to: user.email,
    subject: t.subject,
    html: t.html,
    text: t.text,
  });
}

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, refCode } = req.body;

    if (isMockAuthEnabled()) {
      if (mockStore.emailExists(email)) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      const user = await mockStore.createMockUser({ name, email, password });
      const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
      if (refCode) {
        try {
          const localReferralStore = require('../store/localReferralStore');
          localReferralStore.claimReferral(refCode.toUpperCase(), user._id.toString(), email);
        } catch (e) {}
      }
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
    function genRefCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }
    const user = await User.create({
      name,
      email,
      password,
      referralCode: genRefCode(),
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

    // Process referral code if present
    if (refCode) {
      try {
        const referrer = await User.findOne({ referralCode: refCode.toUpperCase() });
        if (referrer && referrer._id.toString() !== user._id.toString()) {
          user.referredBy = referrer._id;
          referrer.pendingReferrals = referrer.pendingReferrals || [];
          if (!referrer.pendingReferrals.some(id => id.toString() === user._id.toString())) {
            referrer.pendingReferrals.push(user._id);
          }
          referrer.markModified('pendingReferrals');
          await referrer.save();
          await user.save();
        }
      } catch (e) {}
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
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
 * @route  POST /api/auth/google
 * @desc   Sign in / register with Google ID token
 * @access Public
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const email = 'demo@gate2027.in';
    if (isMockAuthEnabled()) {
      const user = mockStore.findByEmail(email);
      if (!user) {
        return res.status(500).json({ success: false, message: 'Demo account not found. Run seed first.' });
      }
      user.updateStreak();
      user.lastLogin = new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
      return res.status(200).json({
        success: true, message: 'Demo login successful!',
        data: { user: mockUserResponse(user), accessToken, refreshToken },
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({ success: false, message: 'Demo account not configured.' });
    }
    user.updateStreak();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
    res.status(200).json({
      success: true, message: 'Demo login successful!',
      data: { user: mockUserResponse(user), accessToken, refreshToken },
    });
  } catch (error) { next(error); }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token required.' });
    }

    // In mock mode, skip Google token verification — use idToken as email
    if (isMockAuthEnabled()) {
      let email = idToken;
      // If idToken looks like a real JWT, extract email from it
      if (idToken.includes('.') && idToken.length > 100) {
        try {
          const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
          email = payload.email || email;
        } catch {}
      }
      const name = email.split('@')[0];
      let user = mockStore.findByEmail(email);
      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        user = await mockStore.createMockUser({
          name, email,
          password: crypto.randomBytes(16).toString('hex'),
        });
      }
      user.authProvider = 'google';
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
      const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
      return res.json({
        success: true, message: 'Google sign-in successful!',
        data: { user: mockUserResponse(user), accessToken, refreshToken, isNewUser },
      });
    }

    const payload = await verifyGoogleToken(idToken);
    const { email, name, sub: googleId, picture } = payload;

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

    const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
    res.json({
      success: true,
      message: isNewUser ? 'Account created with Google!' : 'Google sign-in successful!',
      data: { user: mockUserResponse(user), accessToken, refreshToken, isNewUser },
    });
  } catch (error) {
    console.error('[Google Auth Error]', error.message || error);
    const msg = error.message || '';
    if (msg.includes('audience mismatch') || msg.includes('Invalid token')) {
      return res.status(401).json({ success: false, message: 'Google authentication failed. Invalid or expired token. Please try again.' });
    }
    if (msg.includes('Token used too late') || msg.includes('expired')) {
      return res.status(401).json({ success: false, message: 'Google token expired. Please sign in again.' });
    }
    return res.status(401).json({ success: false, message: 'Google authentication failed. Please try again or use email/password.' });
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

    // Welcome email goes out only on the first successful verification.
    const isFirstVerification = user.isVerified !== true;

    user.isVerified = true;
    user.verifyEmailToken = undefined;
    user.verifyEmailExpire = undefined;

    if (user.pendingNewEmail) {
      user.email = user.pendingNewEmail;
      user.pendingNewEmail = undefined;
    }

    await user.save({ validateBeforeSave: false });

    if (isFirstVerification) {
      // Non-blocking: verification must succeed even if the welcome email fails.
      sendWelcomeEmail(user).catch((error) => {
        console.error(`[email] type=welcome status=trigger_failed recipient=${maskRecipient(user.email)} error=${error?.code || error?.name || 'send_failed'}`);
      });
    }

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
      user.tokenVersion = (user.tokenVersion || 0) + 1;
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

    // Invalidate all existing tokens (global session invalidation)
    await blacklistAllForUser(req.user._id, { reason: 'password_reset' });

    res.json({ success: true, message: 'Password changed successfully. Please login again with your new password.' });
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
    if (user.authProvider === 'local') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to delete account.' });
      }
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
      const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);
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
    if (!user.firstLoginAt) user.firstLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion || 0);

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
 * @route  POST /api/auth/logout
 * @desc   Logout — blacklists the refresh token so it can't be used again
 * @access Public (requires refreshToken in body)
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      blacklistToken(refreshToken);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
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

    // Check blacklist — reject revoked tokens
    if (await isTokenBlacklisted(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Token revoked. Please login again.', code: 'TOKEN_REVOKED' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
      }
      // Blacklist the old refresh token before issuing new one (rotation)
      blacklistToken(refreshToken, { reason: 'refresh_rotate', userId: user._id });
      const tokens = generateTokens(user._id, user.tokenVersion || 0);
      return res.json({ success: true, data: tokens });
    }

    const user = await User.findById(decoded.id);

    if (!user || user.deletedAt) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    // Blacklist the old refresh token before issuing new one (rotation)
    blacklistToken(refreshToken, { reason: 'refresh_rotate', userId: user._id });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.tokenVersion || 0);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    console.error('[refreshToken]', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

/**
 * @route  GET /api/auth/me
 * @desc   Get current logged-in user
 * @access Private
 */
exports.getMe = (req, res) => {
  res.json({
    success: true,
    data: { user: mockUserResponse(req.user) },
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
      await user.save();
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
      if (user) {
        user.fcmToken = token;
        await user.save();
      }
      return res.json({ success: true, message: 'FCM token registered (mock mode)' });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/auth/change-email
 * @desc   Request email change with verification
 * @access Private
 */
exports.changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'New email required.' });
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) return res.status(400).json({ success: false, message: 'Invalid email format.' });

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.email = newEmail;
      user.isVerified = true;
      await user.save();
      return res.json({ success: true, message: 'Email updated (mock mode).', data: { user: mockUserResponse(user) } });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.authProvider === 'local') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to change email.' });
      }
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });

    const verifyToken = user.generateVerifyToken();
    user.verifyEmailToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    user.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000;
    user.pendingNewEmail = newEmail;
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-new-email/${verifyToken}`;
    const t = emailTemplates.changeEmailConfirm(user.name, verifyUrl);
    try {
      await sendTransactionalEmail({
        type: 'change-email',
        eventId: tokenEventId(verifyToken),
        to: newEmail,
        subject: t.subject,
        html: t.html,
        text: t.text,
        propagateError: true,
      });
    } catch (emailError) {
      user.verifyEmailToken = undefined;
      user.verifyEmailExpire = undefined;
      user.pendingNewEmail = undefined;
      await user.save({ validateBeforeSave: false });
      throw emailError;
    }

    if (process.env.NODE_ENV === 'development' && !isSmtpConfigured()) {
      user.email = newEmail;
      user.isVerified = true;
      user.verifyEmailToken = undefined;
      user.verifyEmailExpire = undefined;
      user._pendingNewEmail = undefined;
      await user.save({ validateBeforeSave: false });
      return res.json({
        success: true, message: 'Email updated (dev auto-verify).', data: { user: mockUserResponse(user) },
      });
    }

    res.json({ success: true, message: 'Verification sent to new email.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/auth/avatar
 * @desc   Update avatar URL
 * @access Private
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ success: false, message: 'Avatar URL required.' });

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.avatar = avatar;
      await user.save();
      return res.json({ success: true, data: { user: mockUserResponse(user) } });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, data: { user: mockUserResponse(user) } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/auth/badges
 * @desc   Update skill badges
 * @access Private
 */
exports.updateBadges = async (req, res, next) => {
  try {
    const { badges } = req.body;
    if (!Array.isArray(badges)) return res.status(400).json({ success: false, message: 'Badges must be an array.' });
    const sanitized = badges.map(b => String(b).trim()).filter(Boolean).slice(0, 20);

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.badges = sanitized;
      await user.save();
      return res.json({ success: true, data: { user: mockUserResponse(user) } });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { badges: sanitized }, { new: true });
    res.json({ success: true, data: { user: mockUserResponse(user) } });
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
    console.log(`[email] type=password-reset status=requested recipient=${maskRecipient(req.body.email)}`);
    if (isMockAuthEnabled()) {
      return res.json({
        success: true,
        message: 'Password reset is unavailable in mock auth mode. Use demo credentials or register a new account.',
      });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log(`[email] type=password-reset status=account_not_found recipient=${maskRecipient(req.body.email)}`);
      // Don't reveal if email exists (security)
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent.',
      });
    }

    console.log(`[email] type=password-reset status=account_found recipient=${maskRecipient(user.email)}`);
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      const t = emailTemplates.passwordReset(user.name, resetUrl);
      await sendTransactionalEmail({
        type: 'password-reset',
        eventId: tokenEventId(resetToken),
        to: user.email,
        subject: t.subject,
        html: t.html,
        text: t.text,
        propagateError: true,
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

    // Invalidate ALL existing tokens for this user (global session invalidation)
    await blacklistAllForUser(user._id, { reason: 'password_reset' });

    // Fetch fresh user to get updated tokenVersion
    const refreshedUser = await User.findById(user._id);
    const { accessToken, refreshToken } = generateTokens(user._id, refreshedUser.tokenVersion || 0);

    res.json({
      success: true,
      message: 'Password reset successful!',
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.completeOnboarding = async (req, res, next) => {
  try {
    const { skipped, targetExam, prepLevel, studyGoalHours } = req.body;
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(req.user._id);
      if (user) {
        user.hasCompletedOnboarding = true;
        user.onboardingSkipped = skipped || false;
        if (!user.firstLoginAt) user.firstLoginAt = new Date();
        if (targetExam) user.targetExam = String(targetExam);
        if (prepLevel) user.prepLevel = String(prepLevel);
        if (typeof studyGoalHours === 'number') user.studyGoalHours = studyGoalHours;
        await user.save();
      }
      return res.json({ success: true, message: 'Onboarding completed.' });
    }
    const user = req.user;
    user.hasCompletedOnboarding = true;
    user.onboardingSkipped = skipped || false;
    if (!user.firstLoginAt) user.firstLoginAt = new Date();
    if (targetExam) user.targetExam = String(targetExam);
    if (prepLevel) user.prepLevel = String(prepLevel);
    if (typeof studyGoalHours === 'number') user.studyGoalHours = studyGoalHours;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Onboarding completed.' });
  } catch (e) { next(e); }
};

exports.getDailyWelcome = async (req, res, next) => {
  try {
    let userData;
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(req.user._id);
      if (!user) return res.json({ success: true, data: null });
      userData = user;
    } else {
      userData = req.user;
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const firstLogin = userData.firstLoginAt || userData.createdAt || now;
    const daysSinceFirstLogin = Math.floor((now - firstLogin) / (1000 * 60 * 60 * 24)) + 1;

    const dayLabel = daysSinceFirstLogin === 1 ? 'first' :
      daysSinceFirstLogin === 2 ? 'second' :
      daysSinceFirstLogin === 3 ? 'third' :
      daysSinceFirstLogin === 4 ? 'fourth' :
      daysSinceFirstLogin === 7 ? 'week' : 'returning';

    res.json({
      success: true,
      data: {
        showOnboarding: !userData.hasCompletedOnboarding,
        day: daysSinceFirstLogin,
        dayLabel,
        streak: userData.streak?.current || 0,
        studyGoalHours: userData.studyGoalHours || 4,
        completedMilestones: userData.completedMilestones || [],
        lastDailyWelcome: userData.lastDailyWelcome || '',
        isNewDay: (userData.lastDailyWelcome || '') !== today,
      },
    });
  } catch (e) { next(e); }
};

exports.checkMilestones = async (req, res, next) => {
  try {
    let userData;
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(req.user._id);
      if (!user) return res.json({ success: true, data: { milestones: [] } });
      userData = user;
    } else {
      userData = req.user;
    }

    const completed = userData.completedMilestones || [];
    const newMilestones = [];

    const streak = userData.streak?.current || 0;
    if (streak >= 7 && !completed.includes('streak_7')) newMilestones.push('streak_7');
    if (streak >= 30 && !completed.includes('streak_30')) newMilestones.push('streak_30');

    if (newMilestones.length > 0) {
      userData.completedMilestones = [...completed, ...newMilestones];
      if (isMockAuthEnabled()) {
        await userData.save();
      } else {
        await userData.save({ validateBeforeSave: false });
      }
    }

    res.json({ success: true, data: { milestones: newMilestones } });
  } catch (e) { next(e); }
};
