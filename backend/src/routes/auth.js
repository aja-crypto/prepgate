// src/routes/auth.js
const router = require('express').Router();
const {
  register, login, refreshToken, getMe,
  updateProfile, registerFcmToken, forgotPassword, resetPassword,
  googleAuth, demoLogin, verifyEmail, resendVerification, changePassword, deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateFields } = require('../middleware/validateInput');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', validateFields([
  { name: 'name', type: 'string', required: true, min: 2, max: 50 },
  { name: 'email', type: 'string', required: true, pattern: EMAIL_RE },
  { name: 'password', type: 'string', required: true, min: 6, max: 128 },
]), register);
router.post('/login', validateFields([
  { name: 'email', type: 'string', required: true },
  { name: 'password', type: 'string', required: true },
]), login);
router.post('/google', googleAuth);
router.post('/demo', demoLogin);
router.post('/refresh', refreshToken);
router.post('/forgot-password', validateFields([
  { name: 'email', type: 'string', required: true, pattern: EMAIL_RE },
]), forgotPassword);
router.post('/reset-password/:token', validateFields([
  { name: 'password', type: 'string', required: true, min: 6, max: 128 },
]), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.put('/change-password', protect, validateFields([
  { name: 'currentPassword', type: 'string', required: true },
  { name: 'newPassword', type: 'string', required: true, min: 6, max: 128 },
]), changePassword);
router.delete('/account', protect, deleteAccount);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/fcm-token', protect, registerFcmToken);

module.exports = router;
