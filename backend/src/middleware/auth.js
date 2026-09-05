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

  // Fallback: accept token from query string (for window.open navigations)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

    if (!token) {
      // Guest/demo mode: only allowed in development
      const isDemoRequest = req.headers['x-demo-user'] === 'true';
      if (isDemoRequest && process.env.NODE_ENV !== 'production') {
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
      // Production: require proper authentication
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
        code: 'NOT_AUTHORIZED',
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
          code: 'TOKEN_INVALID',
        });
      }
      req.user = mockStore.formatUser(user);
      req.user._id = user._id;
      return next();
    }

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
        code: 'TOKEN_INVALID',
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
      code: 'TOKEN_INVALID',
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
