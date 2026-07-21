import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '../../ui/Icon';

const TABS = [
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'PYQs', icon: 'pyq', to: '/pyq' },
  { label: 'Mock Tests', icon: 'mocks', to: '/mocks' },
  { label: 'AI Mentor', icon: 'zap', to: '/GateNexa-ai' },
  { label: 'Subjects', icon: 'subjects', to: '/subjects' },
];

function MobileBottomNav() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainEl = useRef(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    mainEl.current = main;
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

  return (
    <nav role="navigation" aria-label="Bottom navigation"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-3 mb-3 rounded-2xl bg-bg/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
        <div className="flex items-center justify-around py-1">
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] min-h-[48px] relative"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary'
                    : 'text-text3 hover:text-text2'
                }`}>
                  <Icon name={tab.icon} />
                </div>
                <span className={`text-[9px] font-semibold leading-tight transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-text3'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default MobileBottomNav;
