import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService } from '../services/adminApi';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await adminAuthService.me();
      setAdmin(res.data.data);
    } catch {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmin(); }, [loadAdmin]);

  const login = async (email, password) => {
    const res = await adminAuthService.login(email, password);
    localStorage.setItem('adminToken', res.data.data.token);
    localStorage.setItem('adminUser', JSON.stringify(res.data.data.admin));
    setAdmin(res.data.data.admin);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, loadAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
