// Premium app shell — glass sidebar, modern nav
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, memo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { throttle } from '../../utils/perf';
import { useAuthData, useAuthActions } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useProgress } from '../../context/ProgressContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../design/tokens';
import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';
import Icon from '../ui/Icon';
import BrandText from '../ui/BrandText';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import QuickActions from '../onboarding/QuickActions';
import VirtualCalculator from './VirtualCalculator';
import NotificationPanel from '../notifications/NotificationPanel';
import SmartScrollNavigator from './SmartScrollNavigator';
import NexaPersona from './NexaPersona';
import SidebarNav from './navigation/SidebarNav';
import MobileBottomNav from './navigation/MobileBottomNav';

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

const Layout = memo(function Layout() {
  const { user, isPremium, referralProgress } = useAuthData();
  const { logout } = useAuthActions();
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

  /* Close sidebar on navigation */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
      {!onboardingDone && (
        <div className="fixed inset-0 z-[9999] backdrop-blur-[15px] bg-black/40">
          <OnboardingFlow />
        </div>
      )}
      {onboardingDone && <QuickActions />}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VirtualCalculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}
          onTouchStart={handleSidebarTouchStart} onTouchEnd={handleSidebarTouchEnd} />
      )}

      <aside className={`
        fixed md:relative z-50 md:z-40 h-full w-[220px] max-w-[85vw] glass-sidebar flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} onTouchStart={handleSidebarTouchStart} onTouchEnd={handleSidebarTouchEnd}>
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Icon name="logo" className="w-9 h-9" />
            <div>
              <div className="text-sm font-bold text-text tracking-tight">{BRAND.name}</div>
              <div className="text-[9px] text-text3 font-medium">{BRAND.product}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 sidebar-nav-scroll">
          <SidebarNav onNavClick={handleNavClick} onCalcClick={handleCalcOpen} />
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
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
        <header className="sticky top-0 z-30 flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 py-2 md:py-3 glass-header relative">
          <div className="header-hairline" />
          {/* ═══ MOBILE HEADER (grid, hidden on md+) ═══ */}
          <div className="mobile-top-header md:hidden absolute inset-0 z-50 bg-[rgba(10,15,44,0.95)]">
            <button
              id="mobile-hamburger"
              onClick={() => { window.dispatchEvent(new CustomEvent('close-ai')); setTimeout(() => setSidebarOpen(true), 150); }}
              aria-label="Open navigation menu"
              className="mobile-header-btn flex items-center justify-center rounded-xl text-text2 hover:text-text hover:bg-white/10 active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="search-bar-glass flex items-center gap-2 rounded-xl px-3 h-[40px] text-left overflow-hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-text3 shrink-0">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-text3 truncate">Search topics...</span>
            </button>

            <div className="flex justify-end">
              <NotificationPanel />
            </div>
          </div>

          {/* ═══ DESKTOP HEADER (original, unchanged) ═══ */}
          <button
            id="mobile-hamburger"
            onClick={() => { window.dispatchEvent(new CustomEvent('close-ai')); setTimeout(() => setSidebarOpen(true), 150); }}
            aria-label="Open navigation menu"
            className="mobile-header-btn md:hidden flex items-center justify-center rounded-xl text-text2 hover:text-text hover:bg-white/10 active:scale-95 transition-all shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => window.dispatchEvent(new Event('open-brand-intro'))}
            className="flex-shrink-0 hidden md:block cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label="About GateNexa"
          >
            <svg 
              viewBox="0 0 120 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-20 lg:w-28 xl:w-32 h-12 lg:h-16 xl:h-20"
              style={{filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.4)) drop-shadow(0 0 16px rgba(34,211,238,0.15))'}}
            >
              <path d="M10 40 L25 20 L40 30 L25 50 Z" fill="url(#wingGradient1)" stroke="#A855F7" strokeWidth="1.5" />
              <path d="M110 40 L95 20 L80 30 L95 50 Z" fill="url(#wingGradient1)" stroke="#A855F7" strokeWidth="1.5" />
              <circle cx="60" cy="40" r="20" fill="rgba(10,15,44,0.8)" stroke="#A855F7" strokeWidth="2" />
              <circle cx="60" cy="40" r="12" fill="rgba(120,60,220,0.3)" stroke="#22D3EE" strokeWidth="1.5">
                <animate attributeName="r" values="12;14;12" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="40" r="6" fill="#22D3EE">
                <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="40" r="2" fill="white" />
              <rect x="40" y="60" width="40" height="8" rx="4" fill="rgba(10,15,44,0.9)" stroke="#22D3EE" strokeWidth="1.5" />
              <defs>
                <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="50%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
              </defs>
            </svg>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="hidden md:flex search-bar-glass flex-1 min-w-0 items-center gap-2 rounded-xl px-4 py-2.5 min-h-[44px] text-left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="search-icon w-5 h-5 text-text3 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] text-text3 truncate">Search topics, notes, PYQs...</span>
            <kbd className="hidden lg:inline text-[11px] text-text3 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md font-mono">⌘K</kbd>
          </button>

          <div className="hidden md:block shrink-0">
            <NotificationPanel />
          </div>

          {/* Main Navigation Icons with Labels */}
          <nav className="hidden xl:flex items-center gap-1.5">
            <NavLink to="/dashboard" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <path d="M3 12l9-9 9 9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V9h6v12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 17h10" strokeLinecap="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Dashboard</span>
            </NavLink>

            <NavLink to="/pyq" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <path d="M4 4h16v16H4z" />
                <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">PYQs</span>
            </NavLink>

            <NavLink to="/mocks" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <path d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Mocks</span>
            </NavLink>

            <NavLink to="/planner" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <rect x="4" y="5" width="16" height="16" rx="2" />
                <path d="M16 3v4M8 3v4" strokeLinecap="round" />
                <path d="M8 12h8M8 16h6" strokeLinecap="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Planner</span>
            </NavLink>

            <NavLink to="/productivity" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Focus</span>
            </NavLink>

            <NavLink to="/mentor" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl relative ${isActive ? 'topnav-link-active text-cyan-200' : 'text-text2 hover:text-cyan-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[22px] h-[22px]" style={{filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.4)) drop-shadow(0 0 4px rgba(168,85,247,0.3))'}}>
                <path d="M4 11 C7 6 17 6 20 11 L22 13 L20 16 L17 19 L15 17 L13 19 L11 17 L9 19 L7 17 L4 16 L2 13 Z" fill="rgba(30,27,75,0.95)" stroke="#22D3EE" strokeWidth="1.6" />
                <rect x="9" y="4" width="6" height="13" rx="2" fill="rgba(30,27,75,0.9)" stroke="#A855F7" strokeWidth="2" />
                <path d="M7 8 Q12 3 17 8" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" fill="none" />
                <rect x="6" y="17" width="12" height="4" rx="2" fill="rgba(2,6,23,0.95)" stroke="#22D3EE" strokeWidth="1.6" />
                <circle cx="12" cy="11" r="2.5" fill="#22D3EE">
                  <animate attributeName="r" values="2.5;3.5;2.5" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="12" cy="11" r="1" fill="white" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-[10.5px] font-semibold"><BrandText /> AI</span>
            </NavLink>

            <button
              onClick={() => { setCalcOpen(true); }}
              aria-label="Open calculator"
              className="topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl text-text2 hover:text-purple-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3M8 19h8" strokeLinecap="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Calc</span>
            </button>

            <NavLink to="/" title="Visit Homepage" className={({ isActive }) => `topnav-link flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-2xl ${isActive ? 'topnav-link-active text-purple-200' : 'text-text2 hover:text-purple-200'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10.5px] font-semibold">Home</span>
            </NavLink>
          </nav>

          {/* Right Side: Controls */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            {/* Profile Dropdown - hidden on mobile, bottom nav handles it */}
            <div className="relative profile-dropdown hidden md:block">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Open profile menu"
                aria-expanded={profileDropdownOpen}
                className="profile-avatar-btn flex items-center gap-2 p-1 rounded-xl"
              >
                <NexaPersona user={user} size={40} />
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text2 hidden md:block">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50 shadow-2xl"
                  style={{ background: 'rgba(13,15,30,0.92)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.06)' }}
                >
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
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="px-2 sm:px-3 md:px-4 lg:px-5 pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 max-w-full sm:max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
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
      <MobileBottomNav />
    </div>
  );
});

export default Layout;

