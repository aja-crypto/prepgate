const User = require('../models/User');
const { isMongoConnected } = require('../config/db');

const FREE_DAILY_LIMIT = 30;
const PREMIUM_DAILY_LIMIT = 200;

async function aiQuota(req, res, next) {
  try {
    if (!isMongoConnected() || !req.user?._id) return next();
    const userId = req.user._id;
    const isPremium = req.user.isPremium || req.user.checkPremiumStatus?.() || false;
    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    const user = await User.findById(userId).select('aiQuestionsUsed aiQuestionsDate isPremium');
    if (!user) return next();

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
