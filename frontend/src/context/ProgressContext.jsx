// src/context/ProgressContext.jsx – Central progress store with MongoDB hybrid sync
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getEmptyProgressData, mergeProgressData, isEmptyProgress, BADGE_DEFINITIONS,
} from '../data/emptyState';
import { getDefaultGateFeatures } from '../data/defaults';
import { checkNewBadges } from '../utils/gateUtils';
import { progressService, pyqService } from '../services/api';
import { silentCatch, warn } from '../utils/errorHandler';
import { pullFromServer, pushToServer, checkMongoAvailable } from '../services/syncService';
import { mergePyqLists } from '../utils/pyqMapper';
import toast from 'react-hot-toast';

const ProgressContext = createContext(null);
const storageKey = (userId) => `gate2027_progress_${userId || 'guest'}`;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 2000;

function getInitialData() {
  return getEmptyProgressData();
}

function loadFromStorage(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return getInitialData();
    return mergeProgressData(JSON.parse(raw));
  } catch {
    return getInitialData();
  }
}

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || 'guest';
  const [data, setData] = useState(() => loadFromStorage(userId));
  const [backupStatus, setBackupStatus] = useState('saved');
  const [cloudBackupStatus, setCloudBackupStatus] = useState('idle');
  const [mongoAvailable, setMongoAvailable] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState(data.lastSaved);
  const [lastCloudBackupAt, setLastCloudBackupAt] = useState(null);
  const [isNewUser, setIsNewUser] = useState(() => isEmptyProgress(data));
  const saveTimer = useRef(null);
  const cloudTimer = useRef(null);
  const pushTimer = useRef(null);
  const lastPulledUserId = useRef(null);
  const syncInProgress = useRef(false);
  const wakeSyncTimer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load local storage on user change — prefer server on login
  useEffect(() => {
    if (!user || userId === 'guest') {
      setData(getEmptyProgressData());
      setIsNewUser(true);
      return;
    }
    const loaded = loadFromStorage(userId, user);
    setData(loaded);
    setLastBackupAt(loaded.lastSaved);
    setIsNewUser(isEmptyProgress(loaded));
    if (userId === 'guest') lastPulledUserId.current = null;
  }, [userId, user]);

  // Pull from MongoDB on login — cloud is source of truth for cross-device sync
  useEffect(() => {
    if (!user || userId === 'guest') return;
    if (lastPulledUserId.current === userId) return;
    lastPulledUserId.current = userId;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    (async () => {
      const mongo = await checkMongoAvailable();
      setMongoAvailable(mongo);
      const local = loadFromStorage(userId, user);
      const { data: merged, updatedAt, mongoAvailable: ma, fromCloud } = await pullFromServer(local, user);

      if (controller.signal.aborted) return;

      setData(merged);
      setLastBackupAt(merged.lastSaved);
      setIsNewUser(isEmptyProgress(merged));
      if (updatedAt) setLastCloudBackupAt(updatedAt);
      setMongoAvailable(ma ?? mongo);
      localStorage.setItem(storageKey(userId), JSON.stringify(merged));

      if (fromCloud && ma) {
        toast.success('Progress restored from cloud', { duration: 2000 });
      } else if (isEmptyProgress(merged)) {
        await pushToServer(merged);
      }

      if (ma ?? mongo) {
        try {
          const pyqRes = await pyqService.getAll({ limit: 500 });
          const apiPyqs = pyqRes.data?.data || [];
          if (apiPyqs.length) {
            const withPyqs = { ...merged, pyqs: mergePyqLists(apiPyqs, merged.pyqs) };
            setData(withPyqs);
            localStorage.setItem(storageKey(userId), JSON.stringify(withPyqs));
          }
        } catch { /* PYQ API optional */ }
      }
    })();

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [user, userId]);

  // Auto-save to localStorage on every change
  useEffect(() => {
    if (userId === 'guest') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setBackupStatus('saving');
    saveTimer.current = setTimeout(() => {
      try {
        const now = new Date().toISOString();
        const toSave = { ...data, lastSaved: now };
        localStorage.setItem(storageKey(userId), JSON.stringify(toSave));
        setLastBackupAt(now);
        setBackupStatus('saved');
        setIsNewUser(isEmptyProgress(toSave));
      } catch {
        setBackupStatus('error');
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [data, userId]);

  const syncToCloud = useCallback(async () => {
    if (!user || userId === 'guest') return;
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setCloudBackupStatus('syncing');
    try {
      const result = await pushToServer(dataRef.current);
      if (result.error) {
        setCloudBackupStatus('offline');
      } else {
        if (result.data) setData(result.data);
        setLastCloudBackupAt(result.data?.lastSaved || new Date().toISOString());
        setCloudBackupStatus('synced');
        setMongoAvailable(result.mongoAvailable);
      }
    } finally {
      syncInProgress.current = false;
    }
  }, [user, userId]);

  // Debounced cloud push on every change
  useEffect(() => {
    if (!user || userId === 'guest') return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(syncToCloud, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(pushTimer.current);
  }, [data, user, userId, syncToCloud]);

  // Periodic cloud sync
  useEffect(() => {
    if (!user || userId === 'guest') return;
    cloudTimer.current = setInterval(syncToCloud, BACKUP_INTERVAL_MS);
    return () => clearInterval(cloudTimer.current);
  }, [user, userId, syncToCloud]);

  // Wake-from-sleep detection — re-sync when page becomes visible after being hidden
  useEffect(() => {
    if (!user || userId === 'guest') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (wakeSyncTimer.current) clearTimeout(wakeSyncTimer.current);
        wakeSyncTimer.current = setTimeout(syncToCloud, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeSyncTimer.current) clearTimeout(wakeSyncTimer.current);
    };
  }, [user, userId, syncToCloud]);

  const syncPyqToServer = useCallback((pyq) => {
    if (!pyq.mongoId || !mongoAvailable) return;
    pyqService.toggleSolved(pyq.mongoId, pyq.solved).catch(silentCatch('Sync PYQ solved'));
    if (pyq.bookmarked !== undefined) {
      pyqService.toggleBookmark(pyq.mongoId, pyq.bookmarked).catch(silentCatch('Sync PYQ bookmark'));
    }
  }, [mongoAvailable]);

  const refreshPyqs = useCallback(async () => {
    try {
      const res = await pyqService.getAll({ limit: 500 });
      const apiPyqs = res.data?.data || [];
      if (apiPyqs.length) {
        setData((d) => ({
          ...d,
          pyqs: mergePyqLists(apiPyqs, d.pyqs),
        }));
        setMongoAvailable(true);
      }
    } catch {
      warn('Refresh PYQs — using local data');
    }
  }, []);

  const updateTopics = useCallback((fn) => setData((d) => ({ ...d, topics: typeof fn === 'function' ? fn(d.topics) : fn })), []);
  const updateNotes = useCallback((fn) => setData((d) => ({ ...d, notes: typeof fn === 'function' ? fn(d.notes) : fn })), []);
  const updatePyqs = useCallback((fn) => {
    setData((d) => {
      const next = typeof fn === 'function' ? fn(d.pyqs) : fn;
      if (mongoAvailable) {
        const changed = next.find((p, i) => {
          const prev = d.pyqs[i];
          return prev && p.mongoId && (
            p.solved !== prev.solved
            || p.bookmarked !== prev.bookmarked
            || p.revisionNeeded !== prev.revisionNeeded
            || p.markedDifficult !== prev.markedDifficult
          );
        });
        if (changed?.mongoId) {
          if (changed.solved !== d.pyqs.find((x) => x.id === changed.id)?.solved) {
            pyqService.toggleSolved(changed.mongoId, changed.solved).catch(silentCatch('Toggle solved'));
          }
          if (changed.bookmarked !== d.pyqs.find((x) => x.id === changed.id)?.bookmarked) {
            pyqService.toggleBookmark(changed.mongoId, changed.bookmarked).catch(silentCatch('Toggle bookmark'));
          }
          const flags = {};
          const prev = d.pyqs.find((x) => x.id === changed.id);
          if (prev && changed.revisionNeeded !== prev.revisionNeeded) flags.revisionNeeded = changed.revisionNeeded;
          if (prev && changed.markedDifficult !== prev.markedDifficult) flags.markedDifficult = changed.markedDifficult;
          if (Object.keys(flags).length) pyqService.updateFlags(changed.mongoId, flags).catch(silentCatch('Update flags'));
        }
      }
      return { ...d, pyqs: next };
    });
  }, [mongoAvailable, syncPyqToServer]);
  const updateMocks = useCallback((fn) => setData((d) => ({ ...d, mocks: typeof fn === 'function' ? fn(d.mocks) : fn })), []);
  const updateStudyStats = useCallback((fn) => setData((d) => ({ ...d, studyStats: typeof fn === 'function' ? fn(d.studyStats) : fn })), []);
  const updateGateFeatures = useCallback((fn) => setData((d) => ({ ...d, gateFeatures: typeof fn === 'function' ? fn(d.gateFeatures || getDefaultGateFeatures()) : fn })), []);
  const updateGamification = useCallback((fn) => setData((d) => ({ ...d, gamification: typeof fn === 'function' ? fn(d.gamification) : fn })), []);
  const updateRevision = useCallback((fn) => setData((d) => ({ ...d, revisionSchedule: typeof fn === 'function' ? fn(d.revisionSchedule) : fn })), []);
  const updateProductivity = useCallback((fn) => setData((d) => ({ ...d, productivity: typeof fn === 'function' ? fn(d.productivity) : fn })), []);
  const updateNotifications = useCallback((fn) => setData((d) => ({ ...d, notifications: typeof fn === 'function' ? fn(d.notifications) : fn })), []);

  const awardBadges = useCallback((newBadges) => {
    if (!newBadges.length) return;
    const today = new Date().toISOString().slice(0, 10);
    updateGamification((g) => {
      const badges = [...(g.badges || [])];
      const badgeDates = { ...g.badgeDates };
      let xp = g.xp || 0;
      newBadges.forEach((id) => {
        if (!badges.includes(id)) {
          badges.push(id);
          badgeDates[id] = today;
          const def = BADGE_DEFINITIONS.find((b) => b.id === id);
          if (def) xp += def.xp;
        }
      });
      return { ...g, badges, badgeDates, xp, level: Math.floor(xp / 300) + 1 };
    });
    newBadges.forEach((id) => {
      const def = BADGE_DEFINITIONS.find((b) => b.id === id);
      if (def) toast.success(`🏅 Badge unlocked: ${def.name}!`, { duration: 4000 });
    });
  }, [updateGamification]);

  const resetAllProgress = useCallback(async () => {
    const empty = getEmptyProgressData();
    setData(empty);
    localStorage.setItem(storageKey(userId), JSON.stringify(empty));
    setLastBackupAt(null);
    setIsNewUser(true);
    setBackupStatus('saved');
    try {
      await progressService.resetAll();
      await syncToCloud();
    } catch { /* local reset sufficient */ }
    toast.success('All progress reset to 0%');
  }, [userId, syncToCloud]);

  const restoreFromSnapshot = useCallback(async (snapshotId) => {
    try {
      const res = await progressService.restoreSnapshot(snapshotId);
      const { data: merged } = await pullFromServer(getEmptyProgressData(), user);
      setData(merged);
      localStorage.setItem(storageKey(userId), JSON.stringify(merged));
      setIsNewUser(isEmptyProgress(merged));
      toast.success('Progress restored from backup');
      return res.data;
    } catch {
      toast.error('Restore failed');
      return null;
    }
  }, [userId, user]);

  const resetSubjectProgress = useCallback((subjectName) => {
    setData((d) => ({
      ...d,
      topics: d.topics.map((t) => (t.subject === subjectName ? { ...t, done: false } : t)),
      pyqs: d.pyqs.map((p) => (p.subject === subjectName ? { ...p, solved: false, revisionNeeded: false } : p)),
      studyStats: {
        ...d.studyStats,
        subjects: d.studyStats.subjects.map((s) => (s.name === subjectName ? { ...s, progress: 0 } : s)),
      },
    }));
    toast.success(`Reset progress for ${subjectName}`);
  }, []);

  const resetTopicProgress = useCallback((topicId) => {
    setData((d) => ({
      ...d,
      topics: d.topics.map((t) => (t.id === topicId ? { ...t, done: false } : t)),
    }));
    toast.success('Topic progress reset');
  }, []);

  const importUserData = useCallback((jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const merged = mergeProgressData(parsed);
      setData(merged);
      localStorage.setItem(storageKey(userId), JSON.stringify(merged));
      setIsNewUser(isEmptyProgress(merged));
      syncToCloud();
      toast.success('Data imported successfully');
      return true;
    } catch {
      toast.error('Invalid backup file');
      return false;
    }
  }, [userId, syncToCloud]);

  const getSearchIndex = useCallback(() => {
    const items = [];
    data.topics.forEach((t) => items.push({ type: 'topic', id: t.id, title: t.name, subtitle: t.subject, path: '/topics', done: t.done }));
    data.notes.forEach((n) => items.push({ type: 'note', id: n.id, title: n.title, subtitle: n.subject, path: '/notes' }));
    data.pyqs.forEach((p) => items.push({ type: 'pyq', id: p.id, title: p.title, subtitle: `${p.subject} · GATE ${p.year}`, path: '/pyq', solved: p.solved }));
    items.push({ type: 'page', id: 'formulas', title: 'Formula Revision Sheet', subtitle: 'Quick-reference formulas', path: '/formulas' });
    items.push({ type: 'page', id: 'planner', title: 'Study Planner', subtitle: 'Calendar study sessions', path: '/planner' });
    items.push({ type: 'page', id: 'revision', title: 'Revision Calendar', subtitle: 'Spaced repetition schedule', path: '/revision' });
    items.push({ type: 'page', id: 'resources', title: 'Study Resources', subtitle: 'YouTube, NPTEL, notes links', path: '/resources' });
    items.push({ type: 'page', id: 'productivity', title: 'Productivity Hub', subtitle: 'Pomodoro, journal, tasks', path: '/productivity' });
    return items;
  }, [data]);

  const getExportPayload = useCallback(() => ({
    user: { name: user?.name, email: user?.email },
    exportedAt: new Date().toISOString(),
    topics: data.topics,
    notes: data.notes,
    pyqs: data.pyqs,
    mocks: data.mocks,
    studyStats: data.studyStats,
    gateFeatures: data.gateFeatures,
    gamification: data.gamification,
    revisionSchedule: data.revisionSchedule,
    productivity: data.productivity,
  }), [data, user]);

  useEffect(() => {
    const newBadges = checkNewBadges(data.gamification, data);
    if (newBadges.length) awardBadges(newBadges);
  }, [data.gateFeatures?.streak?.current, data.pyqs, data.mocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProgressContext.Provider value={{
      data,
      topics: data.topics,
      notes: data.notes,
      pyqs: data.pyqs,
      mocks: data.mocks,
      studyStats: data.studyStats,
      gateFeatures: data.gateFeatures,
      gamification: data.gamification,
      revisionSchedule: data.revisionSchedule,
      resources: data.resources,
      productivity: data.productivity,
      notifications: data.notifications,
      isNewUser,
      isEmptyProgress: isEmptyProgress(data),
      backupStatus,
      lastBackupAt,
      cloudBackupStatus,
      lastCloudBackupAt,
      mongoAvailable,
      syncToCloud,
      refreshPyqs,
      updateTopics,
      updateNotes,
      updatePyqs,
      updateMocks,
      updateStudyStats,
      updateGateFeatures,
      updateGamification,
      updateRevision,
      updateProductivity,
      updateNotifications,
      resetAllProgress,
      resetSubjectProgress,
      resetTopicProgress,
      restoreFromSnapshot,
      importUserData,
      getSearchIndex,
      getExportPayload,
      backupIntervalMs: BACKUP_INTERVAL_MS,
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
};
