import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useProgress } from './ProgressContext';
import { useAuthData } from './AuthContext';

const FOCUS_STORAGE_KEY = 'gatenexa_focus_session';
const DAILY_FOCUS_KEY = 'gatenexa_daily_focus';
const FOCUS_HISTORY_KEY = 'gatenexa_focus_history';
const XP_STORAGE_KEY = 'gatenexa_focus_xp';
const ACHIEVEMENTS_KEY = 'gatenexa_focus_achievements';
const SESSION_NOTES_KEY = 'gatenexa_session_notes';

const DURATIONS = [
  { label: '15 min', value: 15 * 60 },
  { label: '25 min', value: 25 * 60 },
  { label: '30 min', value: 30 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '90 min', value: 90 * 60 },
];

const BREAK_DURATION = 5 * 60;

const XP_TABLE = [
  { duration: 15, xp: 15 }, { duration: 25, xp: 25 }, { duration: 30, xp: 30 },
  { duration: 45, xp: 40 }, { duration: 60, xp: 55 }, { duration: 90, xp: 80 },
];

export const ACHIEVEMENT_DEFS = [
  { id: 'first_session', name: 'First Step', icon: '🎯', desc: 'Complete your first focus session', check: (s) => s.totalSessions >= 1 },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', desc: 'Study 3 days in a row', check: (s) => s.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚔️', desc: 'Study 7 days in a row', check: (s) => s.streak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', icon: '💎', desc: '30-day streak', check: (s) => s.streak >= 30 },
  { id: 'sessions_10', name: 'Focus Starter', icon: '⚡', desc: 'Complete 10 focus sessions', check: (s) => s.totalSessions >= 10 },
  { id: 'sessions_50', name: 'Focus Master', icon: '🏅', desc: 'Complete 50 focus sessions', check: (s) => s.totalSessions >= 50 },
  { id: 'sessions_100', name: 'Zen Master', icon: '🧘', desc: 'Complete 100 focus sessions', check: (s) => s.totalSessions >= 100 },
  { id: 'hours_10', name: '10 Hours Club', icon: '📚', desc: 'Study 10 total hours', check: (s) => s.totalHours >= 10 },
  { id: 'hours_50', name: '50 Hours Legend', icon: '🏆', desc: 'Study 50 total hours', check: (s) => s.totalHours >= 50 },
  { id: 'hours_100', name: '100 Hours Elite', icon: '👑', desc: 'Study 100 total hours', check: (s) => s.totalHours >= 100 },
  { id: 'deep_focus', name: 'Deep Focus', icon: '🧠', desc: 'Complete a 90-minute session', check: (s) => s.longestSession >= 90 },
  { id: 'no_pause', name: 'Unbreakable', icon: '🛡️', desc: 'Complete a session with 0 pauses', check: (s) => s.hasZeroPauseSession },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', desc: 'Study before 7 AM', check: (s) => s.earlyBird },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', desc: 'Study after 11 PM', check: (s) => s.nightOwl },
  { id: 'xp_100', name: 'XP Hunter', icon: '⚡', desc: 'Earn 100 XP', check: (s) => s.totalXp >= 100 },
  { id: 'xp_500', name: 'XP Legend', icon: '🌟', desc: 'Earn 500 XP', check: (s) => s.totalXp >= 500 },
  { id: 'xp_1000', name: 'XP Master', icon: '💫', desc: 'Earn 1000 XP', check: (s) => s.totalXp >= 1000 },
];

const MOTIVATION_QUOTES = [
  'Every revision rewrites your future.',
  'Consistency creates ranks.',
  "Today's effort becomes tomorrow's AIR.",
  'The pain of discipline is nothing compared to the pain of regret.',
  'Small daily improvements lead to stunning results.',
  'Focus is the bridge between goals and accomplishment.',
  'Your future self will thank you for studying today.',
  'Discipline is choosing between what you want now and what you want most.',
  'The secret of getting ahead is getting started.',
  'Study like your dream depends on it — because it does.',
];

let notifPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

function persistState(state) {
  try { localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(state)); } catch {}
}
function clearPersistedState() {
  try { localStorage.removeItem(FOCUS_STORAGE_KEY); } catch {}
}
function loadPersistedState() {
  try { const raw = localStorage.getItem(FOCUS_STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function loadDailyFocus() {
  try { const raw = localStorage.getItem(DAILY_FOCUS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function persistDailyFocus(data) {
  try { localStorage.setItem(DAILY_FOCUS_KEY, JSON.stringify(data)); } catch {}
}
function loadFocusHistory() {
  try { const raw = localStorage.getItem(FOCUS_HISTORY_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function persistFocusHistory(history) {
  try { localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(history.slice(-500))); } catch {}
}
function loadXpData() {
  try { const raw = localStorage.getItem(XP_STORAGE_KEY); return raw ? JSON.parse(raw) : { xp: 0, level: 1, totalXp: 0 }; } catch { return { xp: 0, level: 1, totalXp: 0 }; }
}
function persistXp(data) {
  try { localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function loadAchievements() {
  try { const raw = localStorage.getItem(ACHIEVEMENTS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function persistAchievements(ids) {
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(ids)); } catch {}
}
function loadSessionNotes() {
  try { const raw = localStorage.getItem(SESSION_NOTES_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function persistSessionNotes(notes) {
  try { localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(notes)); } catch {}
}
function sendNotification(title, body) {
  if (notifPermission !== 'granted') return;
  try {
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico', tag: 'gatenexa-focus' });
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
function xpForLevel(level) {
  return 100 + (level - 1) * 50;
}

const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const { updateStudyStats, updateProductivity } = useProgress();
  const { user } = useAuthData();

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
  const [history, setHistory] = useState(() => loadFocusHistory());
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [sessionNotes, setSessionNotes] = useState(() => loadSessionNotes());

  // Keep ref in sync for useEffect dependency fix
  useEffect(() => { historyRef.current = history; }, [history]);

  // XP system
  const [xpData, setXpData] = useState(() => loadXpData());
  const [earnedAchievements, setEarnedAchievements] = useState(() => loadAchievements());
  const [newAchievement, setNewAchievement] = useState(null);

  // Distraction tracking
  const [distractions, setDistractions] = useState({ tabSwitches: 0, pauses: 0, focusLostSec: 0, sessionStart: null });
  const distractionRef = useRef({ tabSwitches: 0, pauses: 0, focusLostSec: 0, focusLostStart: null });

  const intervalRef = useRef(null);
  const sessionStartRef = useRef(null);
  const dailyFocusRef = useRef(null);
  const historyRef = useRef(history);

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
        const completedSessions = (saved.sessionsCompleted || 0) + 1;
        setSessionsCompleted(completedSessions);
        setMode('break');
        setIsActive(false);
        setTimeRemaining(0);
        clearPersistedState();
      }
    }
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

  const isActiveRef = useRef(isActive);
  const isPausedRef = useRef(isPaused);
  const endTimeRef = useRef(endTime);
  const modeRef = useRef(mode);
  const sessionDurationRef = useRef(sessionDuration);
  const sessionsCompletedRef = useRef(sessionsCompleted);
  const currentSubjectRef = useRef(currentSubject);

  isActiveRef.current = isActive;
  isPausedRef.current = isPaused;
  endTimeRef.current = endTime;
  modeRef.current = mode;
  sessionDurationRef.current = sessionDuration;
  sessionsCompletedRef.current = sessionsCompleted;
  currentSubjectRef.current = currentSubject;

  // Award XP and check achievements
  const awardXp = useCallback((durationSec) => {
    const mins = durationSec / 60;
    const match = [...XP_TABLE].reverse().find(t => mins >= t.duration);
    const xpEarned = match ? match.xp : Math.round(mins * 0.8);

    setXpData((prev) => {
      let newXp = prev.xp + xpEarned;
      let newLevel = prev.level;
      let required = xpForLevel(newLevel);
      while (newXp >= required) {
        newXp -= required;
        newLevel++;
        required = xpForLevel(newLevel);
      }
      const next = { xp: newXp, level: newLevel, totalXp: prev.totalXp + xpEarned };
      persistXp(next);
      return next;
    });
    return xpEarned;
  }, []);

  const checkAchievements = useCallback((stats) => {
    const newOnes = [];
    ACHIEVEMENT_DEFS.forEach((def) => {
      if (!earnedAchievements.includes(def.id) && def.check(stats)) {
        newOnes.push(def);
      }
    });
    if (newOnes.length > 0) {
      const updated = [...earnedAchievements, ...newOnes.map(a => a.id)];
      setEarnedAchievements(updated);
      persistAchievements(updated);
      setNewAchievement(newOnes[0]);
      setTimeout(() => setNewAchievement(null), 5000);
    }
  }, [earnedAchievements]);

  // Master tick
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      const end = endTimeRef.current;
      const rem = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTimeRemaining(rem);
      persistState({
        isActive: true, isPaused: false, mode: modeRef.current, sessionDuration: sessionDurationRef.current, endTime: end,
        sessionsCompleted: sessionsCompletedRef.current, currentSubject: currentSubjectRef.current,
        sessionStart: sessionStartRef.current,
      });
      if (rem <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (modeRef.current === 'work') {
          const dur = sessionDurationRef.current;
          const focusMins = dur / 60;
          setFocusHours((h) => h + focusMins / 60);
          const totalSessions = sessionsCompletedRef.current + 1;
          setSessionsCompleted(totalSessions);

          updateProductivity((p) => ({ ...p, pomodoroSessions: (p.pomodoroSessions || 0) + 1 }));
          updateStudyStats((s) => ({
            ...s,
            todayHours: (s.todayHours || 0) + focusMins / 60,
            weekHours: (s.weekHours || 0) + focusMins / 60,
          }));

          sendNotification('Focus Session Complete', `Take a ${BREAK_DURATION / 60}-minute break.`);

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
            } else {
              df.streak = 1;
            }
          }
          setDailyStreak(df.streak);
          dailyFocusRef.current = df;
          persistDailyFocus(df);

          const xpEarned = awardXp(dur);

          const historyEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            duration: dur,
            subject: currentSubjectRef.current || 'General',
            type: 'pomodoro',
            sessionsAtEnd: totalSessions,
            xpEarned,
            distractions: { ...distractionRef.current },
          };
          setHistory((prev) => {
            const next = [...prev, historyEntry];
            persistFocusHistory(next);
            return next;
          });

          const hour = new Date().getHours();
          const totalH = loadXpData().totalXp + xpEarned;
          const allHistory = [...(historyRef.current || []), historyEntry];
          const totalSessionsAll = totalSessions;
          const longestSession = Math.max(...allHistory.map(h => h.duration || 0), 0) / 60;
          const totalHoursAll = allHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / 3600;
          const hasZeroPause = distractionRef.current.pauses === 0;
          const earlyBird = hour < 7;
          const nightOwl = hour >= 23;

          checkAchievements({
            totalSessions: totalSessionsAll,
            streak: df.streak,
            totalHours: totalHoursAll,
            longestSession,
            hasZeroPauseSession: hasZeroPause,
            earlyBird, nightOwl,
            totalXp: totalH,
          });

          distractionRef.current = { tabSwitches: 0, pauses: 0, focusLostSec: 0, focusLostStart: null };
          setDistractions({ tabSwitches: 0, pauses: 0, focusLostSec: 0, sessionStart: null });

          const breakEnd = Date.now() + BREAK_DURATION * 1000;
          setMode('break');
          setEndTime(breakEnd);
          setTimeRemaining(BREAK_DURATION);
          setIsMinimized(false);

          // Show completion dialog
          setCompletedSession({
            id: Date.now(),
            date: new Date().toISOString(),
            startTime: sessionStartRef.current ? new Date(sessionStartRef.current).toISOString() : new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: dur,
            subject: currentSubjectRef.current || 'General',
            xpEarned,
            distractions: { ...distractionRef.current },
          });
          setShowCompletion(true);

          persistState({
            isActive: true, isPaused: false, mode: 'break', sessionDuration: dur,
            endTime: breakEnd, sessionsCompleted: totalSessions, currentSubject: currentSubjectRef.current,
            sessionStart: sessionStartRef.current,
          });
        } else {
          sendNotification('Break Over', 'Ready for another focus session?');
          setIsActive(false);
          setIsPaused(false);
          setMode('work');
          setTimeRemaining(sessionDurationRef.current);
          setEndTime(null);
          setIsMinimized(false);
          persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration: sessionDurationRef.current, endTime: null, sessionsCompleted: sessionsCompletedRef.current, currentSubject: currentSubjectRef.current, sessionStart: null });
        }
      }
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isPaused, updateStudyStats, updateProductivity, awardXp, checkAchievements]);

  // Visibility API
  useEffect(() => {
    if (!isActive || isPaused) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && endTimeRef.current) {
        const rem = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
        setTimeRemaining(rem);
        if (distractionRef.current.focusLostStart) {
          const lost = Math.floor((Date.now() - distractionRef.current.focusLostStart) / 1000);
          distractionRef.current.focusLostSec += lost;
          distractionRef.current.focusLostStart = null;
          setDistractions(d => ({ ...d, focusLostSec: distractionRef.current.focusLostSec }));
        }
        if (rem <= 0) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          if (modeRef.current === 'work') {
            const dur = sessionDurationRef.current;
            const focusMins = dur / 60;
            setFocusHours((h) => h + focusMins / 60);
            const totalSessions = sessionsCompletedRef.current + 1;
            setSessionsCompleted(totalSessions);
            updateProductivity((p) => ({ ...p, pomodoroSessions: (p.pomodoroSessions || 0) + 1 }));
            updateStudyStats((s) => ({
              ...s,
              todayHours: (s.todayHours || 0) + focusMins / 60,
              weekHours: (s.weekHours || 0) + focusMins / 60,
            }));
            sendNotification('Focus Session Complete', `Take a ${BREAK_DURATION / 60}-minute break.`);

            const today = new Date().toDateString();
            const df = dailyFocusRef.current || { date: today, hours: 0, sessions: 0, streak: 0 };
            if (df.date !== today) { df.date = today; df.hours = 0; df.sessions = 0; df.streak = 0; }
            df.hours += focusMins / 60;
            df.sessions = totalSessions;
            const prevDate = new Date(); prevDate.setDate(prevDate.getDate() - 1);
            const prev = loadDailyFocus();
            if (prev?.date === prevDate.toDateString() && prev.hours > 0) df.streak = (prev.streak || 0) + 1;
            else df.streak = 1;
            setDailyStreak(df.streak);
            dailyFocusRef.current = df;
            persistDailyFocus(df);

            const xpEarned = awardXp(dur);
            const historyEntry = {
              id: Date.now(), date: new Date().toISOString(), duration: dur,
              subject: currentSubjectRef.current || 'General', type: 'pomodoro',
              sessionsAtEnd: totalSessions, xpEarned,
              distractions: { ...distractionRef.current },
            };
            setHistory((prev) => { const next = [...prev, historyEntry]; persistFocusHistory(next); return next; });

            const hour = new Date().getHours();
            const totalH = loadXpData().totalXp + xpEarned;
            const allHistory = [...(historyRef.current || []), historyEntry];
            const longestSession = Math.max(...allHistory.map(h => h.duration || 0), 0) / 60;
            const totalHoursAll = allHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / 3600;

            checkAchievements({
              totalSessions, streak: df.streak, totalHours: totalHoursAll,
              longestSession, hasZeroPauseSession: distractionRef.current.pauses === 0,
              earlyBird: hour < 7, nightOwl: hour >= 23, totalXp: totalH,
            });

            distractionRef.current = { tabSwitches: 0, pauses: 0, focusLostSec: 0, focusLostStart: null };
            setDistractions({ tabSwitches: 0, pauses: 0, focusLostSec: 0, sessionStart: null });

            const breakEnd = Date.now() + BREAK_DURATION * 1000;
            setMode('break');
            setEndTime(breakEnd);
            setTimeRemaining(BREAK_DURATION);
            persistState({
              isActive: true, isPaused: false, mode: 'break', sessionDuration: dur,
              endTime: breakEnd, sessionsCompleted: totalSessions, currentSubject: currentSubjectRef.current,
              sessionStart: sessionStartRef.current,
            });
          } else {
            sendNotification('Break Over', 'Ready for another focus session?');
            setIsActive(false);
            setMode('work');
            setTimeRemaining(sessionDurationRef.current);
            setEndTime(null);
            persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration: sessionDurationRef.current, endTime: null, sessionsCompleted: sessionsCompletedRef.current, currentSubject: currentSubjectRef.current, sessionStart: null });
          }
        }
      } else if (document.visibilityState === 'hidden') {
        distractionRef.current.focusLostStart = Date.now();
        distractionRef.current.tabSwitches++;
        setDistractions(d => ({ ...d, tabSwitches: distractionRef.current.tabSwitches }));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, isPaused, updateStudyStats, updateProductivity]);

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
    distractionRef.current = { tabSwitches: 0, pauses: 0, focusLostSec: 0, focusLostStart: null };
    setDistractions({ tabSwitches: 0, pauses: 0, focusLostSec: 0, sessionStart: now });
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
    distractionRef.current.pauses++;
    setDistractions(d => ({ ...d, pauses: distractionRef.current.pauses }));
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
    distractionRef.current = { tabSwitches: 0, pauses: 0, focusLostSec: 0, focusLostStart: null };
    setDistractions({ tabSwitches: 0, pauses: 0, focusLostSec: 0, sessionStart: null });
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration, endTime: null, sessionsCompleted, currentSubject: null, sessionStart: null });
  }, [sessionDuration, sessionsCompleted, currentSubject]);

  const skipBreak = useCallback(() => {
    if (mode !== 'break' || !isActive) return;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsActive(false);
    setIsPaused(false);
    setMode('work');
    setTimeRemaining(sessionDurationRef.current);
    setEndTime(null);
    setIsMinimized(false);
    setShowCompletion(false);
    setCompletedSession(null);
    persistState({ isActive: false, isPaused: false, mode: 'work', sessionDuration: sessionDurationRef.current, endTime: null, sessionsCompleted: sessionsCompletedRef.current, currentSubject: currentSubjectRef.current, sessionStart: null });
  }, [mode, isActive]);

  const dismissCompletion = useCallback(() => {
    setShowCompletion(false);
    setCompletedSession(null);
  }, []);

  const saveSessionNotes = useCallback((sessionId, notes, tasks) => {
    const allNotes = loadSessionNotes();
    allNotes[sessionId] = { notes, tasks, savedAt: new Date().toISOString() };
    persistSessionNotes(allNotes);
    setSessionNotes(allNotes);
    // Also update the history entry with notes/tasks
    setHistory(prev => {
      const updated = prev.map(h => h.id === sessionId ? { ...h, notes, tasks } : h);
      persistFocusHistory(updated);
      return updated;
    });
  }, []);

  const getYesterdaySummary = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const yesterdayHistory = history.filter(h => {
      const hDate = new Date(h.date);
      return hDate.toISOString().split('T')[0] === yesterdayKey;
    });
    const totalMinutes = yesterdayHistory.reduce((s, h) => s + (h.duration || 0), 0) / 60;
    const subjects = [...new Set(yesterdayHistory.map(h => h.subject))];
    const tasks = yesterdayHistory.flatMap(h => h.tasks || []);
    return {
      date: yesterdayKey,
      hours: Math.floor(totalMinutes / 60),
      minutes: Math.round(totalMinutes % 60),
      sessions: yesterdayHistory.length,
      subjects,
      tasks,
    };
  }, [history]);

  const getDailyHistory = useCallback(() => {
    const dailyMap = {};
    history.forEach(h => {
      const hDate = new Date(h.date);
      const key = hDate.toISOString().split('T')[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, totalMinutes: 0, sessions: 0, subjects: new Set() };
      }
      dailyMap[key].totalMinutes += (h.duration || 0) / 60;
      dailyMap[key].sessions += 1;
      dailyMap[key].subjects.add(h.subject || 'General');
    });
    return Object.values(dailyMap)
      .map(d => ({ ...d, subjects: [...d.subjects] }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history]);

  const getWeeklyMonthlyTotals = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    let weeklyMinutes = 0, monthlyMinutes = 0;
    history.forEach(h => {
      const hDate = new Date(h.date);
      const mins = (h.duration || 0) / 60;
      if (hDate >= weekAgo) weeklyMinutes += mins;
      if (hDate >= monthAgo) monthlyMinutes += mins;
    });
    return {
      weekly: { hours: Math.floor(weeklyMinutes / 60), minutes: Math.round(weeklyMinutes % 60) },
      monthly: { hours: Math.floor(monthlyMinutes / 60), minutes: Math.round(monthlyMinutes % 60) },
    };
  }, [history]);

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
    if (df.date !== today) return { hours: 0, sessions: 0, streak: 0 };
    return df;
  }, []);

  const getDailyReview = useCallback(() => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const todayHistory = history.filter(h => {
      const hDate = new Date(h.date);
      return hDate.toISOString().split('T')[0] === todayKey;
    });
    const totalMinutes = todayHistory.reduce((s, h) => s + (h.duration || 0), 0) / 60;
    const subjects = [...new Set(todayHistory.map(h => h.subject))];
    const tasks = todayHistory.flatMap(h => h.tasks || []);
    const totalTabs = todayHistory.reduce((s, h) => s + (h.distractions?.tabSwitches || 0), 0);
    const totalPauses = todayHistory.reduce((s, h) => s + (h.distractions?.pauses || 0), 0);
    const focusScore = todayHistory.length > 0
      ? Math.max(0, Math.min(100, Math.round(100 - totalTabs * 3 - totalPauses * 5 + todayHistory.length * 8)))
      : 0;
    const weakSubject = subjects.length > 0 ? subjects[subjects.length - 1] : null;

    // Generate tomorrow's recommendations
    const recommendations = [];
    if (subjects.length > 0) {
      const lastSubject = subjects[subjects.length - 1];
      recommendations.push(`Continue ${lastSubject}`);
    }
    if (tasks.length > 0) {
      recommendations.push(`Revise ${tasks[0]}`);
    }
    if (subjects.includes('DBMS') || subjects.includes('Computer Networks')) {
      recommendations.push('Solve 20 PYQs');
    }
    if (recommendations.length === 0) {
      recommendations.push('Start with a subject of your choice');
    }

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: Math.round(totalMinutes % 60),
      sessions: todayHistory.length,
      subjects,
      tasks,
      focusScore,
      tabSwitches: totalTabs,
      pauses: totalPauses,
      weakSubject,
      quote: MOTIVATION_QUOTES[today.getDate() % MOTIVATION_QUOTES.length],
      recommendations,
    };
  }, [history]);

  const progress = sessionDuration > 0
    ? Math.max(0, Math.min(100, ((sessionDuration - timeRemaining) / sessionDuration) * 100))
    : 0;

  const value = useMemo(() => ({
    isActive, isPaused, mode, sessionDuration, endTime,
    sessionsCompleted, focusHours, dailyStreak, isMinimized, currentSubject, setCurrentSubject,
    isExpanded, setIsExpanded, DURATIONS, BREAK_DURATION,
    startSession, pauseSession, resumeSession, stopSession, skipBreak,
    toggleMinimized, selectDuration, getTodayFocus, history,
    requestNotificationPermission, formatTime,
    xp: xpData.xp, xpLevel: xpData.level, totalXp: xpData.totalXp,
    earnedAchievements, newAchievement, distractions,
    getDailyReview, MOTIVATION_QUOTES,
    showCompletion, completedSession, dismissCompletion, saveSessionNotes,
    getYesterdaySummary, getDailyHistory, getWeeklyMonthlyTotals, sessionNotes,
  }), [isActive, isPaused, mode, sessionDuration, endTime, sessionsCompleted, focusHours, dailyStreak, isMinimized, currentSubject, isExpanded, history, xpData, earnedAchievements, newAchievement, distractions, getDailyReview, showCompletion, completedSession, sessionNotes]);

  const timerValue = useMemo(() => ({ timeRemaining, progress, formatTime }),
    [timeRemaining, progress, formatTime]);

  return (
    <FocusTimerContext.Provider value={timerValue}>
      <FocusContext.Provider value={value}>
        {children}
      </FocusContext.Provider>
    </FocusTimerContext.Provider>
  );
}

const FocusTimerContext = createContext(null);

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
};

export const useFocusTimer = () => {
  const ctx = useContext(FocusTimerContext);
  return ctx || { timeRemaining: 0, progress: 0, formatTime: (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` };
};
