// Lightweight watch-progress persistence for the Learning Hub.
// Stored per-video in localStorage so resume/completion survives refresh,
// logout/login, and works on desktop and mobile alike.
//
// Progress events are gated (only emitted on ~1% playhead moves or on
// completion / explicit flush) so consumers don't re-render every tick.

const KEY = 'lh_watch_progress';
export const WATCH_EVENT = 'lh:progress';

function readMap() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeMap(map, notify) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (_) {
    // storage full / unavailable — keep going in-memory for the session
  }
  if (notify) {
    try {
      window.dispatchEvent(new CustomEvent(WATCH_EVENT));
    } catch (_) {}
  }
}

export function getProgress(videoId) {
  if (!videoId) return null;
  const p = readMap()[videoId];
  return p || null;
}

export function getLessonStatus(videoId) {
  if (!videoId) return 'not-started';
  const p = readMap()[videoId];
  if (!p) return 'not-started';
  if (p.completed) return 'completed';
  if ((p.pct || 0) > 0.02) return 'in-progress';
  return 'not-started';
}

// Upsert watch state for a video. `notify` is fired only when the progress
// moved by >=1% or the completion flag changed — never on every tick.
export function saveProgress(videoId, data) {
  if (!videoId) return;
  const map = readMap();
  const prev = map[videoId] || {};
  const pct = data.pct ?? prev.pct ?? 0;
  const moved = Math.abs(pct - (prev.pct || 0)) >= 0.01;
  const completedChanged = !!data.completed !== !!prev.completed;
  map[videoId] = {
    ...prev,
    ...data,
    videoId,
    pct,
    ts: Date.now(),
  };
  writeMap(map, moved || completedChanged);
}

export function markCompleted(videoId, extra = {}) {
  if (!videoId) return;
  const map = readMap();
  const prev = map[videoId] || {};
  map[videoId] = { ...prev, ...extra, videoId, completed: true, pct: 1, ts: Date.now() };
  writeMap(map, true);
}

export function clearProgress(videoId) {
  if (!videoId) return;
  const map = readMap();
  delete map[videoId];
  writeMap(map, true);
}

// Real continue-watching, newest first, unfinished only.
export function getContinueWatching(limit = 8) {
  return Object.values(readMap())
    .filter((p) => p && !p.completed)
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, limit);
}

export function getCompletedCount() {
  return Object.values(readMap()).filter((p) => p && p.completed).length;
}

export function getInProgressCount() {
  return Object.values(readMap()).filter((p) => p && !p.completed && (p.pct || 0) > 0.02).length;
}

// Aggregate subject progress from watched videos (video-level completion).
export function getSubjectProgress() {
  const map = {};
  for (const p of Object.values(readMap())) {
    if (!p || !p.subject) continue;
    if (!map[p.subject]) map[p.subject] = { completed: 0, total: 0, name: p.subject };
    map[p.subject].total += 1;
    if (p.completed) map[p.subject].completed += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// The next unfinished lesson inside a subject, used for "Up Next".
export function pickUpNext(videos, currentId) {
  if (!Array.isArray(videos) || !videos.length) return null;
  const idx = videos.findIndex((v) => (v._id || v.id) === currentId || v.youtubeId === currentId);
  if (idx === -1) return null;
  const current = videos[idx];
  const sameSubject = videos.filter((v) => v.subject && v.subject === current.subject);
  const pool = sameSubject.length > 1 ? sameSubject : videos;
  const start = sameSubject.length > 1 ? pool.indexOf(current) : idx;
  for (let i = 1; i <= pool.length; i++) {
    const cand = pool[(start + i) % pool.length];
    if (getLessonStatus(cand.youtubeId || cand.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1]) !== 'completed') {
      return cand;
    }
  }
  return null;
}
