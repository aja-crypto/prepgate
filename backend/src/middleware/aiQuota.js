const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { isDemoUser } = require('../utils/permissions');

const FREE_DAILY_LIMIT = 30;
const PREMIUM_DAILY_LIMIT = 200;
const DEMO_LIFETIME_LIMIT = 5;

async function aiQuota(req, res, next) {
  try {
    if (!isMongoConnected() || !req.user?._id) return next();
    const userId = req.user._id;

    const user = await User.findById(userId).select('aiQuestionsUsed aiQuestionsDate isPremium email');
    if (!user) return next();

    const guest = isDemoUser(user);
    if (guest) {
      if ((user.aiQuestionsUsed || 0) >= DEMO_LIFETIME_LIMIT) {
        return res.status(429).json({
          success: false,
          message: 'You have used all 5 free AI questions. Sign up for unlimited access.',
          data: { used: user.aiQuestionsUsed, limit: DEMO_LIFETIME_LIMIT, isPremium: false, isGuest: true },
        });
      }
      return next();
    }

    const isPremium = user.isPremium || false;
    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = user.aiQuestionsDate ? new Date(user.aiQuestionsDate) : null;
    if (!lastReset || lastReset < today) {
      user.aiQuestionsUsed = 0;
      user.aiQuestionsDate = today;
      await user.save({ validateBeforeSave: false });
    }

    if (user.aiQuestionsUsed >= limit) {
      const resetAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return res.status(429).json({
        success: false,
        message: `Daily AI query limit reached (${limit}/day). Resets at midnight.`,
        data: { used: user.aiQuestionsUsed, limit, resetAt: resetAt.toISOString(), isPremium },
      });
    }

    next();
  } catch (e) {
    next();
  }
}

module.exports = { aiQuota, FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT };
