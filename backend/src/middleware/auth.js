// src/middleware/auth.js – JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMockAuthEnabled, enableMockAuth } = require('../config/devMode');
const { isMongoConnected } = require('../config/db');
const mockStore = require('../store/mockStore');
const tokenBlacklist = require('./tokenBlacklist');

/**
 * Protect routes – verifies JWT access token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback: accept token from query string (for window.open navigations)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    // Demo bypass is ONLY available in non-production environments
    const isDemoRequest = req.headers['x-demo-user'] === 'true';
    if (isDemoRequest && process.env.NODE_ENV !== 'production') {
      enableMockAuth();
      req.user = {
        _id: 'demo_user_id',
        id: 'demo_user_id',
        name: 'GATE Aspirant (Demo)',
        email: 'demo@gate2027.in',
        role: 'user',
        isGuest: true,
        isPremium: true,
        premiumUnlockedViaReferral: true,
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Check blacklist (sync fast path — DB fallback in async check)
    if (tokenBlacklist.hasSync(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // Full async blacklist check (covers DB after server restart)
    const isBlacklisted = await tokenBlacklist.has(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED',
      });
    }

    // If MongoDB is connected, try to fetch from MongoDB first
    // (mock store users have UUID IDs which are incompatible with ObjectId refs)
    if (isMongoConnected()) {
      // Only try MongoDB if the ID looks like a valid ObjectId (24 hex chars)
      if (/^[0-9a-f]{24}$/i.test(decoded.id)) {
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          if (decoded.v !== undefined && decoded.v !== req.user.tokenVersion) {
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.', code: 'TOKEN_VERSION_MISMATCH' });
          }
          return next();
        }
      }
    }

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token invalid.',
        });
      }
      // Check tokenVersion for global invalidation (mock mode)
      if (decoded.v !== undefined && decoded.v !== (user.tokenVersion || 0)) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
          code: 'TOKEN_VERSION_MISMATCH',
        });
      }
      // Attach the mock user object with methods (save, updateStreak, etc.)
      // but exclude the password field from responses
      req.user = { ...user };
      delete req.user.password;
      req.user._id = user._id;
      // Fix: save syncs mutations back to the original mock user before persisting
      // Without this, progressBackup/streak changes on the spread copy are lost on save
      req.user.save = async function () {
        user.progressBackup = this.progressBackup;
        user.streak = this.streak;
        user.preferences = this.preferences;
        user.fcmToken = this.fcmToken;
        user.isVerified = this.isVerified;
        user.name = this.name;
        user.targetYear = this.targetYear;
        user.studyGoalHours = this.studyGoalHours;
        if (this.nexaPredictorTestUses !== undefined) user.nexaPredictorTestUses = this.nexaPredictorTestUses;
        return await user.save();
      };
      req.user.updateStreak = user.updateStreak.bind(user);
      req.user.comparePassword = user.comparePassword.bind(user);
      return next();
    }

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    // Check tokenVersion — reject tokens issued before password reset
    if (decoded.v !== undefined && decoded.v !== req.user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        code: 'TOKEN_VERSION_MISMATCH',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Admin only middleware – must come after protect
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

/**
 * Generate JWT tokens
 * @param {string} userId
 * @param {number} [tokenVersion=0] - User's token version for global invalidation
 */
exports.generateTokens = (userId, tokenVersion = 0) => {
  const accessToken = jwt.sign(
    { id: userId, v: tokenVersion },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId, v: tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};
