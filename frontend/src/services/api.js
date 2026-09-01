// src/services/api.js – Axios API Service with token refresh
import axios from 'axios';

const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const SWR_TTL = 2 * 60 * 1000;
function cacheKeyFor(config) {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : '';
  return `get:${url}?${params}`;
}
export function getCached(key) {
  const entry = apiCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) apiCache.delete(key);
  return null;
}
export function getStale(key) {
  const entry = apiCache.get(key);
  return entry ? entry.data : null;
}
export function setCache(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}
export function clearApiCache() {
  apiCache.clear();
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** User-friendly message for auth/API failures */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'Request timed out. Check your connection and try again.';
  if (error.message === 'Network Error' || !error.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  return fallback;
}

// ΓöÇΓöÇΓöÇ Request interceptor ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const NO_CACHE_PATTERNS = ['/auth/me', '/auth/refresh', '/auth/demo', '/ai/quota', '/notifications', '/progress/sync', '/admin/', '/gate-vault/progress', '/gate-vault/stats', '/notes', '/live/dashboard', '/ai/context', '/notes/pinned'];

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const isGuest = localStorage.getItem('isGuest') === 'true';

    if (isGuest) {
      config.headers['X-Demo-User'] = 'true';
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get' && !NO_CACHE_PATTERNS.some(p => config.url?.includes(p))) {
      const cacheKey = cacheKeyFor(config);
      const cached = getCached(cacheKey);
      if (cached) {
        config.adapter = () => Promise.resolve({ data: cached, status: 200, statusText: 'OK', headers: {}, config });
      } else {
        const stale = getStale(cacheKey);
        if (stale) config.headers['X-Cache-Stale'] = 'true';
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ΓöÇΓöÇΓöÇ Response interceptor (auto token refresh + retry) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = res.data.data;
  localStorage.setItem('accessToken', accessToken);
  if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  return accessToken;
};

api.interceptors.response.use(
  (response) => {
    if (response.config?.method === 'get' && !NO_CACHE_PATTERNS.some(p => response.config?.url?.includes(p))) {
      const cacheKey = cacheKeyFor(response.config);
      setCache(cacheKey, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response?.status === 401 && import.meta.env.DEV) {
      const token = localStorage.getItem('accessToken');
      const defaultAuth = api.defaults.headers.common['Authorization'];
      console.error(`[AUTH-DEBUG] 401 ON ${originalRequest.method?.toUpperCase()} ${originalRequest.url} | sent_header=${originalRequest.headers?.Authorization ? 'YES' : 'NO'} | token_in_storage=${token ? 'YES(' + token.length + ')' : 'NO'} | default_auth=${defaultAuth ? 'YES' : 'NO'} | response_msg=${error.response?.data?.message} | response_code=${error.response?.data?.code}`);
    }

    if (error.response?.status === 429) {
      return Promise.reject(error);
    }

    // Auto-retry on network/timeout errors (backend cold start, DB reconnect, down) — up to 2 tries
    const isNetworkError = (!error.response && error.message === 'Network Error') || error.code === 'ECONNABORTED';
    const isServerUnavailable = error.response?.status === 503 || error.response?.status === 502 || error.response?.status === 504;
    if ((isNetworkError || isServerUnavailable) && !originalRequest._retryCount) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        const delay = originalRequest._retryCount * 1500;
        await new Promise(r => setTimeout(r, delay));
        return api(originalRequest);
      }
    }

    // Handle invalid tokens (wrong secret, malformed, expired without refresh)
    const isInvalidToken = error.response?.status === 401 && (
      error.response?.data?.code === 'TOKEN_EXPIRED' ||
      error.response?.data?.message?.toLowerCase().includes('invalid token') ||
      error.response?.data?.message?.toLowerCase().includes('token expired')
    );

    // Force logout on non-refresh 401s where token is fundamentally unusable
    if (error.response?.status === 401 && !originalRequest._retry &&
        error.response?.data?.message?.toLowerCase().includes('invalid token') &&
        !error.config.url?.includes('/auth/refresh') &&
        !error.config.url?.includes('/auth/login')) {
      console.error('[AUTH-DEBUG] CLEARING TOKENS: force logout on invalid token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(error);
    }

    if (isInvalidToken && !originalRequest._retry) {
      originalRequest._retry = true;
      console.error('[AUTH-DEBUG] IS_INVALID_TOKEN: attempting refresh for', originalRequest.url);

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (queueError) {
          return Promise.reject(queueError);
        }
      }

      isRefreshing = true;

      try {
        const accessToken = await refreshAccessToken();
        console.error('[AUTH-DEBUG] REFRESH SUCCESS: new token length', accessToken.length);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[AUTH-DEBUG] REFRESH FAILED:', refreshError.message, '- CLEARING ALL TOKENS');
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ΓöÇΓöÇΓöÇ Named service functions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const authService = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
  changeEmail: (newEmail, password) => api.put('/auth/change-email', { newEmail, password }),
  updateAvatar: (avatar) => api.put('/auth/avatar', { avatar }),
  updateBadges: (badges) => api.put('/auth/badges', { badges }),
  registerFcmToken: (token) => api.put('/auth/fcm-token', { token }),
  forgotPassword: (email) => api.post('/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
};

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
  getHierarchy: () => api.get('/subjects', { params: { hierarchy: 'true' } }),
  getAnalytics: () => api.get('/subjects/analytics/overview'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (d) => api.post('/subjects', d),
  update: (id, d) => api.put(`/subjects/${id}`, d),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const topicService = {
  getAll: (params) => api.get('/topics', { params }),
  getLearn: (id) => api.get(`/topics/${id}/learn`),
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

export const aiService = {
  generatePlan: (payload) => api.post('/ai/planner', payload),
  getRecommendations: (payload) => api.post('/ai/recommendations', payload),
  askCoach: (message, context, sessionId) => api.post('/ai/chat', { message, context, sessionId, conversationId: sessionId }),
  streamCoach: (message, context, sessionId, signal, modePrompt) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' };
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (localStorage.getItem('isGuest') === 'true') {
      headers['X-Demo-User'] = 'true';
    }
    const body = { message, context, sessionId, conversationId: sessionId, stream: true };
    if (modePrompt) body.modePrompt = modePrompt;
    return fetch(`${api.defaults.baseURL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  },
  doubtSolve: (payload) => api.post('/ai/doubt-solver', payload),
  getQuota: () => api.get('/ai/quota'),
  getContext: () => api.get('/ai/context'),
  getDoubtSubjects: () => api.get('/ai/doubt-subjects'),
  getCacheStats: () => api.get('/ai/cache/stats'),
  clearCache: () => api.delete('/ai/cache'),
  getMetrics: () => api.get('/ai/metrics'),
  getLogs: (lines = 100) => api.get('/ai/logs', { params: { lines } }),
  clearConversation: (sessionId) => api.delete('/ai/conversation', { params: { sessionId } }),
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
  aiSearch: (query) => api.post('/notes/ai-search', { query }),
};

export const resourceService = {
  getSubjects: () => api.get('/resources/subjects'),
  getBySubject: (subject) => api.get(`/resources/subject/${encodeURIComponent(subject)}`),
  getIndex: () => api.get('/resources/index'),
  aiSearch: (query) => api.post('/resources/ai-search', { query }),
  fileUrl: (filePath) => `/api/resources/file/${filePath}`,
  openFile: async (filePath) => {
    const token = localStorage.getItem('accessToken');
    const url = `/api/resources/file/${encodeURIComponent(filePath)}`;
    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to open file (${response.status})`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const { url: fileUrl } = await response.json();
      if (fileUrl) {
        window.open(fileUrl, '_blank');
        return fileUrl;
      }
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    return blobUrl;
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

export const gatePaperService = {
  getAll: (year) => api.get('/gate-papers', { params: year ? { year } : {} }),
  downloadUrl: (filename) => `/api/gate-papers/download/${encodeURIComponent(filename)}`,
  previewUrl: (filename) => `/api/gate-papers/download/${encodeURIComponent(filename)}?inline=true`,
};

export const shortNoteService = {
  getAll: () => api.get('/short-notes'),
  upload: (folder, formData) => api.post(`/short-notes/upload/${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  downloadUrl: (folder, filename) => `/api/short-notes/download/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`,
  openFile: async (folder, filename) => {
    const response = await api.get(`/short-notes/download/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`);
    if (response.data?.success && response.data?.url) {
      window.open(response.data.url, '_blank');
      return response.data.url;
    }
    if (response.headers['content-type']?.includes('application/pdf')) {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return url;
    }
    throw new Error(response.data?.message || 'Failed to get file URL');
  },
};

export const mockTestService = {
  getAll: (params) => api.get('/mock-tests', { params }),
  getSubjectCounts: () => api.get('/mock-tests/subjects'),
  getAnalytics: () => api.get('/mock-tests/analytics'),
  getProgress: () => api.get('/mock-tests/progress'),
  getRecommended: () => api.get('/mock-tests/recommended'),
  getById: (id) => api.get(`/mock-tests/${id}`),
  getQuestions: (id) => api.get(`/mock-tests/${id}/questions`),
  submit: (id, data) => api.post(`/mock-tests/${id}/submit`, data),
  getResult: (id) => api.get(`/mock-tests/${id}/result`),
};

export const mistakeService = {
  getAll: (params) => api.get('/mistakes', { params }),
  getAggregates: () => api.get('/mistakes/aggregates'),
  create: (data) => api.post('/mistakes', data),
  update: (id, data) => api.put(`/mistakes/${id}`, data),
  delete: (id) => api.delete(`/mistakes/${id}`),
};

export const studyPlanService = {
  get: () => api.get('/study-plan'),
};

export const weeklyTestService = {
  getAll: (params) => api.get('/weekly-tests', { params }),
  getSubjectCounts: () => api.get('/weekly-tests/subjects'),
  getProgress: () => api.get('/weekly-tests/progress'),
  getById: (id) => api.get(`/weekly-tests/${id}`),
  complete: (id, data) => api.post(`/weekly-tests/${id}/complete`, data),
  uploadPdf: (id, formData) => api.post(`/weekly-tests/upload/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  create: (data) => api.post('/weekly-tests', data),
  delete: (id) => api.delete(`/weekly-tests/${id}`),
  downloadUrl: (subject, filename) => `/api/weekly-tests/download/${encodeURIComponent(subject)}/${encodeURIComponent(filename)}`,
  openFile: async (subject, filename) => {
    const response = await api.get(`/weekly-tests/download/${encodeURIComponent(subject)}/${encodeURIComponent(filename)}`);
    if (response.data?.success && response.data?.url) {
      window.open(response.data.url, '_blank');
      return response.data.url;
    }
    if (response.headers['content-type']?.includes('application/pdf')) {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return url;
    }
    throw new Error(response.data?.message || 'Failed to get file URL');
  },
};

export const feedbackService = {
  get: () => api.get('/feedback'),
  submit: (data) => api.post('/feedback', data),
  getAdminStats: () => api.get('/feedback/admin/stats'),
  getAdminAll: (params) => api.get('/feedback/admin/all', { params }),
  getPolls: () => api.get('/feedback/polls'),
};

export const adminLiveService = {
  getPending: (params) => api.get('/admin/live-data/live/pending', { params }),
  getUpdates: (params) => api.get('/admin/live-data/live/updates', { params }),
  updateStatus: (id, status) => api.put(`/admin/live-data/live/updates/${id}/status`, { status }),
  publishVerified: () => api.post('/admin/live-data/live/publish-verified'),
  createUpdate: (d) => api.post('/admin/live-data/live/updates', d),
  deleteUpdate: (id) => api.delete(`/admin/live-data/live/updates/${id}`),
  getJobs: () => api.get('/admin/live-data/live/jobs'),
  triggerFetch: (jobName) => api.post('/admin/live-data/live/fetch', jobName ? { jobName } : {}),
};

export default api;

// ΓöÇΓöÇΓöÇ GateVault API ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// ─── Learning Hub Videos API ─────────────────────────────────────
export const learningHubVideoService = {
  list: (params) => api.get('/learning-hub/videos', { params }),
  getById: (id) => api.get(`/learning-hub/videos/${id}`),
};

// ─── Learning Hub Subject Resources & Editor Picks ──────────────
export const learningHubDataService = {
  getSubjectResources: () => api.get('/learning/subject-resources'),
  getEditorPicks: () => api.get('/learning/editor-picks'),
};

export const insightsService = {
  list: () => api.get('/insights/topics'),
  getBySlug: (slug) => api.get(`/insights/topics/${slug}`),
};

export const gateVaultService = {
  getMonthlySet: () => api.get('/gate-vault/monthly-set'),
  getProgress: () => api.get('/gate-vault/progress'),
  startSession: (selectedSubjects) => api.post('/gate-vault/start', { selectedSubjects }),
  submitAnswer: (data) => api.post('/gate-vault/answer', data),
  getStats: () => api.get('/gate-vault/stats'),
};

// ΓöÇΓöÇΓöÇ Calendar API ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const calendarService = {
  getAll: (params) => api.get('/calendar', { params }),
  create: (data) => api.post('/calendar', data),
  update: (id, data) => api.put(`/calendar/${id}`, data),
  delete: (id) => api.delete(`/calendar/${id}`),
};

// ΓöÇΓöÇΓöÇ Opportunity Predictor API ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const predictorService = {
  predict: (data) => api.post('/predictor/predict', data),
  getHistory: (params) => api.get('/predictor/history', { params }),
  getPrediction: (id) => api.get(`/predictor/history/${id}`),
  deletePrediction: (id) => api.delete(`/predictor/history/${id}`),
  whatIf: (historyId, marksDelta) => api.post('/predictor/what-if', { historyId, marksDelta }),
  getTrends: (institute, program, category) => api.get(`/predictor/trends/${encodeURIComponent(institute)}/${encodeURIComponent(program)}`, { params: { category } }),
  getCcmt: (params) => api.get('/predictor/ccmt', { params }),
  getTopClosingScores: (params) => api.get('/predictor/insights/top-closing-scores', { params }),
  getCoap: (params) => api.get('/predictor/coap', { params }),
  getSeats: (params) => api.get('/predictor/seats', { params }),
  validate: (data) => api.post('/predictor/validate', data),
  getAccuracy: () => api.get('/predictor/accuracy'),
  getStats: () => api.get('/predictor/stats'),
  getYears: () => api.get('/predictor/years'),
  getColleges: (params) => api.get('/predictor/colleges', { params }),
  getPsus: (params) => api.get('/predictor/psus', { params }),
  choiceOrder: (data) => api.post('/predictor/choice-order', data),
  getUnlockStatus: () => api.get('/predictor/unlock-status'),
};

// ΓöÇΓöÇΓöÇ Referral API ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const referralService = {
  getStatus: () => api.get('/referral/status'),
  getCode: () => api.get('/referral/code'),
  claimCode: (code) => api.post('/referral/claim', { code }),
  completeReferral: () => api.post('/referral/complete'),
  getHistory: () => api.get('/referral/history'),
  getPremiumStatus: () => api.get('/referral/premium-status'),
  refresh: () => api.post('/referral/refresh'),
  validate: (code) => api.get(`/referral/validate/${encodeURIComponent(code)}`),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  generate: (type, context) => api.post('/notifications/generate', { type, context }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  toggleBookmark: (id) => api.put(`/notifications/${id}/bookmark`),
  delete: (id) => api.delete(`/notifications/${id}`),
  getPrefs: () => api.get('/notifications/prefs'),
  updatePrefs: (prefs) => api.put('/notifications/prefs', prefs),
};
