// Centralized permission helpers — single source of truth for role checks

// Demo/testing identity (mirrors the account used by /auth/demo)
const DEMO_EMAIL = 'demo@gate2027.in';

function isGuestUser(user) {
  return !!(user && (user.isGuest === true || user.email === DEMO_EMAIL));
}

const ROLES = {
  owner: 999,
  super_admin: 100,
  admin: 80,
  moderator: 60,
  content_manager: 40,
  support: 20,
  viewer: 10,
  user: 1,
};

function getRoleWeight(role) {
  return ROLES[role] || 0;
}

// Role checks
function isOwner(user) {
  return user?.role === 'owner';
}

function isSuperAdmin(user) {
  return user?.role === 'super_admin' || user?.role === 'owner';
}

function isAdmin(user) {
  return ['owner', 'super_admin', 'admin'].includes(user?.role);
}

function isAtLeast(minRole) {
  return (user) => getRoleWeight(user?.role) >= getRoleWeight(minRole);
}

// Feature bypass checks — owner always bypasses
function hasUnlimitedAI(user) {
  return isOwner(user) || user?.isPremium === true;
}

function hasUnlimitedPredictions(user) {
  return isOwner(user) || user?.isPremium === true || user?.premiumUnlockedViaReferral === true;
}

function canAccessPremium(user) {
  return isOwner(user) || user?.isPremium === true || user?.premiumUnlockedViaReferral === true;
}

function isDemoUser(user) {
  return isGuestUser(user);
}

function bypassReferralRequirement(user) {
  return isOwner(user) || isAdmin(user);
}

function bypassAiLimits(user) {
  return isOwner(user);
}

function bypassPredictorLimits(user) {
  return isOwner(user);
}

function bypassFeatureLocks(user) {
  return isOwner(user);
}

module.exports = {
  ROLES,
  getRoleWeight,
  isOwner,
  isSuperAdmin,
  isAdmin,
  isAtLeast,
  hasUnlimitedAI,
  hasUnlimitedPredictions,
  canAccessPremium,
  isDemoUser,
  bypassReferralRequirement,
  bypassAiLimits,
  bypassPredictorLimits,
  bypassFeatureLocks,
};
