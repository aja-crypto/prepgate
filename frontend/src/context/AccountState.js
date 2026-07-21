// ─── AccountState — Single Source of Truth for All Account Data ───
// Every component reads from here. Nothing keeps its own copy.

const STORAGE_KEYS = {
  TOKEN: 'accessToken',
  REFRESH: 'refreshToken',
  GUEST: 'isGuest',
  ONBOARDING: 'gatenexa_onboarding_done',
  THEME: 'gatenexa_theme_mode',
  COLOR: 'gatenexa_color_preset',
  AI_FAB: 'gatenexa_ai_fab',
  AI_TOOLTIP: 'gatenexa_ai_tooltip',
  FOCUS_ENABLED: 'gatenexa_focus_enabled',
  FOCUS_DURATION: 'gatenexa_focus_duration',
  INSTALL: 'gatenexa_install_dismissed',
  ADMIN_TOKEN: 'adminToken',
  ADMIN_USER: 'adminUser',
};

const DEFAULT_ACCOUNT = {
  // Auth
  id: null,
  email: null,
  name: null,
  avatar: null,
  role: 'user',
  isGuest: false,
  isVerified: false,

  // Membership — single source
  isPremium: false,
  premiumSource: null,        // 'direct' | 'referral' | 'admin_grant' | null
  premiumUnlockedAt: null,
  premiumUnlockedViaReferral: false,

  // Referral
  referralCode: null,
  referralCount: 0,
  referralProgress: 0,
  referralPendingCount: 0,

  // Limits
  aiQuestionsRemaining: 5,
  predictionCredits: 5,

  // Study
  streak: { current: 0, longest: 0, lastStudyDate: null },
  studyGoalHours: 8,
  targetYear: null,
  studyHoursThisWeek: 0,
  completedSubjects: 0,

  // Preferences
  theme: 'dark',
  colorPreset: 'violet',
  notifications: true,
  aiFabEnabled: true,
  aiTooltipEnabled: true,
  focusEnabled: false,
  focusDuration: 25,

  // Popup state — prevents repeated triggers
  popups: {
    welcome: { shownAt: null, dismissed: false, version: 1 },
    premiumUnlock: { shownAt: null, dismissed: false, version: 1 },
    referralModal: { shownAt: null, dismissed: false, version: 1 },
    celebration: { shownAt: null, dismissed: false, version: 1 },
    aiIntro: { shownAt: null, dismissed: false, version: 1 },
    brandIntro: { shownAt: null, dismissed: false, version: 1 },
    installPrompt: { shownAt: null, dismissed: false, version: 1 },
    notesDisclaimer: { shownAt: null, dismissed: false, version: 1 },
  },
};

// State transitions — single place to track what changed
const TRANSITIONS = {
  NONE: 'none',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PREMIUM_GRANTED: 'premium_granted',
  PREMIUM_REVOKED: 'premium_revoked',
  REFERRAL_CHANGE: 'referral_change',
  ADMIN_PROMOTION: 'admin_promotion',
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
};

export { STORAGE_KEYS, DEFAULT_ACCOUNT, TRANSITIONS };
