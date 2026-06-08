// src/middleware/auth.js – JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMockAuthEnabled } = require('../config/devMode');
const mockStore = require('../store/mockStore');

/**
 * Protect routes – verifies JWT access token
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // Check if it's a demo/guest user (only if not in strict mode)
    const isDemoRequest = req.headers['x-demo-user'] === 'true';
    if (isDemoRequest) {
      req.user = {
        _id: 'demo_user_id',
        id: 'demo_user_id',
        name: 'GATE Aspirant (Demo)',
        email: 'demo@gate2027.in',
        role: 'user',
        isGuest: true
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isMockAuthEnabled()) {
      const user = mockStore.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token invalid.',
        });
      }
      // Attach the mock user object with methods (save, updateStreak, etc.)
      // but exclude the password field from responses
      req.user = { ...user };
      delete req.user.password;
      req.user._id = user._id;
      // Ensure save and updateStreak reference the original user object
      req.user.save = user.save.bind(user);
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
 */
exports.generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};
