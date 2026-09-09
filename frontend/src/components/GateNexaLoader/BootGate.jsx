import { useState, useEffect, useRef } from 'react';
import GateNexaLoader from './GateNexaLoader';
import { BOOT_TASKS, BOOT_SAFETY_MS, getTotalWeight, isBootComplete, markBootComplete } from './bootCoordinator';
import { useAuth } from '../../context/AuthContext';

function runWithConcurrency(tasks, concurrency, onDone) {
  return new Promise((resolve) => {
    if (!tasks.length) { resolve(); return; }
    let idx = 0, active = 0, completed = 0;
    const total = tasks.length;
    const next = () => {
      while (active < concurrency && idx < total) {
        const task = tasks[idx++];
        active++;
        const p = task.importer ? task.importer().catch(() => null) : Promise.resolve();
        p.finally(() => { active--; completed++; onDone(task); if (completed === total) resolve(); else next(); });
      }
    };
    next();
  });
}

export default function BootGate({ children }) {
  const { loading: authLoading } = useAuth();
  const [bootDone, setBootDone] = useState(() => isBootComplete());
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing your workspace');
  const startedRef = useRef(false);
  const authLoadingRef = useRef(authLoading);
  useEffect(() => { authLoadingRef.current = authLoading; }, [authLoading]);

  useEffect(() => {
    if (bootDone) return;
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const totalWeight = getTotalWeight();
    let completedWeight = 0;
    const onTaskDone = (task) => {
      if (cancelled) return;
      completedWeight += task.weight;
      setProgress(Math.min(99, Math.round((completedWeight / totalWeight) * 100)));
      setStatus(task.label);
    };
    const criticalImports = BOOT_TASKS.filter(t => t.critical && t.importer);
    const optionalImports = BOOT_TASKS.filter(t => !t.critical && t.importer);
    const authTask = BOOT_TASKS.find(t => t.id === 'auth');

    const safetyTimer = setTimeout(() => {
      if (!cancelled) { markBootComplete(); setBootDone(true); }
    }, BOOT_SAFETY_MS);

    const run = async () => {
      const authWait = new Promise((res) => {
        if (!authLoadingRef.current) { res(); return; }
        const iv = setInterval(() => { if (!authLoadingRef.current) { clearInterval(iv); res(); } }, 100);
        setTimeout(() => { clearInterval(iv); res(); }, 8000);
      });
      await authWait;
      if (cancelled) return;
      onTaskDone(authTask);
      await runWithConcurrency(criticalImports, 2, onTaskDone);
      if (cancelled) return;
      clearTimeout(safetyTimer);
      setProgress(Math.min(100, Math.round((completedWeight / totalWeight) * 100)));
      setStatus('Finishing your workspace');
      setBootDone(true);
      runWithConcurrency(optionalImports, 3, onTaskDone).then(() => {
        if (cancelled) return;
        markBootComplete();
      });
    };
    run();
    return () => { cancelled = true; clearTimeout(safetyTimer); };
  }, [bootDone]);

  if (!bootDone) return <GateNexaLoader progress={progress} status={status} />;
  return children;
}
