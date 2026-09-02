import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { adminAuthService } from '../services/adminApi';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    console.log('[ADMIN-DIAG] AdminAuthContext loadAdmin:', { hasToken: !!token });
    if (!token) {
      setLoading(false);
      return Promise.resolve();
    }
    try {
      const res = await adminAuthService.me();
      console.log('[ADMIN-DIAG] AdminAuthContext me() success:', { admin: !!res.data?.data, name: res.data?.data?.name, role: res.data?.data?.role });
      setAdmin(res.data.data);
      return Promise.resolve();
    } catch (err) {
      console.error('[ADMIN-DIAG] AdminAuthContext me() FAILED:', { status: err.response?.status, message: err.response?.data?.message || err.message });
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
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
    localStorage.setItem('adminToken', res.data.data.token);
    localStorage.setItem('adminUser', JSON.stringify(res.data.data.admin));
    setAdmin(res.data.data.admin);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
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
