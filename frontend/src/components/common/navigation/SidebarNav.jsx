import React, { useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../ui/Icon';

const NAV = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'GateNexa AI', icon: 'zap', to: '/GateNexa-ai', premium: true },
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

const pageLoaderMap = {
  '/dashboard': () => import('../../../pages/DashboardPage'),
  '/subjects': () => import('../../../pages/SubjectsPage'),
  '/topics': () => import('../../../pages/TopicsPage'),
  '/GateNexa-ai': () => import('../../../pages/GateNexaAIPage'),
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
  '/feedback': () => import('../../../pages/FeedbackPage'),
};

const PrefetchLink = React.memo(({ to, children, className, onClick }) => {
  const prefetched = useRef(false);
  const handlePrefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    const loader = pageLoaderMap[to];
    if (loader) loader().catch(() => {});
  }, [to]);
  return React.createElement(NavLink, { to, className, onClick, onMouseEnter: handlePrefetch, onTouchStart: handlePrefetch, children });
});

const SidebarNav = React.memo(({ onNavClick, onCalcClick }) => {
  const { user } = useAuth();
  return (
    <>
      {NAV.map((item, i) => {
        if (item.section) {
          return (
            <div key={i} className="flex items-center gap-3 px-3 pt-6 pb-2">
              <div className="h-px flex-1 glass-divider" />
              <span className="text-[9px] uppercase tracking-[0.18em] font-semibold shrink-0 section-heading">{item.section}</span>
              <div className="h-px flex-1 glass-divider" />
            </div>
          );
        }
        if (item.onClick === 'toggleCalc') {
          return (
            <button key={item.label} onClick={onCalcClick} className="sidebar-item w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-[13px] transition-all duration-200 my-0.5 text-text2 hover:bg-hover hover:text-text">
              <Icon name={item.icon} className="shrink-0 w-4.5 h-4.5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        }
        if (item.label === 'Gate Vault') {
          return (
            <PrefetchLink key={item.to} to={item.to} onClick={onNavClick} className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 px-3 py-3.5 rounded-xl text-[12px] transition-all duration-200 my-0.5 ${isActive ? 'sidebar-item-active' : 'text-text2 hover:bg-hover hover:text-text'}`
            }>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 w-3.5 h-3.5 gate-vault-icon" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }}>
                <rect x="3" y="8" width="18" height="12" rx="2" className="gv-rect" />
                <path d="M7 8V6a5 5 0 0 1 10 0v2" className="gv-path" />
                <line x1="12" y1="12" x2="12" y2="16" className="gv-line" />
                <path d="M9 12v2a5 5 0 0 0 6 0v-2" className="gv-path2" />
                <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span className="font-medium">{item.label}</span>
            </PrefetchLink>
          );
        }
        return (
          <PrefetchLink key={item.to} to={item.to} onClick={onNavClick} className={({ isActive }) =>
            `sidebar-item flex items-center gap-3 px-3 py-3.5 rounded-xl text-[12px] transition-all duration-200 my-0.5 ${isActive ? 'sidebar-item-active' : 'text-text2 hover:bg-hover hover:text-text'}`
          }>
              <Icon name={item.icon} className="shrink-0 w-4.5 h-4.5 text-current" />
            <span className="font-medium">{item.label}</span>
            {item.premium && (
              <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/20">AI</span>
            )}
          </PrefetchLink>
        );
      })}
      {(user?.role === 'owner' || user?.role === 'admin') && (
        <>
          <div className="flex items-center gap-3 px-3 pt-5 pb-1.5">
            <div className="h-px flex-1 glass-divider" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-text3/60 font-semibold shrink-0">Admin</span>
            <div className="h-px flex-1 glass-divider" />
          </div>
          <NavLink to="/admin" className={({ isActive }) =>
            `sidebar-item flex items-center gap-3 px-3 py-3.5 rounded-xl text-[13px] transition-all my-0.5 ${isActive ? 'sidebar-item-active' : 'text-text2 hover:bg-hover hover:text-text'}`
          }>
            <Icon name="admin" className="shrink-0 w-4.5 h-4.5 text-current" />
            <span className="font-medium">Admin Panel</span>
          </NavLink>
        </>
      )}
    </>
  );
});

export { SidebarNav, NAV, PrefetchLink };
