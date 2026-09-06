const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isMongoConnected } = require('../config/db');
const localAdminStore = require('../store/localAdminStore');
const { adminProtect } = require('../middleware/adminAuth');

function generateToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role, v: admin.tokenVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: '8h',
    algorithm: 'HS256',
  });
}

// POST /api/admin/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (!isMongoConnected()) {
      const local = localAdminStore.findAdminByEmail(email);
      if (!local) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      if (!local.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated. Contact super admin.' });
      }
      const isMatch = await localAdminStore.comparePassword(local, password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      localAdminStore.updateAdminLastLogin(local._id);
      const token = generateToken(local);
      return res.json({ success: true, data: { token, admin: localAdminStore.sanitize(local) } });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact super admin.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin);

    res.json({
      success: true,
      data: {
        token,
        admin: admin.toJSON(),
      },
    });
  } catch (e) {
    next(e);
  }
});

async function revokeAdminSessions(adminId) {
  if (!isMongoConnected()) {
    const local = localAdminStore.findAdminById(adminId);
    if (!local) return false;
    local.tokenVersion = (local.tokenVersion || 0) + 1;
    localAdminStore.save();
    return true;
  }
  const result = await Admin.updateOne({ _id: adminId }, { $inc: { tokenVersion: 1 } });
  return result.modifiedCount === 1;
}

router.post('/logout', adminProtect, async (req, res, next) => {
  try {
    await revokeAdminSessions(req.admin._id);
    res.json({ success: true, message: 'Admin session revoked.' });
  } catch (error) {
    next(error);
  }
});

router.post('/revoke-all', adminProtect, async (req, res, next) => {
  try {
    await revokeAdminSessions(req.admin._id);
    res.json({ success: true, message: 'All admin sessions revoked.' });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', adminProtect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Current password and a new password of at least 8 characters are required.' });
    }
    if (!isMongoConnected()) {
      const local = localAdminStore.findAdminById(req.admin._id);
      if (!local || !(await localAdminStore.comparePassword(local, currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      local.passwordHash = await require('bcryptjs').hash(newPassword, 12);
      local.tokenVersion = (local.tokenVersion || 0) + 1;
      localAdminStore.save();
    } else {
      const admin = await Admin.findById(req.admin._id);
      if (!admin || !(await admin.comparePassword(currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      admin.passwordHash = newPassword;
      admin.tokenVersion = (admin.tokenVersion || 0) + 1;
      await admin.save();
    }
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/auth/me
router.get('/me', adminProtect, async (req, res) => {
  res.json({ success: true, data: req.admin });
});

module.exports = router;
