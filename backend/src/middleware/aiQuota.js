const User = require('../models/User');
const { isMongoConnected } = require('../config/db');

const { bypassAiLimits } = require('../utils/permissions');

async function aiQuota(req, res, next) {
  if (!req.user) return next();
  // Owner bypasses all AI limits
  if (bypassAiLimits(req.user)) {
    req.aiQuota = { remaining: 9999, used: 0, max: 9999 };
    return next();
  }
  // For mock/demo users with non-ObjectId IDs, skip MongoDB lookup
  if (isMongoConnected() && req.user._id?.toString().length === 24) {
    try {
      const user = await User.findById(req.user._id).select('aiQuestionsUsed aiQuestionsDate isPremium');
      if (!user) return next();
      user.checkAiQuestions();
      const max = user.isPremium ? 100 : 5;
      if (user.aiQuestionsUsed >= max) {
        return res.status(403).json({
          success: false, message: 'Daily AI question limit reached. Invite friends to unlock unlimited access.',
          code: 'AI_QUOTA_EXCEEDED', data: { remaining: 0, max, isPremium: user.isPremium },
        });
      }
      user.aiQuestionsUsed = (user.aiQuestionsUsed || 0) + 1;
      await user.save();
      req.aiQuota = { remaining: max - user.aiQuestionsUsed, used: user.aiQuestionsUsed, max };
      return next();
    } catch (e) { return next(); }
  }
  // Local/fallback quota tracking
  const local = req.user._aiQuota || { used: 0, date: null };
  const today = new Date().setHours(0, 0, 0, 0);
  const lastDate = local.date ? new Date(local.date).setHours(0, 0, 0, 0) : null;
  if (lastDate !== today) { local.used = 0; local.date = new Date().toISOString(); }
  const max = 5;
  if (local.used >= max) {
    return res.status(403).json({
      success: false, message: 'Daily AI question limit reached. Invite friends to unlock unlimited access.',
      code: 'AI_QUOTA_EXCEEDED', data: { remaining: 0, max, isPremium: false },
    });
  }
  local.used++;
  req.user._aiQuota = local;
  req.aiQuota = { remaining: max - local.used, used: local.used, max };
  next();
}

async function aiQuotaCheck(req, res, next) {
  if (!req.user) return next();
  if (isMongoConnected()) {
    const user = await User.findById(req.user._id).select('aiQuestionsUsed aiQuestionsDate isPremium');
    if (!user) return next();
    user.checkAiQuestions();
    const max = user.isPremium ? 100 : 5;
    req.aiQuota = { remaining: Math.max(0, max - user.aiQuestionsUsed), used: user.aiQuestionsUsed, max };
    return next();
  }
  const local = req.user._aiQuota || { used: 0, date: null };
  const today = new Date().setHours(0, 0, 0, 0);
  const lastDate = local.date ? new Date(local.date).setHours(0, 0, 0, 0) : null;
  if (lastDate !== today) { local.used = 0; local.date = new Date().toISOString(); }
  req.aiQuota = { remaining: Math.max(0, 5 - local.used), used: local.used, max: 5 };
  next();
}

module.exports = { aiQuota, aiQuotaCheck };
