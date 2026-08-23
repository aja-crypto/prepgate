// Mobile bottom navigation — Dashboard, AI, Learning, Planner, Profile
import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../ui/Icon';
import NexaPersona from '../NexaPersona';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const TABS = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'AI', icon: 'zap', to: '/mentor', accent: true },
  { label: 'Learning', icon: 'book', to: '/learning-hub' },
  { label: 'Planner', icon: 'planner', to: '/planner' },
];

function ProfileSheet({ onClose }) {
  const { user, logout, isPremium, referralProgress } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const go = (fn) => { fn(); onClose(); };

  const items = [
    { label: 'Free Premium', iconType: 'emoji', icon: '🎁', onClick: () => go(() => navigate('/referral')), right: !isPremium ? `${Math.min(100, Math.round(referralProgress))}%` : '⭐ Active' },
    { label: 'Settings', iconType: 'component', icon: 'settings', onClick: () => go(() => navigate('/settings')) },
    { label: 'Feedback', iconType: 'component', icon: 'feedback', onClick: () => go(() => navigate('/feedback')) },
    { label: 'Help & Support', iconType: 'component', icon: 'help', onClick: () => go(() => navigate('/help')) },
    { label: isDark ? 'Light Mode' : 'Dark Mode', iconType: 'component', icon: isDark ? 'sun' : 'moon', onClick: () => go(toggleTheme) },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="mobile-sheet fixed bottom-0 left-0 right-0 z-[10001] overflow-hidden"
    >
      <div className="max-h-[85vh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* User header */}
        <div className="flex items-center gap-3 px-5 pt-2 pb-4 border-b border-white/[0.06]">
          <NexaPersona user={user} size={52} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-xs text-white/40 truncate">{user?.email}</div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${isPremium ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/25' : 'text-slate-400 bg-white/5 border-white/10'}`}>
            {isPremium ? '⭐ PREMIUM' : 'BASIC'}
          </span>
        </div>

        {/* Items */}
        <div className="py-2">
          {items.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 min-h-[48px]"
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {item.iconType === 'emoji' ? (
                  <span className="text-base leading-none">{item.icon}</span>
                ) : (
                  <Icon name={item.icon} className="w-5 h-5 text-white/50" />
                )}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.right && <span className="text-[11px] font-semibold text-purple-300/80">{item.right}</span>}
            </button>
          ))}
        </div>

        <div className="border-t border-white/[0.06] py-2">
          <button
            onClick={() => go(() => { logout(); navigate('/login'); })}
            className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150 min-h-[48px]"
          >
            <Icon name="close" className="w-5 h-5" />
            <span className="text-left">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = main.scrollTop;
          if (sy > lastScrollY.current + 8 && sy > 60) {
            setVisible(false);
          } else if (sy < lastScrollY.current - 8 || sy < 60) {
            setVisible(true);
          }
          lastScrollY.current = sy;
          ticking = false;
        });
        ticking = true;
      }
    };
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setProfileOpen(false); }, [location.pathname]);

  const isProfileTabActive = profileOpen;
  const activeTab = (tab) => location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');

  return (
    <>
      {/* Profile bottom sheet */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mobile-sheet-backdrop fixed inset-0 z-[10000]"
              onClick={() => setProfileOpen(false)}
            />
            <ProfileSheet onClose={() => setProfileOpen(false)} />
          </>
        )}
      </AnimatePresence>

      <nav
        role="navigation"
        aria-label="Bottom navigation"
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-[9000] transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-2 mb-2 rounded-2xl bg-bg/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-stretch px-1 py-1.5">
            {TABS.map(tab => {
              const isActive = activeTab(tab);
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active text-purple-200' : 'text-text3 hover:text-white'}`}
                >
                  <span className={`mnav-ico flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-500/[0.18] to-cyan-500/[0.10] text-purple-200 shadow-[0_0_14px_rgba(139,92,246,0.25)]'
                      : 'text-text3'
                  }`}>
                    <Icon name={tab.icon} />
                  </span>
                  <span className={`text-[9.5px] font-semibold leading-tight ${isActive ? 'text-purple-200' : 'text-text3'}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.7)]" />
                  )}
                </NavLink>
              );
            })}

            {/* Profile tab */}
            <button
              onClick={() => setProfileOpen(o => !o)}
              aria-label="Open profile menu"
              aria-expanded={isProfileTabActive}
              className={`mobile-nav-item ${isProfileTabActive ? 'mobile-nav-item-active text-purple-200' : 'text-text3 hover:text-white'}`}
            >
              <span className={`mnav-ico flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${
                isProfileTabActive
                  ? 'bg-gradient-to-br from-purple-500/[0.18] to-cyan-500/[0.10] shadow-[0_0_14px_rgba(139,92,246,0.25)]'
                  : 'text-text3'
              }`}>
                <NexaPersona user={user} size={24} />
              </span>
              <span className={`text-[9.5px] font-semibold leading-tight ${isProfileTabActive ? 'text-purple-200' : 'text-text3'}`}>
                Profile
              </span>
              {isProfileTabActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileBottomNav;
