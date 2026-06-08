// src/routes/auth.js
const router = require('express').Router();
const {
  register, login, refreshToken, getMe,
  updateProfile, registerFcmToken, forgotPassword, resetPassword,
  googleAuth, verifyEmail, resendVerification, changePassword, deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/fcm-token', protect, registerFcmToken);

module.exports = router;
