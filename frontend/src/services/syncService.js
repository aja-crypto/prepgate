// Hybrid MongoDB sync — pull on login, push on change
import api, { progressService } from './api';

/** Check if backend has MongoDB (not mock-only) */
export async function checkMongoAvailable() {
  try {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/health';
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    return json?.mongoConnected === true || json?.dataSource === 'mongodb';
  } catch {
    return false;
  }
}

/** Merge cloud backup with local data — cloud wins when it has data */
export function mergeProgressData(local, cloudBlob) {
  if (!cloudBlob?.data) return local;
  const cloudTime = new Date(cloudBlob.updatedAt || 0).getTime();
  const localTime = new Date(local.lastSaved || 0).getTime();

  // Prefer cloud if it has a newer timestamp OR local has never been saved
  if (cloudTime >= localTime || !local.lastSaved) {
    return {
      ...local,
      ...cloudBlob.data,
      gateFeatures: { ...local.gateFeatures, ...cloudBlob.data.gateFeatures },
      gamification: { ...local.gamification, ...cloudBlob.data.gamification },
      productivity: { ...local.productivity, ...cloudBlob.data.productivity },
      notifications: { ...local.notifications, ...cloudBlob.data.notifications },
      lastSaved: cloudBlob.updatedAt,
    };
  }
  return local;
}

/** Merge entity arrays — server mocks/notes take precedence when mongoId present */
function mergeEntities(localArr, serverArr) {
  if (!serverArr?.length) return localArr;
  const serverMap = new Map(serverArr.map((e) => [e.mongoId || e.id, e]));
  const merged = localArr.map((item) => {
    if (item.mongoId && serverMap.has(item.mongoId)) {
      return { ...item, ...serverMap.get(item.mongoId) };
    }
    return item;
  });
  serverArr.forEach((s) => {
    if (!merged.some((m) => (m.mongoId || m.id) === (s.mongoId || s.id))) {
      merged.push(s);
    }
  });
  return merged;
}

/** Pull full sync from server */
export async function pullFromServer(localData, user) {
  try {
    const res = await progressService.pullSync();
    const { backup, mocks, notes, mongoAvailable } = res.data?.data || {};
    const hasCloudData = backup?.data && backup.updatedAt;

    let merged = localData;
    if (hasCloudData) {
      merged = mergeProgressData(localData, backup);
    } else if (user?.email !== 'demo@gate2027.in') {
      // New account — use empty state from server or local
      const { getEmptyProgressData } = await import('../data/emptyState');
      merged = backup?.data ? mergeProgressData(getEmptyProgressData(), backup) : localData;
    }

    // Demo account gets sample data when progress is empty
    if (user?.email === 'demo@gate2027.in') {
      const { getDemoProgressData } = await import('../data/defaults');
      const { isEmptyProgress } = await import('../data/emptyState');
      if (isEmptyProgress(merged)) merged = getDemoProgressData();
    }

    if (mocks?.length) merged = { ...merged, mocks: mergeEntities(merged.mocks, mocks) };
    if (notes?.length) merged = { ...merged, notes: mergeEntities(merged.notes, notes) };

    return {
      data: merged,
      mongoAvailable: mongoAvailable ?? false,
      updatedAt: backup?.updatedAt,
      fromCloud: !!hasCloudData,
    };
  } catch {
    return { data: localData, mongoAvailable: false, error: true, fromCloud: false };
  }
}

/** Push full sync to server — returns updated mocks/notes with mongoIds */
export async function pushToServer(data) {
  try {
    const res = await progressService.pushSync(data);
    const { mocks, notes, updatedAt, mongoAvailable } = res.data?.data || {};
    const updated = { ...data, lastSaved: updatedAt || new Date().toISOString() };
    if (mocks?.length) updated.mocks = mocks;
    if (notes?.length) updated.notes = notes;
    return { data: updated, mongoAvailable: mongoAvailable ?? false };
  } catch {
    // Fallback to backup-only sync
    try {
      const res = await progressService.backup(data);
      return { data: { ...data, lastSaved: res.data?.data?.updatedAt }, mongoAvailable: false };
    } catch {
      return { data, error: true };
    }
  }
}

/** Sync PYQ solved/bookmark status to server when pyq has mongoId */
export async function syncPyqStatus(pyq, pyqService) {
  if (!pyq.mongoId) return;
  try {
    await pyqService.toggleSolved(pyq.mongoId, pyq.solved);
    if (pyq.bookmarked !== undefined) {
      await pyqService.toggleBookmark(pyq.mongoId, pyq.bookmarked);
    }
  } catch { /* offline */ }
}
