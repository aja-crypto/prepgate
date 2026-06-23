import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProgress } from './ProgressContext';
import { useAuth } from './AuthContext';
import { progressService } from '../services/api';

const FOCUS_STORAGE_KEY = 'gate2027_focus_session';
const DAILY_FOCUS_KEY = 'gate2027_daily_focus';

const DURATIONS = [
  { label: '25 min', value: 25 * 60 },
  { label: '30 min', value: 30 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '90 min', value: 90 * 60 },
];

const BREAK_DURATION = 5 * 60;

let notifPermission = Notification?.permission || 'default';

function persistState(state) {
  try { localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function loadDailyFocus() {
  try {
    const raw = localStorage.getItem(DAILY_FOCUS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function persistDailyFocus(data) {
  try { localStorage.setItem(DAILY_FOCUS_KEY, JSON.stringify(data)); } catch {}
}

function sendNotification(title, body) {
  if (notifPermission !== 'granted') return;
  try {
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico', tag: 'prepgate-focus' });
      });
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  } catch {}
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const { updateStudyStats, updateProductivity } = useProgress();
  const { user } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState('work');
  const [sessionDuration, setSessionDuration] = useState(25 * 60);
  const [endTime, setEndTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [focusHours, setFocusHours] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef(null);
  const sessionStartRef = useRef(null);
  const dailyFocusRef = useRef(null);

  // Restore state on mount
  useEffect(() => {
    const saved = loadPersistedState();
    if (!saved) return;
    if (saved.endTime && saved.isActive) {
      const remaining = Math.max(0, Math.floor((saved.endTime - Date.now()) / 1000));
      if (remaining > 0) {
        setIsActive(true);
        setIsPaused(saved.isPaused || false);
        setMode(saved.mode || 'work');
        setSessionDuration(saved.sessionDuration || 25 * 60);
        setEndTime(saved.endTime);
        setTimeRemaining(remaining);
        setSessionsCompleted(saved.sessionsCompleted || 0);
        setCurrentSubject(saved.currentSubject || null);
        setIsMinimized(true);
        sessionStartRef.current = saved.sessionStart || Date.now();
      } else if (saved.mode === 'work' && remaining <= 0) {
        // Session expired while away — mark as completed
        const completedSessions = (saved.sessionsCompleted || 0) + 1;
        setSessionsCompleted(completedSessions);
        setMode('break');
        setIsActive(false);
        setTimeRemaining(0);
        clearPersistedState();
      }
    }
    // restore daily focus
    const daily = loadDailyFocus();
    if (daily) {
      const today = new Date().toDateString();
      if (daily.date === today) {
        setFocusHours(daily.hours || 0);
        setSessionsCompleted((s) => Math.max(s, daily.sessions || 0));
        setDailyStreak(daily.streak || 0);
        dailyFocusRef.current = daily;
      }
    }
  }, []);

  // Master tick
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
      persistState({
        isActive: true, isPaused: false, mode, sessionDuration, endTime,
        sessionsCompleted, currentSubject,
        sessionStart: sessionStartRef.current,
      });
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (mode === 'work') {
          // Work session complete
          const elapsed = sessionDuration;
          const focusMins = elapsed / 60;
          setFocusHours((h) => h + focusMins / 60);
          const totalSessions = sessionsCompleted + 1;
          setSessionsCompleted(totalSessions);

          updateProductivity((p) => ({ ...p, pomodoroSessions: (p.pomodoroSessions || 0) + 1 }));
          updateStudyStats((s) => ({
            ...s,
            todayHours: (s.todayHours || 0) + focusMins / 60,
            weekHours: (s.weekHours || 0) + focusMins / 60,
          }));

          sendNotification('Focus Session Complete', `Take a ${BREAK_DURATION / 60}-minute break.`);

          // track daily focus
          const today = new Date().toDateString();
          const df = dailyFocusRef.current || { date: today, hours: 0, sessions: 0, streak: 0 };
          if (df.date !== today) {
            df.date = today; df.hours = 0; df.sessions = 0; df.streak = 0;
          }
          df.hours += focusMins / 60;
          df.sessions = totalSessions;
          const prevDate = new Date();
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = prevDate.toDateString();
          if (df.date === today) {
            const prev = loadDailyFocus();
            if (prev?.date === prevDateStr && prev.hours > 0) {
              df.streak = (prev.streak || 0) + 1;
            } else if (!prev || prev.date !== prevDateStr) {
              df.streak = 1;
            } else {
              df.streak = 1;
            }
          }
          setDailyStreak(df.streak);
          dailyFocusRef.current = df;
          persistDailyFocus(df);

          // Start break
          const breakEnd = Date.now() + BREAK_DURATION * 1000;
          setMode('break');
          setEndTime(breakEnd);
          setTimeRemaining(BREAK_DURATION);
          setIsMinimized(false);
          persistState({
            isActive: true, isPaused: false, mode: 'break', sessionDuration,
            endTime: breakEnd, sessionsCompleted: totalSessions, currentSubject,
            sessionStart: sessionStartRef.current,
          });
        } else {
          // Break complete
          sendNotification('Break Over', 'Ready for another focus session?');
          setIsActive(false);
          setIsPaused(false);
          setMode('work');
          setTimeRemaining(sessionDuration);
          setEndTime(null);
          setIsMinimized(false);
          persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration, endTime: null, sessionsCompleted, currentSubject, sessionStart: null });
        }
      }
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isPaused, endTime, mode, sessionDuration, sessionsCompleted, currentSubject, updateStudyStats, updateProductivity]);

  const requestNotificationPermission = useCallback(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { notifPermission = 'granted'; return; }
    if (Notification.permission === 'denied') return;
    Notification.requestPermission().then((p) => { notifPermission = p; });
  }, []);

  const startSession = useCallback((duration, subject) => {
    const dur = duration || sessionDuration;
    const now = Date.now();
    const end = now + dur * 1000;
    setSessionDuration(dur);
    setEndTime(end);
    setTimeRemaining(dur);
    setIsActive(true);
    setIsPaused(false);
    setMode('work');
    setIsMinimized(false);
    setCurrentSubject(subject || null);
    sessionStartRef.current = now;
    persistState({
      isActive: true, isPaused: false, mode: 'work', sessionDuration: dur,
      endTime: end, sessionsCompleted, currentSubject: subject || null,
      sessionStart: now,
    });
    requestNotificationPermission();
    sendNotification('Focus Session Started', `${dur / 60}-minute focus mode activated.`);
  }, [sessionDuration, sessionsCompleted, currentSubject, requestNotificationPermission]);

  const pauseSession = useCallback(() => {
    setIsPaused(true);
    if (endTime) {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }
    persistState({
      isActive: true, isPaused: true, mode, sessionDuration,
      endTime, sessionsCompleted, currentSubject,
      sessionStart: sessionStartRef.current,
    });
  }, [endTime, mode, sessionDuration, sessionsCompleted, currentSubject]);

  const resumeSession = useCallback(() => {
    if (!isPaused) return;
    const now = Date.now();
    const newEnd = now + timeRemaining * 1000;
    setEndTime(newEnd);
    setIsPaused(false);
    persistState({
      isActive: true, isPaused: false, mode, sessionDuration,
      endTime: newEnd, sessionsCompleted, currentSubject,
      sessionStart: sessionStartRef.current,
    });
  }, [isPaused, timeRemaining, mode, sessionDuration, sessionsCompleted, currentSubject]);

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setMode('work');
    setEndTime(null);
    setTimeRemaining(sessionDuration);
    setIsMinimized(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration, endTime: null, sessionsCompleted, currentSubject: null, sessionStart: null });
  }, [sessionDuration, sessionsCompleted, currentSubject]);

  const toggleMinimized = useCallback(() => setIsMinimized((m) => !m), []);

  const selectDuration = useCallback((dur) => {
    if (!isActive) {
      setSessionDuration(dur);
      setTimeRemaining(dur);
    }
  }, [isActive]);

  const getTodayFocus = useCallback(() => {
    const df = dailyFocusRef.current || loadDailyFocus();
    if (!df) return { hours: 0, sessions: 0, streak: 0 };
    const today = new Date().toDateString();
    if (df.date !== today) return { hours: 0, sessions: 0, streak: df.date && df.hours > 0 ? 0 : 0 };
    return df;
  }, []);

  const progress = sessionDuration > 0
    ? Math.max(0, Math.min(100, ((sessionDuration - timeRemaining) / sessionDuration) * 100))
    : 0;

  return (
    <FocusContext.Provider value={{
      isActive, isPaused, mode, sessionDuration, endTime, timeRemaining,
      sessionsCompleted, focusHours, dailyStreak, isMinimized, currentSubject, setCurrentSubject,
      progress, isExpanded, setIsExpanded, DURATIONS, BREAK_DURATION,
      startSession, pauseSession, resumeSession, stopSession,
      toggleMinimized, selectDuration, getTodayFocus,
      requestNotificationPermission, formatTime,
    }}>
      {children}
    </FocusContext.Provider>
  );
}

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
};
