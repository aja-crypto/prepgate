// ─── Feature Access — Single Permission Helper ───
// Every page reads from here. No duplicate logic.

export const FEATURES = {
  PREDICTOR: 'predictor',
  LEARNING_HUB: 'learning-hub',
  PREMIUM_CONTENT: 'premium-content',
  AI_UNLIMITED: 'ai-unlimited',
  PREMIUM_PAGE: 'premium-page',
  REFERRAL_REWARDS: 'referral-rewards',
  ADMIN_PANEL: 'admin-panel',
  EXPORT_PDF: 'export-pdf',
};

export function hasFeatureAccess(user, feature) {
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isPremium = user?.isPremium === true || isOwner || isAdmin;

  // Owners and admins bypass ALL gates
  if (isOwner || isAdmin) return true;

  const gates = {
    [FEATURES.PREDICTOR]: isPremium,
    [FEATURES.LEARNING_HUB]: isPremium,
    [FEATURES.PREMIUM_CONTENT]: isPremium,
    [FEATURES.AI_UNLIMITED]: isPremium,
    [FEATURES.PREMIUM_PAGE]: isPremium,
    [FEATURES.REFERRAL_REWARDS]: true,
    [FEATURES.ADMIN_PANEL]: false,
    [FEATURES.EXPORT_PDF]: true,
  };

  return gates[feature] ?? true;
}

// Backward-compatible membership display helper
export function getMembershipStatus(user) {
  const isPremium = user?.isPremium === true;
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';

  if (isOwner) return { label: 'OWNER', isPremium: true, isOwner: true, isAdmin: false, badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  if (isAdmin) return { label: 'ADMIN', isPremium: true, isOwner: false, isAdmin: true, badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (isPremium) return { label: 'PREMIUM', isPremium: true, isOwner: false, isAdmin: false, badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  return { label: 'BASIC', isPremium: false, isOwner: false, isAdmin: false, badgeClass: 'bg-white/5 text-slate-500 border-white/10' };
}
