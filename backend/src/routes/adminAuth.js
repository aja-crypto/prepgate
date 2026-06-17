const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isMongoConnected } = require('../config/db');
const localAdminStore = require('../store/localAdminStore');
const { adminProtect } = require('../middleware/adminAuth');

function generateToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: '8h',
    algorithm: 'HS256',
  });
}

// POST /api/admin/auth/login
router.post('/auth/login', async (req, res, next) => {
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

// GET /api/admin/auth/me
router.get('/auth/me', adminProtect, async (req, res) => {
  res.json({ success: true, data: req.admin });
});

module.exports = router;
