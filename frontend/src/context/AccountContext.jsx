// ─── AccountStateContext — Single Source of Truth ───
// Wraps AuthContext. Every account-related read goes through this.
// Writes go through dispatch() which updates AccountState + syncs to AuthContext.

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import api, { authService, referralService } from '../services/api';
import { safeGet, safeSet, safeRemove } from '../utils/storage';
import { STORAGE_KEYS, DEFAULT_ACCOUNT, TRANSITIONS } from './AccountState';

const AccountContext = createContext(null);

// ─── Helpers ───
function derivePremium(user) {
  return user?.isPremium === true || user?.role === 'owner' || user?.role === 'admin';
}

const POPUPS_KEY = 'gatenexa_popups';

function loadSavedPopups() {
  try {
    const raw = localStorage.getItem(POPUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePopups(popups) {
  try { localStorage.setItem(POPUPS_KEY, JSON.stringify(popups)); } catch {}
}

function mergeAccount(user, overrides = {}) {
  const saved = loadSavedPopups();
  let popups = overrides.popups || saved || { ...DEFAULT_ACCOUNT.popups };
  
  // If backend says popup was already seen (e.g., on another device), force dismiss
  if (user?.premiumPopupSeen && !popups.celebration.dismissed) {
    popups = { ...popups, celebration: { shownAt: null, dismissed: true, version: 1 } };
  }
  
  if (!user) return { ...DEFAULT_ACCOUNT, popups, ...overrides };
  return {
    id: user.id || user._id || null,
    email: user.email || null,
    name: user.name || null,
    avatar: user.avatar || null,
    role: user.role || 'user',
    isGuest: user.isGuest || false,
    isVerified: user.isVerified || false,
    isPremium: derivePremium(user) || overrides.isPremium || false,
    premiumSource: user.premiumSource || overrides.premiumSource || null,
    premiumUnlockedAt: user.premiumUnlockedAt || overrides.premiumUnlockedAt || null,
    premiumUnlockedViaReferral: user.premiumUnlockedViaReferral || false,
    referralCode: overrides.referralCode || user.referralCode || null,
    referralCount: overrides.referralCount || user.referralCount || 0,
    referralProgress: overrides.referralProgress || 0,
    referralPendingCount: overrides.referralPendingCount || 0,
    aiQuestionsRemaining: derivePremium(user) ? 100 : (overrides.aiQuestionsRemaining ?? 5),
    predictionCredits: derivePremium(user) ? 999 : (overrides.predictionCredits ?? 5),
    streak: user.streak || { current: 0, longest: 0, lastStudyDate: null },
    studyGoalHours: user.studyGoalHours || 8,
    targetYear: user.targetYear || null,
    studyHoursThisWeek: user.studyHoursThisWeek || 0,
    completedSubjects: user.completedSubjects || 0,
    theme: user.preferences?.theme || 'dark',
    colorPreset: user.preferences?.colorPreset || 'violet',
    notifications: user.preferences?.notifications !== false,
    aiFabEnabled: safeGet(STORAGE_KEYS.AI_FAB) !== 'false',
    aiTooltipEnabled: safeGet(STORAGE_KEYS.AI_TOOLTIP) !== 'false',
    focusEnabled: safeGet(STORAGE_KEYS.FOCUS_ENABLED) !== 'false',
    focusDuration: parseInt(safeGet(STORAGE_KEYS.FOCUS_DURATION, 10)) || 25,
    ...overrides,
    popups, // computed at top — overrides any overrides.popups
  };
}

export function AccountProvider({ children }) {
  const [acct, setAcct] = useState(DEFAULT_ACCOUNT);
  const [loading, setLoading] = useState(true);
  const [lastTransition, setLastTransition] = useState(TRANSITIONS.NONE);
  const prevPremiumRef = useRef(acct.isPremium);
  const initRanRef = useRef(false);

  // Track premium transitions
  useEffect(() => {
    if (prevPremiumRef.current !== acct.isPremium) {
      setLastTransition(acct.isPremium ? TRANSITIONS.PREMIUM_GRANTED : TRANSITIONS.PREMIUM_REVOKED);
      prevPremiumRef.current = acct.isPremium;
    }
  }, [acct.isPremium]);

  // Persist popup state across refreshes
  useEffect(() => {
    savePopups(acct.popups);
  }, [acct.popups]);

  // ─── Bootstrap: called once on mount ───
  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const token = safeGet(STORAGE_KEYS.TOKEN);
    const isGuest = safeGet(STORAGE_KEYS.GUEST) === 'true';

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authService.getMe()
        .then(res => {
          const userData = res.data.data.user;
          setAcct(mergeAccount(userData, {
            // If user has already seen the premium popup on another device, mark it dismissed
            popups: userData.premiumPopupSeen
              ? { ...(loadSavedPopups() || DEFAULT_ACCOUNT.popups), celebration: { shownAt: null, dismissed: true, version: 1 } }
              : loadSavedPopups() || DEFAULT_ACCOUNT.popups,
          }));
          setLoading(false);
          // Load referral in background
          return referralService.getStatus().catch(() => null);
        })
        .then(refRes => {
          if (refRes?.data?.data) {
            const d = refRes.data.data;
            setAcct(prev => mergeAccount(prev, {
              referralCode: d.referralCode,
              referralCount: d.referralCount || 0,
              referralProgress: d.progress || 0,
          referralPendingCount: d.pendingCount || 0,
              isPremium: d.isPremium || false,
              premiumUnlockedViaReferral: d.premiumUnlockedViaReferral || false,
              aiQuestionsRemaining: d.isPremium ? 100 : 5,
              predictionCredits: d.isPremium ? 999 : 5,
              popups: d.isPremium && d.premiumUnlockedViaReferral ? {
                ...prev.popups,
                celebration: { shownAt: Date.now(), dismissed: false, version: 1 },
              } : prev.popups,
            }));
          }
        })
        .catch(() => setLoading(false));
    } else if (isGuest) {
      // Try to get a real token from backend demo endpoint
      api.post('/auth/demo').then((res) => {
        if (res.data?.success && res.data?.data) {
          const { user: userData, accessToken, refreshToken } = res.data.data;
          safeSet(STORAGE_KEYS.TOKEN, accessToken);
          if (refreshToken) safeSet(STORAGE_KEYS.REFRESH, refreshToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          setAcct(mergeAccount(userData, { isGuest: true }));
        } else {
          setAcct(mergeAccount(null, {
            id: 'guest', name: 'GATE Aspirant (Demo)', email: 'demo@gate2027.in',
            role: 'user', isGuest: true,
          }));
        }
      }).catch(() => {
        setAcct(mergeAccount(null, {
          id: 'guest', name: 'GATE Aspirant (Demo)', email: 'demo@gate2027.in',
          role: 'user', isGuest: true,
        }));
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Core actions ───

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    safeSet(STORAGE_KEYS.TOKEN, accessToken);
    safeSet(STORAGE_KEYS.REFRESH, refreshToken);
    safeRemove(STORAGE_KEYS.GUEST);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setAcct(mergeAccount(u));
    setLastTransition(TRANSITIONS.LOGIN);
    // Background referral load
    referralService.getStatus().then(r => {
      if (r?.data?.data) {
        const d = r.data.data;
        setAcct(prev => mergeAccount(prev, {
          referralCode: d.referralCode,
          referralCount: d.referralCount || 0,
          referralProgress: d.progress || 0,
          referralPendingCount: d.pendingCount || 0,
        }));
      }
    }).catch(() => {});
    return u;
  }, []);

  const register = useCallback(async (name, email, password, refCode) => {
    const payload = { name, email, password };
    if (refCode) payload.refCode = refCode;
    const res = await authService.register(payload);
    const { user: u, accessToken, refreshToken } = res.data.data;
    safeSet(STORAGE_KEYS.TOKEN, accessToken);
    safeSet(STORAGE_KEYS.REFRESH, refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setAcct(mergeAccount(u));
    setLastTransition(TRANSITIONS.SIGNUP);
    referralService.getStatus().then(r => {
      if (r?.data?.data) {
        const d = r.data.data;
        setAcct(prev => mergeAccount(prev, {
          referralCode: d.referralCode,
          referralCount: d.referralCount || 0,
          referralProgress: d.progress || 0,
          referralPendingCount: d.pendingCount || 0,
        }));
      }
    }).catch(() => {});
    return u;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const res = await authService.googleAuth(idToken);
    const { user: u, accessToken, refreshToken } = res.data.data;
    safeSet(STORAGE_KEYS.TOKEN, accessToken);
    safeSet(STORAGE_KEYS.REFRESH, refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setAcct(mergeAccount(u));
    setLastTransition(TRANSITIONS.LOGIN);
    referralService.getStatus().then(r => {
      if (r?.data?.data) {
        const d = r.data.data;
        setAcct(prev => mergeAccount(prev, {
          referralCode: d.referralCode,
          referralCount: d.referralCount || 0,
          referralProgress: d.progress || 0,
          referralPendingCount: d.pendingCount || 0,
        }));
      }
    }).catch(() => {});
    return u;
  }, []);

  const loginAsGuest = useCallback(async () => {
    safeRemove(STORAGE_KEYS.TOKEN);
    safeRemove(STORAGE_KEYS.REFRESH);
    safeSet(STORAGE_KEYS.GUEST, 'true');
    safeSet(STORAGE_KEYS.ONBOARDING, 'true');
    delete api.defaults.headers.common['Authorization'];
    
    try {
      const res = await api.post('/auth/demo');
      if (res.data?.success && res.data?.data) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        safeSet(STORAGE_KEYS.TOKEN, accessToken);
        if (refreshToken) safeSet(STORAGE_KEYS.REFRESH, refreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setAcct(mergeAccount(null, { ...userData, isGuest: true }));
        setLastTransition(TRANSITIONS.LOGIN);
        return;
      }
    } catch (err) {
      console.warn('Backend demo login failed, using local fallback:', err.message);
    }
    
    api.defaults.headers.common['X-Demo-User'] = 'true';
    setAcct(mergeAccount(null, {
      id: 'guest', name: 'GATE Aspirant (Demo)', email: 'demo@gate2027.in',
      role: 'user', isGuest: true,
    }));
    setLastTransition(TRANSITIONS.LOGIN);
  }, []);

  const logout = useCallback(() => {
    safeRemove(STORAGE_KEYS.TOKEN);
    safeRemove(STORAGE_KEYS.REFRESH);
    safeRemove(STORAGE_KEYS.GUEST);
    delete api.defaults.headers.common['X-Demo-User'];
    setAcct(DEFAULT_ACCOUNT);
    setLastTransition(TRANSITIONS.LOGOUT);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await authService.deleteAccount(password);
    logout();
  }, [logout]);

  // ─── Single refresh — combines referral + premium ───
  const refreshMembership = useCallback(async () => {
    try {
      const res = await referralService.getStatus();
      const d = res.data.data;
      setAcct(prev => mergeAccount(prev, {
        referralCode: d.referralCode,
        referralCount: d.referralCount || 0,
        referralProgress: d.progress || 0,
          referralPendingCount: d.pendingCount || 0,
        isPremium: d.isPremium || false,
        premiumUnlockedViaReferral: d.premiumUnlockedViaReferral || false,
        aiQuestionsRemaining: d.isPremium ? 100 : 5,
        predictionCredits: d.isPremium ? 999 : 5,
        popups: d.isPremium && d.premiumUnlockedViaReferral && !prev.popups.celebration.dismissed
          ? { ...prev.popups, celebration: { shownAt: Date.now(), dismissed: false, version: 1 } }
          : prev.popups,
      }));
    } catch {}
  }, []);

  // ─── Popup dismissal ───
  const dismissPopup = useCallback((name) => {
    setAcct(prev => {
      const next = {
        ...prev,
        popups: { ...prev.popups, [name]: { shownAt: Date.now(), dismissed: true, version: 1 } },
      };
      savePopups(next.popups);
      return next;
    });
    // Sync to backend for cross-device persistence
    api.post('/auth/popup-dismissed').catch(() => {});
  }, []);

  // ─── Decrement AI questions ───
  const decrementAiQuestions = useCallback(() => {
    setAcct(prev => {
      const next = Math.max(0, prev.aiQuestionsRemaining - 1);
      return {
        ...prev,
        aiQuestionsRemaining: next,
        popups: next <= 0 && !prev.popups.referralModal.dismissed
          ? { ...prev.popups, referralModal: { shownAt: Date.now(), dismissed: false, version: 1 } }
          : prev.popups,
      };
    });
  }, []);

  // ─── Expose getMembership for display ───
  const membership = useMemo(() => {
    if (acct.role === 'owner') return { label: 'OWNER', isPremium: true, badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    if (acct.role === 'admin') return { label: 'ADMIN', isPremium: true, badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (acct.isPremium) return { label: 'PREMIUM', isPremium: true, badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    return { label: 'BASIC', isPremium: false, badgeClass: 'bg-white/5 text-slate-500 border-white/10' };
  }, [acct.role, acct.isPremium]);

  const value = useMemo(() => ({
    // Core
    acct,
    loading,
    lastTransition,
    membership,

    // Auth actions
    login,
    register,
    googleLogin,
    loginAsGuest,
    logout,
    deleteAccount,
    setAcct,
    setUser: (u) => setAcct(prev => mergeAccount(u, {
      referralCode: prev.referralCode,
      referralCount: prev.referralCount,
      referralProgress: prev.referralProgress,
      referralPendingCount: prev.referralPendingCount,
      aiQuestionsRemaining: prev.aiQuestionsRemaining,
      predictionCredits: prev.predictionCredits,
      popups: prev.popups,
    })),

    // Derived (backward compat with useAuth)
    user: {
      id: acct.id,
      _id: acct.id,
      email: acct.email,
      name: acct.name,
      avatar: acct.avatar,
      role: acct.role,
      isGuest: acct.isGuest,
      isPremium: acct.isPremium,
      isVerified: acct.isVerified,
      premiumUnlockedViaReferral: acct.premiumUnlockedViaReferral,
      streak: acct.streak,
      studyGoalHours: acct.studyGoalHours,
      targetYear: acct.targetYear,
      preferences: { theme: acct.theme, notifications: acct.notifications },
    },
    isPremium: acct.isPremium,
    referralCode: acct.referralCode,
    referralCount: acct.referralCount,
    referralProgress: acct.referralProgress,
    referralPendingCount: acct.referralPendingCount,
    aiQuestionsRemaining: acct.aiQuestionsRemaining,
    showReferralModal: acct.popups.referralModal.shownAt !== null && !acct.popups.referralModal.dismissed,
    showCelebration: acct.popups.celebration.shownAt !== null && !acct.popups.celebration.dismissed,
    setShowReferralModal: (v) => v
      ? setAcct(p => ({ ...p, popups: { ...p.popups, referralModal: { shownAt: Date.now(), dismissed: false, version: 1 } } }))
      : dismissPopup('referralModal'),
    setShowCelebration: (v) => v
      ? setAcct(p => ({ ...p, popups: { ...p.popups, celebration: { shownAt: Date.now(), dismissed: false, version: 1 } } }))
      : dismissPopup('celebration'),

    // Membership
    refreshMembership,
    refreshReferralStatus: refreshMembership,
    refreshPremiumStatus: refreshMembership,
    decrementAiQuestions,
    dismissPopup,
  }), [acct, loading, lastTransition, membership, login, register, googleLogin, loginAsGuest, logout, deleteAccount, refreshMembership, decrementAiQuestions, dismissPopup]);

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}

// Backward-compatible alias
export const useAuth = useAccount;
