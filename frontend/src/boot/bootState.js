import { useEffect, useRef, useState } from 'react';
import { BOOT_STAGES, BOOT_SAFETY_TIMEOUT_MS } from './bootTasks';
export function useBootSequence() {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState(BOOT_STAGES[0].label);
  const [ready, setReady] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({});
  const finishedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const totalWeight = BOOT_STAGES.reduce((sum, s) => sum + s.weight, 0);
    let completedWeight = 0;
    const finish = () => {
      if (finishedRef.current || cancelled) return;
      finishedRef.current = true;
      setProgress(100);
      setLabel('READY');
      setReady(true);
    };
    const safetyTimer = setTimeout(finish, BOOT_SAFETY_TIMEOUT_MS);
    (async () => {
      for (const stage of BOOT_STAGES) {
        if (cancelled || finishedRef.current) break;
        setLabel(stage.label);
        const result = await stage.run();
        if (stage.soft && result && result.ok === false) {
          setServiceStatus((prev) => ({ ...prev, [stage.key]: result.reason || 'unavailable' }));
        }
        completedWeight += stage.weight;
        if (!cancelled) setProgress(Math.round((completedWeight / totalWeight) * 100));
      }
      clearTimeout(safetyTimer);
      finish();
    })();
    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, []);
  return { progress, label, ready, serviceStatus };
}
