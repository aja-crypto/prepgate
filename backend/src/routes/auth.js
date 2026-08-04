// src/routes/auth.js
const router = require('express').Router();
const {
  register, login, refreshToken, getMe, logout,
  updateProfile, registerFcmToken, changeEmail, updateAvatar, updateBadges,
  forgotPassword, resetPassword,
  googleAuth, demoLogin, verifyEmail, resendVerification, changePassword, deleteAccount,
  completeOnboarding, getDailyWelcome, checkMilestones,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateFields } = require('../middleware/validateInput');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', validateFields([
  { name: 'name', type: 'string', required: true, min: 2, max: 50 },
  { name: 'email', type: 'string', required: true, pattern: EMAIL_RE },
  { name: 'password', type: 'string', required: true, min: 8, max: 128 },
]), register);
router.post('/login', validateFields([
  { name: 'email', type: 'string', required: true },
  { name: 'password', type: 'string', required: true },
]), login);
router.post('/google', validateFields([
  { name: 'idToken', type: 'string', required: true },
]), googleAuth);
router.post('/demo', demoLogin);
router.post('/refresh', validateFields([
  { name: 'refreshToken', type: 'string', required: true },
]), refreshToken);
router.post('/logout', validateFields([
  { name: 'refreshToken', type: 'string', required: true },
]), logout);
router.post('/forgot-password', validateFields([
  { name: 'email', type: 'string', required: true, pattern: EMAIL_RE },
]), forgotPassword);
router.post('/reset-password/:token', validateFields([
  { name: 'password', type: 'string', required: true, min: 8, max: 128 },
]), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/verify-new-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.put('/change-password', protect, validateFields([
  { name: 'currentPassword', type: 'string', required: true },
  { name: 'newPassword', type: 'string', required: true, min: 8, max: 128 },
]), changePassword);
router.delete('/account', protect, validateFields([
  { name: 'password', type: 'string', min: 1 },
]), deleteAccount);
router.get('/me', protect, getMe);
router.put('/profile', protect, validateFields([
  { name: 'name', type: 'string', min: 2, max: 50 },
  { name: 'studyGoalHours', type: 'number', min: 1, max: 24 },
  { name: 'targetYear', type: 'number', min: 2025, max: 2030 },
]), updateProfile);
router.put('/change-email', protect, validateFields([
  { name: 'newEmail', type: 'string', required: true, pattern: EMAIL_RE },
  { name: 'password', type: 'string', min: 1 },
]), changeEmail);
router.put('/avatar', protect, validateFields([
  { name: 'avatar', type: 'string', required: true, max: 2000 },
]), updateAvatar);
router.put('/badges', protect, validateFields([
  { name: 'badges', required: true },
]), updateBadges);
router.put('/fcm-token', protect, validateFields([
  { name: 'token', type: 'string', required: true, min: 10, max: 500 },
]), registerFcmToken);

router.post('/complete-onboarding', protect, completeOnboarding);
router.get('/daily-welcome', protect, getDailyWelcome);
router.get('/check-milestones', protect, checkMilestones);

module.exports = router;
