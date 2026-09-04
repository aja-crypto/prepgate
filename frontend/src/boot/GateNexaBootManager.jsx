import { useState, useEffect } from 'react';
import { useBootSequence } from './bootState';
import GateNexaLoader from '../components/GateNexaLoader/GateNexaLoader';
export default function GateNexaBootManager({ children }) {
  const { progress, label, ready, serviceStatus } = useBootSequence();
  const [loaderMounted, setLoaderMounted] = useState(() => {
    try {
      const isHome = typeof window !== 'undefined' && window.location.pathname === '/';
      const hasAuth = typeof window !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('gatenexa_auth') || localStorage.getItem('gatenexa_token'));
      if (isHome && !hasAuth) return false;
    } catch {}
    return true;
  });
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setLoaderMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [ready]);
  useEffect(() => {
    if (!loaderMounted) {
      window.dispatchEvent(new Event('gatenexa:ready'));
    }
  }, [loaderMounted]);

  if (!loaderMounted) {
    return <>{typeof children === 'function' ? children({ serviceStatus }) : children}</>;
  }
  return (
    <>
      {typeof children === 'function' ? children({ serviceStatus }) : children}
      {loaderMounted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: ready ? 'none' : 'auto',
            opacity: ready ? 0 : 1,
            transition: 'opacity 380ms ease',
          }}
          aria-hidden={ready}
        >
          <GateNexaLoader
            progress={progress}
            label={label}
            active={!ready}
            onExited={() => {}}
          />
        </div>
      )}
    </>
  );
}
