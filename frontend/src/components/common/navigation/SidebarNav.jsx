// Premium collapsible sidebar navigation with accordion groups
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../ui/Icon';
import { useAuth } from '../../../context/AuthContext';

const NAV_TOP = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'GateNexa AI', icon: 'zap', to: '/mentor', glow: true },
  { label: 'Learning Hub', icon: 'book', to: '/learning-hub' },
  { label: 'NEXA Predictor', icon: 'cpu', to: '/opportunity-predictor' },
];

const NAV_GROUPS = [
  {
    key: 'study',
    label: 'Study',
    icon: 'subjects',
    items: [
      { label: 'Subjects', icon: 'subjects', to: '/subjects' },
      { label: 'Topics', icon: 'topics', to: '/topics' },
      { label: 'Notes', icon: 'notes', to: '/notes' },
      { label: 'Focus', icon: 'productivity', to: '/productivity' },
    ],
  },
  {
    key: 'practice',
    label: 'Practice',
    icon: 'pyq',
    items: [
      { label: 'PYQ', icon: 'pyq', to: '/pyq' },
      { label: 'Mock Tests', icon: 'mocks', to: '/mocks' },
      { label: 'Planner', icon: 'planner', to: '/planner' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: 'analytics',
    items: [
      { label: 'Analytics', icon: 'analytics', to: '/analytics' },
      { label: 'AIR Predictor', icon: 'bar-chart', to: '/air-predictor' },
      { label: 'Mistakes', icon: 'target', to: '/mistakes' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: 'calculator',
    items: [
      { label: 'Calculator', icon: 'calculator', onClick: 'toggleCalc' },
      { label: 'GATE Papers', icon: 'file-text', to: '/gate-papers' },
      { label: 'Gate Vault', icon: 'vault', to: '/gate-vault' },
    ],
  },
];

const NAV_BOTTOM = [
  { label: 'Settings', icon: 'settings', to: '/settings' },
  { label: 'Feedback', icon: 'feedback', to: '/feedback' },
];

function isPathActive(pathname, to) {
  if (!to) return false;
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(to + '/');
}

/* Prefetch NavLink — loads JS chunk on hover/touch for instant navigation */
const PrefetchLink = React.memo(({ to, children, className, onClick }) => {
  const prefetched = useRef(false);
  const handlePrefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    const pageMap = {
      '/dashboard': () => import('../../../pages/DashboardPage'),
      '/subjects': () => import('../../../pages/SubjectsPage'),
      '/topics': () => import('../../../pages/TopicsPage'),
      '/mentor': () => import('../../../pages/GateNexaAIPage'),
      '/notes': () => import('../../../pages/NotesPage'),
      '/pyq': () => import('../../../pages/PYQPage'),
      '/mocks': () => import('../../../pages/MocksPage'),
      '/planner': () => import('../../../pages/StudyPlannerPage'),
      '/analytics': () => import('../../../pages/AnalyticsPage'),
      '/settings': () => import('../../../pages/SettingsPage'),
      '/productivity': () => import('../../../pages/ProductivityPage'),
      '/air-predictor': () => import('../../../pages/AirPredictorPage'),
      '/gate-vault': () => import('../../../pages/GateVaultPage'),
      '/opportunity-predictor': () => import('../../../pages/OpportunityPredictorPage'),
      '/mistakes': () => import('../../../pages/MistakeNotebookPage'),
      '/gate-papers': () => import('../../../pages/GatePapersPage'),
      '/learning-hub': () => import('../../../pages/LearningHubPage'),
      '/feedback': () => import('../../../pages/FeedbackPage'),
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

const itemClass = ({ isActive }) =>
  `sidebar-item group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 my-[2px] cursor-pointer ${
    isActive
      ? 'sidebar-item-active text-white bg-gradient-to-r from-purple-500/[0.14] via-indigo-500/[0.08] to-transparent shadow-[inset_0_0_20px_rgba(139,92,246,0.06)]'
      : 'text-text2 hover:text-white hover:bg-white/[0.045] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
  }`;

function NavLinkRow({ item, onNavClick, onCalcClick }) {
  if (item.onClick === 'toggleCalc') {
    return (
      <button
        onClick={onCalcClick}
        className="sidebar-item group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 my-[2px] cursor-pointer text-text2 hover:text-white hover:bg-white/[0.045] w-full"
      >
        <span className="sidebar-item-icon flex items-center justify-center">
          <Icon name={item.icon} />
        </span>
        <span>{item.label}</span>
      </button>
    );
  }
  return (
    <PrefetchLink
      to={item.to}
      onClick={onNavClick}
      className={({ isActive }) => `${itemClass({ isActive })} ${item.to === '/mentor' ? 'sidebar-item-ai' : ''}`}
    >
      <span className={`sidebar-item-icon flex items-center justify-center transition-transform duration-200 ${item.to === '/mentor' ? 'text-cyan-300' : ''}`}>
        <Icon name={item.icon} />
      </span>
      <span className="truncate">{item.label}</span>
      {item.to === '/mentor' && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 opacity-80 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
      )}
    </PrefetchLink>
  );
}

function SidebarNav({ onNavClick, onCalcClick }) {
  const { user } = useAuth();
  const location = useLocation();

  const defaultOpen = NAV_GROUPS.find(g =>
    g.items.some(i => i.to && isPathActive(location.pathname, i.to))
  )?.key;

  const [openGroup, setOpenGroup] = useState(defaultOpen || null);

  // If route changes to a different group, expand that group (one at a time)
  useEffect(() => {
    const active = NAV_GROUPS.find(g =>
      g.items.some(i => i.to && isPathActive(location.pathname, i.to))
    )?.key;
    if (active && active !== openGroup) setOpenGroup(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex flex-col gap-0.5">
      {/* Top-level — always visible */}
      {NAV_TOP.map(item => (
        <NavLinkRow key={item.to} item={item} onNavClick={onNavClick} onCalcClick={onCalcClick} />
      ))}

      {/* Divider */}
      <div className="sidebar-divider my-2.5" />

      {/* Collapsible groups */}
      {NAV_GROUPS.map(group => {
        const isOpen = openGroup === group.key;
        const groupHasActive = group.items.some(i => i.to && isPathActive(location.pathname, i.to));
        return (
          <div key={group.key} className="sidebar-group">
            <button
              onClick={() => setOpenGroup(isOpen ? null : group.key)}
              aria-expanded={isOpen}
              className={`sidebar-group-btn group flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 cursor-pointer ${
                isOpen || groupHasActive
                  ? 'text-white/90'
                  : 'text-text2 hover:text-white/90 hover:bg-white/[0.03]'
              }`}
            >
              <span className={`flex items-center justify-center transition-colors duration-200 ${groupHasActive ? 'text-purple-300' : 'text-text3 group-hover:text-purple-300'}`}>
                <Icon name={group.icon} />
              </span>
              <span className="flex-1 text-left truncate">{group.label}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex items-center justify-center text-text3"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="relative pl-[13px] ml-[15px] border-l border-white/[0.07] mb-1 mt-0.5 space-y-[1px]">
                    {group.items.map(item => (
                      <div key={item.label} className="relative">
                        <span className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-white/[0.10] border border-white/20" />
                        <NavLinkRow item={item} onNavClick={onNavClick} onCalcClick={onCalcClick} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Divider */}
      <div className="sidebar-divider my-2.5" />

      {/* Bottom links */}
      {NAV_BOTTOM.map(item => (
        <NavLinkRow key={item.to} item={item} onNavClick={onNavClick} onCalcClick={onCalcClick} />
      ))}

      {/* Admin */}
      {(user?.role === 'owner' || user?.role === 'admin') && (
        <NavLink
          to="/admin"
          onClick={onNavClick}
          className={({ isActive }) =>
            `sidebar-item group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 my-[2px] cursor-pointer ${
              isActive
                ? 'text-white bg-gradient-to-r from-purple-500/[0.14] to-transparent'
                : 'text-text2 hover:text-white hover:bg-white/[0.045]'
            }`
          }
        >
          <span className="sidebar-item-icon flex items-center justify-center text-yellow-400/80">
            <Icon name="admin" />
          </span>
          <span>Admin Panel</span>
        </NavLink>
      )}
    </div>
  );
}

export default React.memo(SidebarNav);
