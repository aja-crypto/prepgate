// src/routes/admin.js
const router = require('express').Router();
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AdminPdf = require('../models/AdminPdf');
const { Topic, Note, MockTest, PYQ } = require('../models');

// Local user helpers (mock store)
const localAdminStore = require('../store/localAdminStore');
function getAllLocalUsers() {
  try {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '../../data/mock_users.json');
    if (!fs.existsSync(file)) return [];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.map(u => ({ ...u, password: undefined }));
  } catch { return []; }
}

function updateLocalUser(id, updates) {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '../../data/mock_users.json');
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const idx = data.findIndex(u => u._id === id || u.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return { ...data[idx], password: undefined };
}

// GET admin dashboard stats — comprehensive
router.get('/stats', adminProtect, async (req, res, next) => {
  try {
    const mongo = isMongoConnected();

    if (!mongo) {
      const users = getAllLocalUsers();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      const localMockSessions = require('../store/localDataStore');
      const allAttempts = localMockSessions.getAllLocalMockAttempts ? [] : [];

      return res.json({
        success: true,
        data: {
          users: {
            total: users.length,
            activeToday: users.filter(u => {
              const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
              return lastLogin && lastLogin >= todayStart;
            }).length || 0,
            newThisWeek: users.filter(u => {
              const created = u.createdAt ? new Date(u.createdAt) : null;
              return created && created >= weekAgo;
            }).length || 0,
            newThisMonth: users.filter(u => {
              const created = u.createdAt ? new Date(u.createdAt) : null;
              return created && created >= monthAgo;
            }).length || 0,
          },
          subjects: 11,
          topics: 0,
          notes: 0,
          tests: 55,
          pyqs: 0,
          mockTests: {
            totalAttempts: 0,
            completed: 0,
            averageScore: 0,
            topPerformers: [],
          },
          aiMentor: {
            totalRequests: 0,
            requestsToday: 0,
            failed: 0,
            avgResponseTime: 0,
          },
          pdfs: {
            total: 0,
            published: 0,
            drafts: 0,
          },
          system: {
            databaseConnected: false,
            apiStatus: 'healthy',
            storageUsage: '0 MB',
          },
        }
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeToday,
      newThisWeek,
      newThisMonth,
      subjectCount,
      topicCount,
      noteCount,
      mockTestCount,
      pyqCount,
      totalPdfs,
      publishedPdfs,
      draftPdfs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } }),
      Subject.countDocuments({ isActive: true }),
      Topic.countDocuments(),
      Note.countDocuments(),
      MockTest.countDocuments(),
      PYQ.countDocuments(),
      AdminPdf.countDocuments(),
      AdminPdf.countDocuments({ isPublished: true }),
      AdminPdf.countDocuments({ isPublished: false }),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeToday: activeToday,
          newThisWeek: newThisWeek,
          newThisMonth: newThisMonth,
        },
        subjects: subjectCount,
        topics: topicCount,
        notes: noteCount,
        mockTests: {
          total: mockTestCount,
        },
        pyqs: pyqCount,
        pdfs: {
          total: totalPdfs,
          published: publishedPdfs,
          drafts: draftPdfs,
        },
        system: {
          databaseConnected: true,
          apiStatus: 'healthy',
          storageUsage: `${(totalPdfs * 2.5 + 15).toFixed(0)} MB`,
        },
      }
    });
  } catch (e) { next(e); }
});

// GET all users (admin) — with pagination & search
router.get('/users', adminProtect, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!isMongoConnected()) {
      let users = getAllLocalUsers();
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
      }
      if (status === 'active') users = users.filter(u => !u.deletedAt);
      if (status === 'deleted') users = users.filter(u => u.deletedAt);
      const total = users.length;
      users = users.slice(skip, skip + parseInt(limit));
      return res.json({
        success: true,
        count: total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: users.map(u => ({ ...u, password: undefined })),
      });
    }

    const filter = {};
    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.deletedAt = null;
    if (status === 'deleted') filter.deletedAt = { $ne: null };

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort(sort).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({
      success: true,
      count: total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (e) { next(e); }
});

// PUT update user role
router.put('/users/:id/role', adminProtect, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    if (!isMongoConnected()) {
      const user = updateLocalUser(req.params.id, { role });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, data: user });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// PUT activate/suspend user
router.put('/users/:id/status', adminProtect, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) required.' });
    }
    if (!isMongoConnected()) {
      const user = updateLocalUser(req.params.id, { isActive });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, data: user });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// DELETE soft-delete user
router.delete('/users/:id', adminProtect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const user = updateLocalUser(req.params.id, { deletedAt: new Date().toISOString() });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, message: 'User soft-deleted.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User soft-deleted.' });
  } catch (e) { next(e); }
});

module.exports = router;
