const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { isDemoUser } = require('../utils/permissions');

const FREE_DAILY_LIMIT = 30;
const PREMIUM_DAILY_LIMIT = 200;
const DEMO_LIFETIME_LIMIT = 5;

function getIstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

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

    const todayKey = getIstDateKey();
    const lastKey = user.aiQuestionsDate ? getIstDateKey(new Date(user.aiQuestionsDate)) : null;
    if (!lastKey || lastKey !== todayKey) {
      user.aiQuestionsUsed = 0;
      user.aiQuestionsDate = new Date();
      await user.save({ validateBeforeSave: false });
    }

    if (user.aiQuestionsUsed >= limit) {
      const tomorrow = new Date(Date.parse(todayKey + 'T00:00:00+05:30') + 86400000);
      const resetAt = tomorrow;
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
