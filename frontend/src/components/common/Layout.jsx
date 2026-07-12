// Premium app shell — glass sidebar, modern nav
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, memo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { throttle } from '../../utils/perf';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProgress } from '../../context/ProgressContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../design/tokens';
import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';
import Icon from '../ui/Icon';
import BrandText from '../ui/BrandText';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import VirtualCalculator from './VirtualCalculator';
import NotificationBell from './NotificationBell';
import SmartScrollNavigator from './SmartScrollNavigator';
import NexaPersona from './NexaPersona';

function GateVaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 shrink-0 gate-vault-icon"
      style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }}
    >
      <rect x="3" y="8" width="18" height="12" rx="2" className="gv-rect" />
      <path d="M7 8V6a5 5 0 0 1 10 0v2" className="gv-path" />
      <line x1="12" y1="12" x2="12" y2="16" className="gv-line" />
      <path d="M9 12v2a3 3 0 0 0 6 0v-2" className="gv-path2" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const onScroll = throttle(() => setShow(main.scrollTop > 400), 150);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 md:right-6 z-40 w-10 h-10 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-text2 hover:text-primary hover:border-primary/30 transition-all"
      aria-label="Back to top"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
    </button>
  );
}

const NAV = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: '✨ GateNexa AI', icon: 'zap', to: '/GateNexa-ai' },
  { section: 'Study' },
  { label: 'Subjects', icon: 'subjects', to: '/subjects' },
  { label: 'Topics', icon: 'topics', to: '/topics' },
  { label: 'Notes', icon: 'notes', to: '/notes' },
  { label: 'Focus', icon: 'productivity', to: '/productivity' },
  { section: 'Practice' },
  { label: 'PYQ', icon: 'pyq', to: '/pyq' },
  { label: 'Mock Tests', icon: 'mocks', to: '/mocks' },
  { label: 'Planner', icon: 'planner', to: '/planner' },
  { section: 'Insights' },
  { label: 'Analytics', icon: 'analytics', to: '/analytics' },
  { label: 'AIR Predictor', icon: 'analytics', to: '/air-predictor' },
  { section: 'More' },
  { label: 'Gate Vault', icon: 'folder', to: '/gate-vault' },
  { label: 'NEXA Predictor', icon: 'analytics', to: '/opportunity-predictor' },
  { label: 'Learning Hub', icon: 'zap', to: '/learning-hub' },
  { label: 'Mistakes', icon: 'target', to: '/mistakes' },
  { label: 'GATE Papers', icon: 'pyq', to: '/gate-papers' },
  { label: 'Calculator', icon: 'calculator', onClick: 'toggleCalc' },
  { section: 'Account' },
  { label: 'Settings', icon: 'settings', to: '/settings' },
  { label: 'Feedback', icon: 'feedback', to: '/feedback' },
];

function BackupBadge({ status }) {
  const colors = { saved: 'bg-success', saving: 'bg-accent animate-pulse', error: 'bg-danger' };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] || colors.saved}`} />;
}

/* Prefetch NavLink — loads JS chunk on hover/touch for instant navigation */
const PrefetchLink = React.memo(({ to, children, className, onClick }) => {
  const prefetched = useRef(false);
  const handlePrefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    const pageMap = {
      '/dashboard': () => import('../../pages/DashboardPage'),
      '/subjects': () => import('../../pages/SubjectsPage'),
      '/topics': () => import('../../pages/TopicsPage'),
      '/GateNexa-ai': () => import('../../pages/GateNexaAIPage'),
      '/notes': () => import('../../pages/NotesPage'),
      '/pyq': () => import('../../pages/PYQPage'),
      '/mocks': () => import('../../pages/MocksPage'),
      '/planner': () => import('../../pages/StudyPlannerPage'),
      '/analytics': () => import('../../pages/AnalyticsPage'),
      '/settings': () => import('../../pages/SettingsPage'),
      '/productivity': () => import('../../pages/ProductivityPage'),
      '/air-predictor': () => import('../../pages/AirPredictorPage'),
      '/gate-vault': () => import('../../pages/GateVaultPage'),
      '/opportunity-predictor': () => import('../../pages/OpportunityPredictorPage'),
      '/mistakes': () => import('../../pages/MistakeNotebookPage'),
      '/gate-papers': () => import('../../pages/GatePapersPage'),
      '/feedback': () => import('../../pages/FeedbackPage'),
    };
    const loader = pageMap[to];
    if (loader) loader().catch(() => {});
  }, [to]);
  return React.createElement(NavLink, {
    to,
    className,
    onClick,
    onMouseEnter: handlePrefetch,
    onTouchStart: handlePrefetch,
    children,
  });
});

/* Memoized sidebar nav — only re-renders when user role changes */
const SidebarNav = React.memo(({ onNavClick, onCalcClick }) => {
  const { user } = useAuth();
  return (
    <>
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
              onClick={onCalcClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 my-0.5 text-text2 hover:bg-hover hover:text-text"
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          );
        }
        if (item.label === 'Gate Vault') {
          return (
            <PrefetchLink
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all duration-200 my-0.5 ${
                  isActive ? 'nav-item-active text-primary' : 'text-text2 hover:bg-hover hover:text-text'
                }`
              }
            >
              <GateVaultIcon />
              {item.label}
            </PrefetchLink>
          );
        }
        return (
          <PrefetchLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all duration-200 my-0.5 ${
                isActive ? 'nav-item-active text-primary' : 'text-text2 hover:bg-hover hover:text-text'
              }`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </PrefetchLink>
        );
      })}
      {(user?.role === 'owner' || user?.role === 'admin') && (
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
    </>
  );
});

const Layout = memo(function Layout() {
  useEffect(() => { const t = Date.now(); console.log('[Trace] Layout MOUNTED at', t); return () => console.log('[Trace] Layout UNMOUNTED after', Date.now() - t, 'ms'); }, []);
  const { user, logout, isPremium, referralProgress } = useAuth();
  const { themeMode, toggleTheme, isDark, onboardingDone } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (window.innerWidth < 768 || ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches)) return;
      const key = e.key.toLowerCase();
      if (key === 'f' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/productivity'); }
      else if (key === 'n' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/study-hub'); }
      else if (key === 'q' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/pyq'); }
      else if (key === 'd' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/dashboard'); }
      else if (key === 'm' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/mocks'); }
      else if (key === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); navigate('/settings'); }
      else if (key === 'escape') { setSidebarOpen(false); setCalcOpen(false); setSearchOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(false);
  dropdownRef.current = profileDropdownOpen;
  const location = useLocation();

  useGlobalSearchShortcut(setSearchOpen);

  /* Only close sidebar if it's actually open — avoids wasteful re-render */
  useEffect(() => {
    if (sidebarOpen) setSidebarOpen(false);
  }, [location.pathname, sidebarOpen]);

  /* Click-outside handler — uses ref to avoid re-subscribing on every toggle */
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !e.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);


  const handleNavClick = useCallback(() => setSidebarOpen(false), []);
  const handleCalcOpen = useCallback(() => { setCalcOpen(true); setSidebarOpen(false); }, []);

  // Swipe to close sidebar on mobile
  const sidebarTouchStart = useRef(null);
  const handleSidebarTouchStart = useCallback((e) => {
    sidebarTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleSidebarTouchEnd = useCallback((e) => {
    if (!sidebarTouchStart.current) return;
    const dx = e.changedTouches[0].clientX - sidebarTouchStart.current.x;
    const dy = e.changedTouches[0].clientY - sidebarTouchStart.current.y;
    sidebarTouchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dy) < 100 && dx < 0) setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen bg-bg overflow-hidden relative">
      {!onboardingDone && <OnboardingFlow />}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VirtualCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}
          onTouchStart={handleSidebarTouchStart} onTouchEnd={handleSidebarTouchEnd} />
      )}

      <style>{`
        .gate-vault-icon { animation: gv-float 3s ease-in-out infinite; }
        .gate-vault-icon .gv-rect { animation: gv-pulse-op 4s ease-in-out infinite; }
        .gate-vault-icon .gv-path { animation: gv-pulse-op 4s ease-in-out infinite; }
        @keyframes gv-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes gv-pulse-op { 0%,100% { opacity: 0.8; } 50% { opacity: 1; } }
      `}</style>

      <aside className={`
        fixed md:relative z-50 md:z-40 h-full w-[220px] max-w-[85vw] glass-sidebar flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} onTouchStart={handleSidebarTouchStart} onTouchEnd={handleSidebarTouchEnd}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Icon name="logo" className="w-9 h-9" />
            <div>
              <div className="text-sm font-bold text-text tracking-tight">{BRAND.name}</div>
              <div className="text-[9px] text-text3 font-medium">{BRAND.product}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <SidebarNav onNavClick={handleNavClick} onCalcClick={handleCalcOpen} />
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 rounded-xl bg-bg-2/50 border border-border p-2.5">
            <NexaPersona user={user} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text truncate">{user?.name}</div>
              {user?.role === 'owner' && (
                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold mt-0.5">👑 OWNER</span>
              )}
              {user?.role === 'admin' && (
                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 font-semibold mt-0.5">Admin</span>
              )}
              {user?.role !== 'owner' && user?.role !== 'admin' && (
                isPremium ? (
                  <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-semibold mt-0.5">⭐ PREMIUM</span>
                ) : (
                  <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/10 font-semibold mt-0.5">BASIC</span>
                )
              )}
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
              className="text-text3 hover:text-danger transition-colors p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 relative z-10 transition-all duration-300 page-enter">
        <header className="sticky top-0 z-30 flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 glass-header">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent('close-ai')); setTimeout(() => setSidebarOpen(true), 100); }}
            aria-label="Open navigation menu"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-text2 hover:text-text hover:bg-white/5 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          {/* Left: GateNexa AI Emblem - clickable for brand intro */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-brand-intro'))}
            className="flex-shrink-0 hidden sm:block cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label="About GateNexa"
          >
            <svg 
              viewBox="0 0 120 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-24 md:w-32 h-14 md:h-20"
              style={{filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.4)) drop-shadow(0 0 16px rgba(34,211,238,0.15))'}}
            >
              {/* Outer wing-like shapes */}
              <path d="M10 40 L25 20 L40 30 L25 50 Z" fill="url(#wingGradient1)" stroke="#A855F7" strokeWidth="1.5" />
              <path d="M110 40 L95 20 L80 30 L95 50 Z" fill="url(#wingGradient1)" stroke="#A855F7" strokeWidth="1.5" />
              {/* Central emblem */}
              <circle cx="60" cy="40" r="20" fill="rgba(10,15,44,0.8)" stroke="#A855F7" strokeWidth="2" />
              <circle cx="60" cy="40" r="12" fill="rgba(120,60,220,0.3)" stroke="#22D3EE" strokeWidth="1.5">
                <animate attributeName="r" values="12;14;12" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* AI core circle */}
              <circle cx="60" cy="40" r="6" fill="#22D3EE">
                <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="40" r="2" fill="white" />
              {/* Bottom base */}
              <rect x="40" y="60" width="40" height="8" rx="4" fill="rgba(10,15,44,0.9)" stroke="#22D3EE" strokeWidth="1.5" />
              {/* Gradients */}
              <defs>
                <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="50%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
              </defs>
            </svg>
          </button>

          <NotificationBell />

          {/* Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="flex-1 max-w-xs md:max-w-sm flex items-center gap-2 md:gap-2 rounded-xl border border-border/50 bg-bg-2/70 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 text-left hover:border-primary/40 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-6 md:h-6 text-text3 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <span className="text-xs md:text-sm text-text3 flex-1 truncate">Search topics, notes, PYQs...</span>
            <kbd className="hidden lg:inline text-[11px] text-text3 bg-surface/50 border border-border/50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-mono">⌘K</kbd>
          </button>

          {/* Main Navigation Icons with Labels */}
          <nav className="hidden xl:flex items-center gap-3">
            <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <path d="M3 12l9-9 9 9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V9h6v12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 17h10" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold">Dashboard</span>
            </NavLink>

            <NavLink to="/pyq" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <path d="M4 4h16v16H4z" />
                <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold">PYQs</span>
            </NavLink>

            <NavLink to="/mocks" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <path d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold">Mock Tests</span>
            </NavLink>

            <NavLink to="/planner" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <rect x="4" y="5" width="16" height="16" rx="2" />
                <path d="M16 3v4M8 3v4" strokeLinecap="round" />
                <path d="M8 12h8M8 16h6" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold">Planner</span>
            </NavLink>

            <NavLink to="/productivity" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold">Focus</span>
            </NavLink>

            <NavLink to="/GateNexa-ai" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" style={{filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.4)) drop-shadow(0 0 4px rgba(168,85,247,0.3))'}}>
                <path d="M4 11 C7 6 17 6 20 11 L22 13 L20 16 L17 19 L15 17 L13 19 L11 17 L9 19 L7 17 L4 16 L2 13 Z" fill="rgba(30,27,75,0.95)" stroke="#22D3EE" strokeWidth="1.6" />
                <rect x="9" y="4" width="6" height="13" rx="2" fill="rgba(30,27,75,0.9)" stroke="#A855F7" strokeWidth="2" />
                <path d="M7 8 Q12 3 17 8" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" fill="none" />
                <rect x="6" y="17" width="12" height="4" rx="2" fill="rgba(2,6,23,0.95)" stroke="#22D3EE" strokeWidth="1.6" />
                <circle cx="12" cy="11" r="2.5" fill="#22D3EE">
                  <animate attributeName="r" values="2.5;3.5;2.5" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="11" r="1" fill="white" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold"><BrandText /> AI</span>
            </NavLink>

            <button
              onClick={() => { setCalcOpen(true); }}
              aria-label="Open calculator"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all text-text2 hover:text-primary hover:bg-hover/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3M8 19h8" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold">Calculator</span>
            </button>

            <NavLink to="/" title="Visit Homepage" className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive ? 'text-primary bg-primary/10 border-b-2 border-primary' : 'text-text2 hover:text-primary hover:bg-hover/50'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold">Home</span>
            </NavLink>
          </nav>

          {/* Right Side: Controls */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Open profile menu"
                aria-expanded={profileDropdownOpen}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all"
              >
                <NexaPersona user={user} size={40} />
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text2 hidden md:block">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 shadow-2xl" style={{ background: '#0F1119', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="text-sm font-semibold text-text">{user?.name}</div>
                    <div className="text-xs text-text3 truncate">{user?.email}</div>
                    <div className="mt-1.5">
                      {isPremium ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                          ⭐ PREMIUM
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          BASIC
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="py-2">
                    <button onClick={() => { navigate('/referral'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <span className="text-base">🎁</span>
                      <span className="flex-1 text-left">Free Premium</span>
                      {!isPremium && (
                        <span className="text-[10px] text-purple-400 font-semibold">{Math.min(100, Math.round(referralProgress))}%</span>
                      )}
                      {isPremium && <span className="text-[10px] text-yellow-400">⭐ Active</span>}
                    </button>
                    <button onClick={() => { navigate('/'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd" /></svg>
                      Visit Homepage
                    </button>
                    <button onClick={() => { window.dispatchEvent(new Event('open-brand-intro')); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      About GateNexa
                    </button>
                    <button onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      Account
                    </button>
                    <button onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      Settings
                    </button>
                    <button onClick={() => { navigate('/feedback'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" /></svg>
                      Feedback
                    </button>
                    <button onClick={() => { navigate('/help'); setProfileDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                      Help & Support
                    </button>
                  </div>
                  <div className="border-t border-white/5 py-2">
                    <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text2 hover:bg-white/5 transition-colors">
                      {isDark ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><circle cx="10" cy="10" r="5" /><path d="M10 1v2M10 17v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 10h2M17 10h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" /></svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                      )}
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-2 sm:p-3 md:p-4 lg:p-5 max-w-full sm:max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-6 h-6 rounded-lg border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[11px] text-text3 font-medium">Loading page...</p>
              </div>
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="flex-1 flex flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
      <BackToTop />
      <SmartScrollNavigator />
    </div>
  );
});

export default Layout;

