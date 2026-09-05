const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/google', authController.googleAuth);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/fcm-token', protect, authController.registerFcmToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.put('/change-password', protect, authController.changePassword);
router.delete('/account', protect, authController.deleteAccount);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerification);

module.exports = router;