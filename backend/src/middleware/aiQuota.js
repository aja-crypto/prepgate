const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { isDemoUser } = require('../utils/permissions');

const FREE_DAILY_LIMIT = 30;
const PREMIUM_DAILY_LIMIT = 200;
const DEMO_LIFETIME_LIMIT = 5;

function getIstDateKey(date = new Date()) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getIstDayBounds(date = new Date()) {
  const key = getIstDateKey(date);
  const start = new Date(`${key}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 86400000) };
}

async function reserveMongoQuota(userId, limit) {
  const { start, end } = getIstDayBounds();
  const sameDay = {
    $and: [
      { $gte: ['$aiQuestionsDate', start] },
      { $lt: ['$aiQuestionsDate', end] },
    ],
  };
  return User.findOneAndUpdate(
    {
      _id: userId,
      $expr: {
        $lt: [
          { $cond: [sameDay, { $ifNull: ['$aiQuestionsUsed', 0] }, 0] },
          limit,
        ],
      },
    },
    [{
      $set: {
        aiQuestionsUsed: {
          $cond: [
            sameDay,
            { $add: [{ $ifNull: ['$aiQuestionsUsed', 0] }, 1] },
            1,
          ],
        },
        aiQuestionsDate: new Date(),
      },
    }],
    { new: true, projection: 'aiQuestionsUsed aiQuestionsDate isPremium' },
  ).lean();
}

async function aiQuota(req, res, next) {
  try {
    if (!req.user?._id) return next();
    const userId = req.user._id;
    if (!isMongoConnected()) {
      const mockStore = require('../store/mockStore');
      const user = mockStore.findById(userId);
      if (!user) return next();
      const guest = isDemoUser(user);
      const limit = guest ? DEMO_LIFETIME_LIMIT : (user.isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT);
      if (!guest && getIstDateKey(user.aiQuestionsDate ? new Date(user.aiQuestionsDate) : null) !== getIstDateKey()) {
        user.aiQuestionsUsed = 0;
      }
      if ((user.aiQuestionsUsed || 0) >= limit) {
        return res.status(429).json({
          success: false,
          message: guest ? 'You have used all 5 free AI questions. Sign up for unlimited access.' : `Daily AI query limit reached (${limit}/day). Resets at midnight.`,
          data: { used: user.aiQuestionsUsed || 0, limit, isPremium: !!user.isPremium, isGuest: guest },
        });
      }
      user.aiQuestionsUsed = (user.aiQuestionsUsed || 0) + 1;
      user.aiQuestionsDate = new Date();
      await user.save();
      return next();
    }

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
      const claimed = await User.findOneAndUpdate(
        { _id: userId, aiQuestionsUsed: { $lt: DEMO_LIFETIME_LIMIT } },
        { $inc: { aiQuestionsUsed: 1 } },
        { new: true, projection: 'aiQuestionsUsed' },
      ).lean();
      if (!claimed) {
        return res.status(429).json({
          success: false,
          message: 'You have used all 5 free AI questions. Sign up for unlimited access.',
          data: { used: DEMO_LIFETIME_LIMIT, limit: DEMO_LIFETIME_LIMIT, isPremium: false, isGuest: true },
        });
      }
      return next();
    }

    const isPremium = user.isPremium || false;
    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
    const claimed = await reserveMongoQuota(userId, limit);
    if (!claimed) {
      const { end: resetAt } = getIstDayBounds();
      return res.status(429).json({
        success: false,
        message: `Daily AI query limit reached (${limit}/day). Resets at midnight.`,
        data: { used: limit, limit, resetAt: resetAt.toISOString(), isPremium },
      });
    }

    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { aiQuota, FREE_DAILY_LIMIT, PREMIUM_DAILY_LIMIT, getIstDateKey };
