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

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authService.getMe()
        .then((res) => setUser(res.data.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else if (isGuest) {
      setUser({
        id: 'guest_123',
        name: 'GATE Aspirant (Demo)',
        email: 'guest@example.com',
        role: 'user',
        isGuest: true
      });
      setLoading(false);
    } else {
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
