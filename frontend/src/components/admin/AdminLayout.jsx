import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import Icon from '../ui/Icon';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'grid' },
  { section: 'CONTENT' },
  { path: '/admin/cms', label: 'CMS', icon: 'edit' },
  { section: 'MANAGEMENT' },
  { path: '/admin/users', label: 'Users', icon: 'users' },
  { path: '/admin/pdfs', label: 'PDF Library', icon: 'file-text' },
  { path: '/admin/mock-tests', label: 'Mock Tests', icon: 'mock-tests' },
  { path: '/admin/pyq', label: 'PYQs', icon: 'pyq' },
  { path: '/admin/question-bank', label: 'Question Bank', icon: 'database' },
  { path: '/admin/gate-vault', label: 'Gate Vault', icon: 'vault' },
  { section: 'ANALYTICS' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'bar-chart' },
  { path: '/admin/ai-analytics', label: 'AI Analytics', icon: 'cpu' },
  { section: 'SYSTEM' },
  { path: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  { path: '/admin/system-health', label: 'System Health', icon: 'activity' },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="font-bold text-text">PrepGate Admin</span>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className="text-[10px] font-semibold uppercase tracking-widest text-text3/50 px-3 pt-4 pb-1">
                  {item.section}
                </div>
              );
            }
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text3 hover:text-text hover:bg-bg-2'
                }`}
              >
                <Icon name={item.icon} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-text truncate">{admin?.name}</div>
                <span className="shrink-0 inline-block text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 font-semibold leading-tight">ADMIN</span>
              </div>
              <div className="text-[10px] text-text3 truncate">{admin?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
            </div>
            <button onClick={handleLogout} className="text-text3 hover:text-danger transition-colors p-1.5" title="Logout">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center gap-3 px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-text3 hover:text-text -ml-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
          <div className="flex-1" />
          <Link to="/" className="text-[11px] text-text3 hover:text-text transition-colors px-3 py-1.5 rounded-lg border border-border">
            Back to Site
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
