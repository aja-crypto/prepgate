// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api, { authService, referralService, clearApiCache } from '../services/api';
import toast from 'react-hot-toast';
import { safeGet, safeRemove } from '../utils/storage';
import { STORAGE_KEYS } from './AccountState';

const AuthContext = createContext(null);
const progressKey = (userId) => `gatenexa_progress_${userId}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRanRef = useRef(false);
  const prevUserRef = useRef(null);
  const prevLoadingRef = useRef(true);
  const authGenRef = useRef(0);
  const [isPremium, setIsPremium] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralProgress, setReferralProgress] = useState(0);
  const [aiQuestionsRemaining, setAiQuestionsRemaining] = useState(null);
  const [aiQuestionLimit, setAiQuestionLimit] = useState(5);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    prevUserRef.current = user;
    prevLoadingRef.current = loading;
  });

  const refreshAiQuota = useCallback(async () => {
    try {
      const res = await api.get('/ai/quota');
      const d = res.data.data;
      setAiQuestionsRemaining(d.remaining);
      setAiQuestionLimit(d.limit);
      if (d.isPremium) setIsPremium(true);
    } catch {
      setAiQuestionsRemaining(0);
    }
  }, []);

  const refreshReferralStatus = useCallback(async () => {
    const gen = authGenRef.current;
    try {
      const res = await referralService.getStatus();
      if (gen !== authGenRef.current) return;
      const d = res.data.data;
      setReferralCode(d.referralCode);
      setReferralCount(d.referralCount || 0);
      setReferralProgress(d.progress || 0);
      setIsPremium(d.isPremium || false);
      await refreshAiQuota();
      if (d.isPremium && d.premiumUnlockedViaReferral) setShowCelebration(true);
    } catch {
      // Silent fail — referral system is optional
    }
  }, [refreshAiQuota]);

  const refreshPremiumStatus = useCallback(async () => {
    const gen = authGenRef.current;
    try {
      const res = await referralService.getPremiumStatus();
      if (gen !== authGenRef.current) return;
      setIsPremium(res.data.data.isPremium || false);
    } catch {}
  }, []);

  const decrementAiQuestions = useCallback(() => {
    setAiQuestionsRemaining(prev => {
      const next = prev !== null ? Math.max(0, prev - 1) : 0;
      return next;
    });
  }, []);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const token = safeGet('accessToken');
    let isGuest = safeGet('isGuest') === 'true';
    if (isGuest && import.meta.env.PROD) {
      // Demo/guest mode is unsupported in production. Purge any leftover 'isGuest'
      // flag persisted by pre-fix demo sessions so returning users aren't stuck in
      // guest mode (which the prod backend rejects with 401 on every protected call).
      localStorage.removeItem('isGuest');
      isGuest = false;
    }
    const genAtInit = authGenRef.current;
    console.log('[AUTH-DEBUG] INIT: token=', token ? 'EXISTS(' + token.length + ')' : 'NULL', 'isGuest=', isGuest);

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 30000);

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const attempt = () => {
        const gen = authGenRef.current;
        return authService.getMe()
          .then((res) => {
            if (gen !== authGenRef.current) return false;
            const userData = res.data.data.user;
            setUser(userData);
            setIsPremium(userData?.isPremium || false);
            return true;
          })
          .catch(() => false);
      };
      attempt().then((ok) => {
        if (!ok) {
          const tokenStillExists = safeGet('accessToken');
          if (tokenStillExists && tokenStillExists === token && genAtInit === authGenRef.current) {
            return attempt();
          }
        }
        if (ok) {
          refreshReferralStatus();
        }
      }).finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
    } else if (isGuest) {
      clearTimeout(timeoutId);
      setUser({
        id: 'demo_user_id',
        name: 'GATE Aspirant (Demo)',
        email: 'demo@gate2027.in',
        role: 'user',
        isGuest: true
      });
      setLoading(false);
    } else {
      clearTimeout(timeoutId);
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
    }

    const handleAuthExpired = () => {
      setUser(null);
      toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const storeSession = useCallback((userData, accessToken, refreshToken) => {
    console.log('[AUTH-DEBUG] STORE_SESSION: storing token length', accessToken?.length, 'user:', userData?.name);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('isGuest');
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    console.log('[AUTH-DEBUG] STORE_SESSION: default auth header set:', !!api.defaults.headers.common['Authorization']);
    setUser(userData);
  }, []);

  const login = useCallback(async (email, password) => {
    authGenRef.current += 1;
    clearApiCache();
    const res = await authService.login({ email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    storeSession(u, accessToken, refreshToken);
    setIsPremium(u.isPremium || false);
    refreshReferralStatus();
    toast.success(`Welcome back, ${u.name.split(' ')[0]}! 🎓`);
    return u;
  }, [storeSession, refreshReferralStatus]);

  const register = useCallback(async (name, email, password, refCode) => {
    authGenRef.current += 1;
    clearApiCache();
    const payload = { name, email, password };
    if (refCode) payload.refCode = refCode;
    const res = await authService.register(payload);
    const { user: u, accessToken, refreshToken } = res.data.data;
    localStorage.removeItem(progressKey(u.id || u._id));
    storeSession(u, accessToken, refreshToken);
    refreshReferralStatus();
    toast.success('Account created! Start tracking your GATE prep from 0%. 🚀');
    return u;
  }, [storeSession, refreshReferralStatus]);

  const googleLogin = useCallback(async (idToken) => {
    authGenRef.current += 1;
    clearApiCache();
    const res = await authService.googleAuth(idToken);
    const { user: u, accessToken, refreshToken, isNewUser } = res.data.data;
    if (isNewUser) localStorage.removeItem(progressKey(u.id || u._id));
    storeSession(u, accessToken, refreshToken);
    setIsPremium(u.isPremium || false);
    refreshReferralStatus();
    toast.success(isNewUser ? 'Welcome! Your progress starts at 0%.' : `Welcome back, ${u.name.split(' ')[0]}!`);
    return u;
  }, [storeSession, refreshReferralStatus]);

  const loginAsGuest = useCallback(() => {
    authGenRef.current += 1;
    clearApiCache();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    const guestUser = {
      id: 'demo_user_id',
      name: 'GATE Aspirant (Demo)',
      email: 'demo@gate2027.in',
      role: 'user',
      isGuest: true
    };
    setUser(guestUser);
    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('gatenexa_onboarding_done', 'true');
    toast.success('Welcome to Demo Mode! Loading sample data... 🚀');
  }, []);

  const logout = useCallback(() => {
    authGenRef.current += 1;
    clearApiCache();
    safeRemove(STORAGE_KEYS.TOKEN);
    safeRemove(STORAGE_KEYS.REFRESH);
    safeRemove(STORAGE_KEYS.GUEST);
    safeRemove('gatenexa_progress');
    safeRemove('gatenexa_onboarding_done');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsPremium(false);
    setReferralCode(null);
    setReferralCount(0);
    setReferralProgress(0);
    setAiQuestionsRemaining(null);
    setShowCelebration(false);
    setShowReferralModal(false);
    toast.success('Logged out successfully');
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await authService.deleteAccount(password);
    if (user?.id || user?._id) {
      localStorage.removeItem(progressKey(user.id || user._id));
    }
    logout();
    toast.success('Account deleted. Data recoverable for 30 days.');
  }, [user, logout]);

  const ctxValue = useMemo(() => ({
    user, loading, login, register, googleLogin, loginAsGuest, logout, deleteAccount, setUser,
    isPremium, referralCode, referralCount, referralProgress,
    aiQuestionsRemaining, setAiQuestionsRemaining, aiQuestionLimit, setAiQuestionLimit, showReferralModal, setShowReferralModal,
    showCelebration, setShowCelebration,
    refreshReferralStatus, refreshPremiumStatus, refreshAiQuota, decrementAiQuestions,
  }), [user, loading, login, register, googleLogin, loginAsGuest, logout, deleteAccount, setUser,
    isPremium, referralCode, referralCount, referralProgress,
    aiQuestionsRemaining, setAiQuestionsRemaining, aiQuestionLimit, setAiQuestionLimit, showReferralModal, setShowReferralModal,
    showCelebration, setShowCelebration,
    refreshReferralStatus, refreshPremiumStatus, refreshAiQuota, decrementAiQuestions]);

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
