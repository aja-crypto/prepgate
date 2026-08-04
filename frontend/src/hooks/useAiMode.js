import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'gatenexa_ai_mode';

export const MODES = {
  auto: { id: 'auto', label: 'Auto', icon: '✨', description: 'Natural conversation' },
  learning: { id: 'learning', label: 'Learning', icon: '📘', description: 'Structured explanation' },
  coach: { id: 'coach', label: 'Coach', icon: '🎯', description: 'Personalized coaching' },
};

function load() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s && MODES[s]) return s; } catch {}
  return 'auto';
}

export default function useAiMode() {
  const [mode, setModeState] = useState(load);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, mode); } catch {} }, [mode]);

  const setMode = useCallback((m) => { if (MODES[m]) setModeState(m); }, []);

  return { mode, setMode, current: MODES[mode], isAuto: mode === 'auto', isLearning: mode === 'learning', isCoach: mode === 'coach' };
}
