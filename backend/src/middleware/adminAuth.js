const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isMongoConnected } = require('../config/db');
const localAdminStore = require('../store/localAdminStore');

exports.adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Admin login required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!isMongoConnected()) {
      const local = localAdminStore.findAdminById(decoded.id);
      if (!local || !local.isActive) {
        return res.status(401).json({ success: false, message: 'Admin not found or deactivated.' });
      }
      localAdminStore.updateAdminLastLogin(decoded.id);
      req.admin = localAdminStore.sanitize(local);
      return next();
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin not found or deactivated.' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

exports.requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const hasAll = permissions.every(p => {
      if (typeof req.admin.hasPermission === 'function') {
        return req.admin.hasPermission(p);
      }
      if (req.admin.role === 'super_admin') return true;
      return (req.admin.permissions || []).includes(p);
    });
    if (!hasAll) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
};
