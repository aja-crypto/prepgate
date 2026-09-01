import { useState, useEffect } from 'react';
import { useBootSequence } from './bootState';
import GateNexaLoader from '../components/GateNexaLoader/GateNexaLoader';
export default function GateNexaBootManager({ children }) {
  const { progress, label, ready, serviceStatus } = useBootSequence();
  const [loaderMounted, setLoaderMounted] = useState(true);
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setLoaderMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [ready]);
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
