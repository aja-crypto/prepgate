import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { adminAuthService } from '../services/adminApi';
import { safeGet, safeSet, safeRemove } from '../utils/storage';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    const token = safeGet('adminToken');
    if (!token) {
      setLoading(false);
      return Promise.resolve();
    }
    try {
      const res = await adminAuthService.me();
      setAdmin(res.data.data);
      return Promise.resolve();
    } catch (err) {
      safeRemove('adminToken');
      safeRemove('adminUser');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setLoading(false), 15000);
    loadAdmin().finally(() => clearTimeout(timeoutId));

    const handleExpired = () => { setAdmin(null); };
    window.addEventListener('admin:expired', handleExpired);
    return () => window.removeEventListener('admin:expired', handleExpired);
  }, [loadAdmin]);

  const login = useCallback(async (email, password) => {
    const res = await adminAuthService.login(email, password);
    safeSet('adminToken', res.data.data.token);
    try { safeSet('adminUser', JSON.stringify(res.data.data.admin)); } catch {}
    setAdmin(res.data.data.admin);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    safeRemove('adminToken');
    safeRemove('adminUser');
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout, loadAdmin }), [admin, loading, login, logout, loadAdmin]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
