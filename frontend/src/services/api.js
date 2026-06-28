// src/services/api.js – Axios API Service with token refresh
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
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

// ─── Response interceptor (auto token refresh + retry) ──────
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Auto-retry on network errors (backend down, DB disconnect) — up to 2 tries
    const isNetworkError = !error.response && error.message === 'Network Error';
    const isServerUnavailable = error.response?.status === 503 || error.response?.status === 502 || error.response?.status === 504 || error.response?.status === 500;
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

      if (originalRequest.method?.toUpperCase() === 'POST') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        if (window.location.pathname !== '/login') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
      }

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
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
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

// ─── Named service functions ────────────────────────────────
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
  askCoach: (message, context) => api.post('/ai/chat', { message, context }),
  doubtSolve: (payload) => api.post('/ai/doubt-solver', payload),
  getDoubtSubjects: () => api.get('/ai/doubt-subjects'),
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
};

export const shortNoteService = {
  getAll: () => api.get('/short-notes'),
  upload: (folder, formData) => api.post(`/short-notes/upload/${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
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
};

export const feedbackService = {
  get: () => api.get('/feedback'),
  submit: (data) => api.post('/feedback', data),
  getAdminStats: () => api.get('/feedback/admin/stats'),
  getAdminAll: (params) => api.get('/feedback/admin/all', { params }),
  getPolls: () => api.get('/feedback/polls'),
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

// ─── GateVault API ──────────────────────────────────────────
export const gateVaultService = {
  getMonthlySet: () => api.get('/gate-vault/monthly-set'),
  getProgress: () => api.get('/gate-vault/progress'),
  startSession: (selectedSubjects) => api.post('/gate-vault/start', { selectedSubjects }),
  submitAnswer: (data) => api.post('/gate-vault/answer', data),
  getStats: () => api.get('/gate-vault/stats'),
};
