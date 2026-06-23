// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
const progressKey = (userId) => `gate2027_progress_${userId}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isGuest = localStorage.getItem('isGuest') === 'true';

    // Timeout: stop showing loading after 30s to prevent permanent blank screen (was 15s)
    const timeoutId = setTimeout(() => setLoading(false), 30000);

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authService.getMe()
        .then((res) => setUser(res.data.data.user))
        .catch(() => {
          // Don't delete token here — api.js interceptor handles 401 refresh + cleanup
          // Only clear on explicit 401 from getMe after interceptor already tried refresh
        })
        .finally(() => {
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
    toast.success(`Welcome back, ${u.name.split(' ')[0]}! 🎓`);
    return u;
  }, [storeSession]);

  const register = useCallback(async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    // Clear any stale local data for this user — server has empty progress
    localStorage.removeItem(progressKey(u.id || u._id));
    storeSession(u, accessToken, refreshToken);
    toast.success('Account created! Start tracking your GATE prep from 0%. 🚀');
    return u;
  }, [storeSession]);

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
     toast.success('Welcome to Demo Mode! Loading sample data... 🚀');
   }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isGuest');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
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
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, loginAsGuest, logout, deleteAccount, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
