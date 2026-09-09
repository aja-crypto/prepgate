// src/services/api.js – Axios API Service with token refresh
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function getApiOrigin() {
  const base = import.meta.env.VITE_API_URL || '/api';
  if (/^https?:\/\//i.test(base)) {
    return new URL(base).origin;
  }
  return window.location.origin;
}

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const normalized = url.startsWith('/') ? url : `/${url}`;
  if (normalized.startsWith('/uploads/')) {
    return `${getApiOrigin()}${normalized}`;
  }
  return normalized;
}

// ─── Simple in-memory cache for GET requests ──────────────────
const GET_CACHE_TTL_MS = 30000;
const getCache = new Map();

function cacheKey(config) {
  const { url, method, params } = config;
  if (method !== 'get') return null;
  const paramStr = params ? JSON.stringify(params) : '';
  return `${url}:${paramStr}`;
}

function getCached(config) {
  const key = cacheKey(config);
  if (!key) return null;
  const entry = getCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > GET_CACHE_TTL_MS) {
    getCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(config, data) {
  const key = cacheKey(config);
  if (!key) return;
  getCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern) {
  for (const key of getCache.keys()) {
    if (key.startsWith(pattern)) getCache.delete(key);
  }
}

// Invalidate subject/topic cache on mutations
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    if (config.url?.startsWith('/subjects')) invalidateCache('/subjects');
    if (config.url?.startsWith('/topics')) invalidateCache('/topics');
  }
  return config;
});

/** User-friendly message for auth/API failures */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'Request timed out — server may be waking up. Please try again.';
  if (error.message === 'Network Error' || !error.response) {
    return 'Cannot reach the server — it may be starting up. Please try again in a moment.';
  }
  return fallback;
}

// ─── Request interceptor ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const isGuest = localStorage.getItem('isGuest') === 'true';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isGuest) {
      config.headers['X-Demo-User'] = 'true';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor (auto token refresh) ──────────────
let isRefreshing = false;
let failedQueue = [];
const REFRESH_TIMEOUT_MS = 10000;
const QUEUED_REQUEST_TIMEOUT_MS = 15000;

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

const waitForTokenRefresh = () =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Token refresh queue timed out'));
    }, QUEUED_REQUEST_TIMEOUT_MS);
    failedQueue.push({
      resolve: (token) => { clearTimeout(timer); resolve(token); },
      reject: (err) => { clearTimeout(timer); reject(err); },
    });
  });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code && ['TOKEN_EXPIRED', 'TOKEN_INVALID'].includes(error.response.data.code) && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await waitForTokenRefresh();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (queueError) {
          return Promise.reject(queueError);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { timeout: REFRESH_TIMEOUT_MS }
        );
        const { accessToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Cache GET responses ──────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config.method === 'get') {
      setCache(config, response.data);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// ─── Named service functions ────────────────────────────────
function cachedGet(serviceName, url, params) {
  const config = { url, method: 'get', params };
  const cached = getCached(config);
  if (cached) return Promise.resolve({ data: cached, config, fromCache: true });
  return api.get(url, { params }).then((res) => ({ ...res, fromCache: false }));
}

export const authService = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
  registerFcmToken: (token) => api.put('/auth/fcm-token', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
};

export const subjectService = {
  getAll: (params) => cachedGet('subjects', '/subjects', params),
  getHierarchy: () => cachedGet('subjects', '/subjects', { hierarchy: 'true' }),
  getAnalytics: () => cachedGet('subjects', '/subjects/analytics/overview'),
  getById: (id) => cachedGet('subjects', `/subjects/${id}`),
  create: (d) => api.post('/subjects', d),
  update: (id, d) => api.put(`/subjects/${id}`, d),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const topicService = {
  getAll: (params) => cachedGet('topics', '/topics', params),
  getLearn: (id) => cachedGet('topics', `/topics/${id}/learn`),
  updateProgress: (id, data) => api.patch(`/topics/${id}/progress`, data),
  create: (d) => api.post('/topics', d),
  update: (id, d) => api.put(`/topics/${id}`, d),
  toggle: (id) => api.patch(`/topics/${id}/toggle`),
  delete: (id) => api.delete(`/topics/${id}`),
};

export const progressService = {
  getOverall: () => api.get('/progress'),
  logStudyHours: (d) => api.put('/progress/study-hours', d),
  getStreak: () => api.get('/progress/streak'),
  resetAll: () => api.delete('/progress/reset'),
  backup: (data) => api.put('/progress/backup', { data }),
  restoreBackup: () => api.get('/progress/backup'),
  pullSync: () => api.get('/progress/sync'),
  pushSync: (data) => api.put('/progress/sync', { data }),
  getSnapshots: () => api.get('/progress/snapshots'),
  restoreSnapshot: (id) => api.post(`/progress/restore/${id}`),
};

const AI_CHAT_TIMEOUT_MS = 45000;

export const aiService = {
  generatePlan: (payload) => api.post('/ai/planner', payload, { timeout: AI_CHAT_TIMEOUT_MS }),
  getRecommendations: (payload) => api.post('/ai/recommendations', payload, { timeout: AI_CHAT_TIMEOUT_MS }),
  askCoach: (message, context, config = {}) =>
    api.post('/ai/chat', { message, context }, { timeout: AI_CHAT_TIMEOUT_MS, ...config }),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
};

export const mockService = {
  getAll: () => api.get('/mocks'),
  getAnalytics: () => api.get('/mocks/analytics'),
  create: (d) => api.post('/mocks', d),
  update: (id, d) => api.put(`/mocks/${id}`, d),
  delete: (id) => api.delete(`/mocks/${id}`),
};

export const pyqService = {
  getAll: (params) => api.get('/pyq', { params }),
  getById: (id, params) => api.get(`/pyq/${id}`, { params }),
  getBrowse: () => api.get('/pyq/browse'),
  getStats: () => api.get('/pyq/stats/overview'),
  attempt: (id, data) => api.post(`/pyq/${id}/attempt`, data),
  toggleSolved: (id, isSolved) => api.patch(`/pyq/${id}/solved`, { isSolved }),
  toggleBookmark: (id, isBookmarked) => api.patch(`/pyq/${id}/bookmark`, { isBookmarked }),
  updateFlags: (id, flags) => api.patch(`/pyq/${id}/flags`, flags),
  create: (d) => api.post('/pyq', d),
};

export const mockSessionService = {
  generate: (config) => api.post('/mock-sessions/generate', config),
  getAll: (params) => api.get('/mock-sessions', { params }),
  getById: (id) => api.get(`/mock-sessions/${id}`),
  submit: (id, answers) => api.post(`/mock-sessions/${id}/submit`, { answers }),
  getResults: (id) => api.get(`/mock-sessions/${id}/results`),
};

export const adminPyqService = {
  getImportTemplate: () => api.get('/admin/pyq/import-template'),
  validate: (questions) => api.post('/admin/pyq/validate', questions),
  importJson: (questions, upsert = false) => api.post(`/admin/pyq/import/json${upsert ? '?upsert=true' : ''}`, questions),
  importCsv: (csv, upsert = false) => api.post(`/admin/pyq/import/csv${upsert ? '?upsert=true' : ''}`, { csv }),
  getAll: (params) => api.get('/admin/pyq', { params }),
  update: (id, data) => api.put(`/admin/pyq/${id}`, data),
  delete: (id) => api.delete(`/admin/pyq/${id}`),
};

export const noteService = {
  getAll: (params) => api.get('/notes', { params }),
  getStats: () => api.get('/notes/stats'),
  create: (d) => {
    if (d instanceof FormData) {
      // IMPORTANT: Don't set Content-Type manually for FormData, axios/browser does it with boundary
      return api.post('/notes', d, { 
        headers: { 'Content-Type': undefined },
        timeout: 60000 // 60s for file uploads + OCR
      });
    }
    return api.post('/notes', d);
  },
  update: (id, d) => {
    if (d instanceof FormData) {
      return api.put(`/notes/${id}`, d, { 
        headers: { 'Content-Type': undefined },
        timeout: 60000
      });
    }
    return api.put(`/notes/${id}`, d);
  },
  delete: (id) => api.delete(`/notes/${id}`),
};

export const resourceService = {
  openFile: (filePath) => {
    const resolvedPath = resolveAssetUrl(filePath);
    if (resolvedPath) window.open(resolvedPath, '_blank', 'noopener,noreferrer');
  },
};

export const liveDataService = {
  getDashboard: () => api.get('/live/dashboard'),
  getUpdates: (params) => api.get('/live/updates', { params }),
  getSchedule: () => api.get('/live/schedule'),
  getDaily: () => api.get('/live/daily'),
  getAnalysis: (params) => api.get('/live/analysis', { params }),
  getTrending: () => api.get('/live/trending'),
};

export const adminLiveService = {
  getPending: (params) => api.get('/admin/live/pending', { params }),
  getUpdates: (params) => api.get('/admin/live/updates', { params }),
  updateStatus: (id, status) => api.put(`/admin/live/updates/${id}/status`, { status }),
  publishVerified: () => api.post('/admin/live/publish-verified'),
  createUpdate: (d) => api.post('/admin/live/updates', d),
  deleteUpdate: (id) => api.delete(`/admin/live/updates/${id}`),
  getJobs: () => api.get('/admin/live/jobs'),
  triggerFetch: (jobName) => api.post('/admin/live/fetch', jobName ? { jobName } : {}),
};

export default api;
