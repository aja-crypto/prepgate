// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { authService, referralService } from '../services/api';
import toast from 'react-hot-toast';
import { safeGet } from '../utils/storage';

const AuthContext = createContext(null);
const progressKey = (userId) => `gatenexa_progress_${userId}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRanRef = useRef(false);
  const prevUserRef = useRef(null);
  const prevLoadingRef = useRef(true);
  const [isPremium, setIsPremium] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralProgress, setReferralProgress] = useState(0);
  const [aiQuestionsRemaining, setAiQuestionsRemaining] = useState(5);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // DEBUG: Log auth state changes
  useEffect(() => {
    if (prevUserRef.current !== user || prevLoadingRef.current !== loading) {
      console.log('[Trace] Auth state changed — loading:', prevLoadingRef.current, '→', loading, '| user:', !!prevUserRef.current, '→', !!user);
      prevUserRef.current = user;
      prevLoadingRef.current = loading;
    }
  });

  const refreshReferralStatus = useCallback(async () => {
    try {
      const res = await referralService.getStatus();
      const d = res.data.data;
      setReferralCode(d.referralCode);
      setReferralCount(d.referralCount || 0);
      setReferralProgress(d.progress || 0);
      setIsPremium(d.isPremium || false);
      setAiQuestionsRemaining(d.isPremium ? 100 : 5);
      if (d.isPremium && d.premiumUnlockedViaReferral) setShowCelebration(true);
    } catch {
      // Silent fail — referral system is optional
    }
  }, []);

  const refreshPremiumStatus = useCallback(async () => {
    try {
      const res = await referralService.getPremiumStatus();
      setIsPremium(res.data.data.isPremium || false);
    } catch {}
  }, []);

  const decrementAiQuestions = useCallback(() => {
    setAiQuestionsRemaining(prev => {
      const next = Math.max(0, prev - 1);
      if (next <= 0) setShowReferralModal(true);
      return next;
    });
  }, []);

  useEffect(() => {
    if (initRanRef.current) { console.log('[Trace] AuthContext — init already ran, skipping'); return; }
    initRanRef.current = true;

    const token = safeGet('accessToken');
    const isGuest = safeGet('isGuest') === 'true';

    console.log('[Trace] AuthContext init — hasToken:', !!token, 'isGuest:', isGuest);

    const timeoutId = setTimeout(() => {
      console.warn('[Trace] AuthContext — 30s timeout reached, forcing loading=false');
      setLoading(false);
    }, 30000);

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const attempt = () => authService.getMe()
        .then((res) => {
          const userData = res.data.data.user;
          console.log('[Trace] AuthContext — getMe SUCCESS, user:', userData?.email);
          setUser(userData);
          if (userData?.isPremium) setIsPremium(true);
          return true;
        })
        .catch((err) => {
          console.warn('[Trace] AuthContext — getMe FAILED:', err?.message);
          return false;
        });
      attempt().then((ok) => {
        if (!ok) {
          const tokenStillExists = safeGet('accessToken');
          if (tokenStillExists && tokenStillExists === token) {
            console.log('[Trace] AuthContext — retrying getMe...');
            return attempt();
          }
        }
        if (ok) {
          refreshReferralStatus();
        }
      }).finally(() => {
        clearTimeout(timeoutId);
        console.log('[Trace] AuthContext — setting loading=false');
        setLoading(false);
      });
    } else if (isGuest) {
      clearTimeout(timeoutId);
      console.log('[Trace] AuthContext — guest mode, setting demo user');
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
      console.log('[Trace] AuthContext — no token, setting loading=false');
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
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('isGuest');
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(userData);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    storeSession(u, accessToken, refreshToken);
    if (u.isPremium) setIsPremium(true);
    refreshReferralStatus();
    toast.success(`Welcome back, ${u.name.split(' ')[0]}! 🎓`);
    return u;
  }, [storeSession, refreshReferralStatus]);

  const register = useCallback(async (name, email, password, refCode) => {
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
    const res = await authService.googleAuth(idToken);
    const { user: u, accessToken, refreshToken, isNewUser } = res.data.data;
    if (isNewUser) localStorage.removeItem(progressKey(u.id || u._id));
    storeSession(u, accessToken, refreshToken);
    toast.success(isNewUser ? 'Welcome! Your progress starts at 0%.' : `Welcome back, ${u.name.split(' ')[0]}!`);
    return u;
  }, [storeSession]);

  const loginAsGuest = useCallback(() => {
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isGuest');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsPremium(false);
    setReferralCode(null);
    setReferralCount(0);
    setReferralProgress(0);
    setAiQuestionsRemaining(5);
    setShowCelebration(false);
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

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, googleLogin, loginAsGuest, logout, deleteAccount, setUser,
      isPremium, referralCode, referralCount, referralProgress,
      aiQuestionsRemaining, setAiQuestionsRemaining, showReferralModal, setShowReferralModal,
      showCelebration, setShowCelebration,
      refreshReferralStatus, refreshPremiumStatus, decrementAiQuestions,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
