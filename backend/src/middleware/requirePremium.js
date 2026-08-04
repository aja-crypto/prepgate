const { canAccessPremium } = require('../utils/permissions');
const { isMockAuthEnabled } = require('../config/devMode');

function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }
  if (canAccessPremium(req.user)) {
    return next();
  }
  // Allow demo users in mock/dev mode
  if (isMockAuthEnabled() && req.headers['x-demo-user'] === 'true') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Premium feature. Upgrade your account to access this.',
    code: 'PREMIUM_REQUIRED',
  });
}

module.exports = { requirePremium };
