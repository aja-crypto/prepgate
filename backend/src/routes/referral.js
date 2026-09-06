const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const localReferralStore = require('../store/localReferralStore');
const User = require('../models/User');

// ─── Helper: generate referral code ─────────────────────────────
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Helper: get or create referral record ─────────────────────
const mongoose = require('mongoose');
const { sendTransactionalEmail } = require('../services/emailDeliveryService');
const emailTemplates = require('../utils/emailTemplates');

function sendPremiumActivatedEmail(user) {
  if (!user?.email) return;
  const t = emailTemplates.premiumActivated(user.name);
  sendTransactionalEmail({
    type: 'premium-activation',
    eventId: String(user._id),
    to: user.email,
    subject: t.subject,
    html: t.html,
    text: t.text,
  }).catch((error) => {
    console.error('[Referral] Premium email failed:', error.message);
  });
}

async function getOrCreate(user) {
  const userId = user._id?.toString() || user.id;
  // Mock/local users use non-ObjectId ids (e.g. UUID) — always use the local store for them
  const isMongoUser = mongoose.Types.ObjectId.isValid(userId);
  if (isMongoConnected() && isMongoUser) {
    // Fetch fresh user from DB to ensure we have Mongoose document with methods
    const mongoUser = await User.findById(userId);
    if (mongoUser) {
      if (!mongoUser.referralCode) {
        mongoUser.referralCode = genCode();
        await mongoUser.save({ validateBeforeSave: false });
      }
      const referredByUser = mongoUser.referredBy ? await User.findById(mongoUser.referredBy).select('name email') : null;
      return {
        referralCode: mongoUser.referralCode,
        referralCount: mongoUser.referralCount || 0,
        isPremium: mongoUser.isPremium || false,
        premiumUnlockedViaReferral: mongoUser.premiumUnlockedViaReferral || false,
        pendingCount: mongoUser.pendingReferrals?.length || 0,
        progress: Math.min(100, ((mongoUser.referralCount || 0) / 2) * 100),
        targetReferrals: 2,
        referredBy: referredByUser ? { name: referredByUser.name, email: referredByUser.email } : null,
      };
    }
  }
  const local = localReferralStore.getOrCreateReferral(userId, user.email);
  return {
    referralCode: local.referralCode,
    referralCount: local.referralCount,
    isPremium: local.isPremium,
    premiumUnlockedViaReferral: local.premiumUnlockedViaReferral,
    pendingCount: local.pendingReferrals?.length || 0,
    progress: Math.min(100, (local.referralCount / 2) * 100),
    targetReferrals: 2,
    referredBy: null,
  };
}

// GET /api/referral/status — Get referral status
router.get('/status', protect, async (req, res, next) => {
  try {
    const status = await getOrCreate(req.user);
    res.json({ success: true, data: status });
  } catch (e) { next(e); }
});

// GET /api/referral/code — Get/generate referral code
router.get('/code', protect, async (req, res, next) => {
  try {
    const status = await getOrCreate(req.user);
    const baseUrl = process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://gatenexa.vercel.app' : 'http://localhost:5173');
    res.json({
      success: true,
      data: {
        referralCode: status.referralCode,
        referralLink: `${baseUrl}/register?ref=${status.referralCode}`,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/referral/claim — Claim a referral code (friend registers)
router.post('/claim', protect, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Referral code is required.' });

    const claimUserId = req.user._id?.toString() || req.user.id;
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(claimUserId)) {
      const referrer = await User.findOne({ referralCode: code.toUpperCase() });
      if (!referrer) return res.status(404).json({ success: false, message: 'Invalid referral code.' });
      if (referrer._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot refer yourself.' });
      }
      if (req.user.referredBy) {
        return res.status(400).json({ success: false, message: 'Already referred by someone.' });
      }
      if (referrer.pendingReferrals?.includes(req.user._id)) {
        return res.status(400).json({ success: false, message: 'Already referred.' });
      }
      req.user.referredBy = referrer._id;
      referrer.pendingReferrals = referrer.pendingReferrals || [];
      referrer.pendingReferrals.push(req.user._id);
      await req.user.save();
      referrer.markModified('pendingReferrals');
      await referrer.save();
      return res.json({ success: true, message: 'Referral code applied!' });
    }

    const result = localReferralStore.claimReferral(code.toUpperCase(), claimUserId, req.user.email);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, message: 'Referral code applied!' });
  } catch (e) { next(e); }
});

// POST /api/referral/complete — Mark a referral successful
router.post('/complete', protect, async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;

    // MongoDB path
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      const currentUser = await User.findById(req.user._id);
      if (currentUser && currentUser.referredBy) {
        // Claim the pending referral atomically; only the first concurrent request can match.
        const referrer = await User.findOneAndUpdate(
          { _id: currentUser.referredBy, pendingReferrals: req.user._id },
          {
            $pull: { pendingReferrals: req.user._id },
            $addToSet: { referredUsers: req.user._id },
            $inc: { referralCount: 1 },
          },
          { new: true },
        );
        if (referrer) {
          if (referrer.referralCount >= 2 && !referrer.isPremium) {
            const premiumUpdate = await User.updateOne(
              { _id: referrer._id, isPremium: false },
              { $set: { isPremium: true, premiumUnlockedViaReferral: true } },
            );
            if (premiumUpdate.modifiedCount === 1) sendPremiumActivatedEmail(referrer);
          }
          return res.json({ success: true, referralCount: referrer.referralCount, isPremium: referrer.referralCount >= 2 || !!referrer.isPremium });
        }
      }
      // Also try finding referrer by pendingReferrals array
      const referrer2 = await User.findOneAndUpdate(
        { pendingReferrals: req.user._id },
        {
          $pull: { pendingReferrals: req.user._id },
          $addToSet: { referredUsers: req.user._id },
          $inc: { referralCount: 1 },
        },
        { new: true },
      );
      if (referrer2) {
        if (referrer2.referralCount >= 2 && !referrer2.isPremium) {
          const premiumUpdate = await User.updateOne(
            { _id: referrer2._id, isPremium: false },
            { $set: { isPremium: true, premiumUnlockedViaReferral: true } },
          );
          if (premiumUpdate.modifiedCount === 1) sendPremiumActivatedEmail(referrer2);
        }
        return res.json({ success: true, referralCount: referrer2.referralCount, isPremium: referrer2.referralCount >= 2 || !!referrer2.isPremium });
      }
      return res.json({ success: true, message: 'Referral already completed or no pending referral was found.' });
    }

    // Local store fallback (mock mode) — pass null to auto-lookup referrer
    const result = localReferralStore.completeReferral(null, userId);
    res.json(result.success ? result : { success: true });
  } catch (e) { next(e); }
});

// GET /api/referral/history — Get referral history
router.get('/history', protect, async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(req.user._id).populate('pendingReferrals', 'name email').populate('referredBy', 'name email');
      const history = [];
      if (user.pendingReferrals?.length > 0) {
        for (const ref of user.pendingReferrals) {
          history.push({ userId: ref._id, name: ref.name, email: ref.email, status: 'pending', date: null });
        }
      }
      return res.json({ success: true, data: { history, referredBy: user.referredBy } });
    }
    const history = localReferralStore.getReferralHistory(userId);
    res.json({ success: true, data: { history, referredBy: null } });
  } catch (e) { next(e); }
});

// GET /api/referral/premium-status — Check premium
router.get('/premium-status', protect, async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      const isPremium = req.user.checkPremiumStatus ? req.user.checkPremiumStatus() : req.user.isPremium;
      if (req.user.isModified?.('isPremium')) await req.user.save();
      return res.json({ success: true, data: { isPremium, premiumUnlockedViaReferral: req.user.premiumUnlockedViaReferral || false } });
    }
    const local = localReferralStore.getReferralStatus(userId);
    res.json({ success: true, data: { isPremium: local.isPremium, premiumUnlockedViaReferral: local.premiumUnlockedViaReferral || false } });
  } catch (e) { next(e); }
});

// POST /api/referral/refresh — Trigger premium check + refresh status
router.post('/refresh', protect, async (req, res, next) => {
  try {
    const status = await getOrCreate(req.user);
    res.json({ success: true, data: status });
  } catch (e) { next(e); }
});

// GET /api/referral/validate/:code — Validate a referral code (no auth required for sign-up validation)
router.get('/validate/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code || code.length < 3) return res.json({ success: true, data: { valid: false } });

    const User = require('../models/User');
    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) return res.json({ success: true, data: { valid: false } });

    res.json({ success: true, data: { valid: true, code: referrer.referralCode } });
  } catch (e) { next(e); }
});

module.exports = router;
