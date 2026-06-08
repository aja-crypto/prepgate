// Premium app shell — glass sidebar, modern nav
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProgress } from '../../context/ProgressContext';
import { BRAND } from '../../design/tokens';
import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';
import Icon from '../ui/Icon';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import VirtualCalculator from './VirtualCalculator';

const NAV = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'AI Mentor', icon: 'zap', to: '/mentor' },
  { label: 'Analytics', icon: 'analytics', to: '/analytics' },
  { section: 'Study' },
  { label: 'Subjects', icon: 'subjects', to: '/subjects' },
  { label: 'Topics', icon: 'topics', to: '/topics' },
  { label: 'Planner', icon: 'planner', to: '/planner' },
  { label: 'Formulas', icon: 'formulas', to: '/formulas' },
  { label: 'Resources', icon: 'resources', to: '/resources' },
  { label: 'Notes', icon: 'notes', to: '/notes' },
  { label: 'Revision', icon: 'revision', to: '/revision' },
  { label: 'Productivity', icon: 'productivity', to: '/productivity' },
  { section: 'Practice' },
  { label: 'PYQ Practice', icon: 'pyq', to: '/pyq' },
  { label: 'Mock Tests', icon: 'mocks', to: '/mocks' },
  { section: 'Tools' },
  { label: 'Calculator', icon: 'calculator', onClick: 'toggleCalc' },
  { section: 'Account' },
  { label: 'Settings', icon: 'settings', to: '/settings' },
];

function BackupBadge({ status }) {
  const colors = { saved: 'bg-success', saving: 'bg-accent animate-pulse', error: 'bg-danger' };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.saved}`} />;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { themeMode, toggleTheme, isDark, onboardingDone } = useTheme();
  const { backupStatus } = useProgress();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useGlobalSearchShortcut(setSearchOpen);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {!onboardingDone && <OnboardingFlow />}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VirtualCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:relative z-50 md:z-auto h-full w-[240px] max-w-[85vw] glass-sidebar flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon name="logo" />
            <div>
              <div className="text-sm font-bold text-text tracking-tight">{BRAND.name}</div>
              <div className="text-[10px] text-text3 font-medium">{BRAND.product}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className="text-[10px] uppercase tracking-[0.12em] text-text3 font-semibold px-3 pt-5 pb-1.5">
                  {item.section}
                </div>
              );
            }
            if (item.onClick === 'toggleCalc') {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setCalcOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 my-0.5 text-text2 hover:bg-hover hover:text-text"
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 my-0.5 ${
                    isActive ? 'nav-item-active text-primary' : 'text-text2 hover:bg-hover hover:text-text'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            );
          })}
          {user?.role === 'admin' && (
            <>
              <div className="text-[10px] uppercase tracking-[0.12em] text-text3 font-semibold px-3 pt-5 pb-1.5">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all my-0.5 ${isActive ? 'nav-item-active text-primary' : 'text-text2 hover:bg-hover hover:text-text'}`
                }
              >
                <Icon name="admin" />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 rounded-xl bg-bg-2/50 border border-border p-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text truncate">{user?.name}</div>
              <div className="text-[10px] text-text3 truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
              className="text-text3 hover:text-danger transition-colors p-1"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border glass-sidebar">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden btn-ghost !p-2.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-xs sm:max-w-md flex items-center gap-2 rounded-xl border border-border bg-bg-2/60 backdrop-blur-sm px-3 sm:px-4 py-2.5 text-left hover:border-primary/25 transition-all"
          >
            <Icon name="search" className="text-text3 shrink-0" />
            <span className="text-xs text-text3 flex-1 truncate">Search topics, notes, PYQs...</span>
            <kbd className="hidden sm:inline text-[10px] text-text3 bg-surface border border-border px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-text3 px-2">
              <BackupBadge status={backupStatus} />
              <span>Synced</span>
            </div>
            <button
              onClick={toggleTheme}
              title={`Theme: ${themeMode}`}
              className="btn-ghost !p-2.5 !rounded-xl"
            >
              {isDark ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={() => navigate('/settings')} className="btn-ghost !p-2.5 !rounded-xl">
              <Icon name="settings" />
            </button>
          </div>
        </header>

        <div className="p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in flex-1 max-w-[1400px] w-full mx-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
