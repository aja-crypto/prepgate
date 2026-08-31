import { useState } from 'react';
import { useBootSequence } from './bootState';
import GateNexaLoader from '../components/GateNexaLoader/GateNexaLoader';
export default function GateNexaBootManager({ children }) {
  const { progress, label, ready, serviceStatus } = useBootSequence();
  const [loaderMounted, setLoaderMounted] = useState(true);
  return (
    <>
      {loaderMounted && (
        <GateNexaLoader
          progress={progress}
          label={label}
          active={!ready}
          onExited={() => setLoaderMounted(false)}
        />
      )}
      <div style={{ visibility: loaderMounted ? 'hidden' : 'visible' }}>
        {typeof children === 'function' ? children({ serviceStatus }) : children}
      </div>
    </>
  );
}
