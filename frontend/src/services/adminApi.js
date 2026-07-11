import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const isInvalidToken = error.response?.status === 401 && (
      error.response?.data?.message?.toLowerCase().includes('invalid token') ||
      error.response?.data?.message?.toLowerCase().includes('token expired') ||
      error.response?.data?.code === 'TOKEN_EXPIRED'
    );
    if (isInvalidToken || error.response?.status === 401) {
      if (error.config?.url?.includes('/auth/login')) return Promise.reject(error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/admin/login') {
        window.dispatchEvent(new CustomEvent('admin:expired'));
      }
    }
    return Promise.reject(error);
  }
);

export const adminAuthService = {
  login: (email, password) => adminApi.post('/admin/auth/login', { email, password }),
  me: () => adminApi.get('/admin/auth/me'),
};

export const adminPdfService = {
  getAll: (params) => adminApi.get('/admin/pdfs', { params }),
  upload: (formData, onProgress) =>
    adminApi.post('/admin/pdfs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  update: (id, data) => adminApi.put(`/admin/pdfs/${id}`, data),
  replaceFile: (id, formData, onProgress) =>
    adminApi.put(`/admin/pdfs/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  delete: (id) => adminApi.delete(`/admin/pdfs/${id}`),
  togglePublish: (id, isPublished) =>
    adminApi.patch(`/admin/pdfs/${id}/publish`, { isPublished }),
};

export const adminMockTestService = {
  getAll: (params) => adminApi.get('/admin/mock-tests', { params }),
  create: (data) => adminApi.post('/admin/mock-tests', data),
  update: (id, data) => adminApi.put(`/admin/mock-tests/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/mock-tests/${id}`),
  toggle: (id, isActive) => adminApi.patch(`/admin/mock-tests/${id}/toggle`, { isActive }),
  getQuestions: (testId) => adminApi.get(`/admin/mock-tests/${testId}/questions`),
  getAllQuestions: (params) => adminApi.get('/admin/mock-tests/mock-questions', { params }),
  createQuestion: (data) => adminApi.post('/admin/mock-tests/mock-questions', data),
  updateQuestion: (id, data) => adminApi.put(`/admin/mock-tests/mock-questions/${id}`, data),
  deleteQuestion: (id) => adminApi.delete(`/admin/mock-tests/mock-questions/${id}`),
};

export const adminPyqService = {
  getAll: (params) => adminApi.get('/admin/pyq', { params }),
  getStats: () => adminApi.get('/admin/pyq/stats'),
  getOne: (id) => adminApi.get(`/admin/pyq/${id}`),
  create: (data) => adminApi.post('/admin/pyq', data),
  update: (id, data) => adminApi.put(`/admin/pyq/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/pyq/${id}`),
  toggle: (id, isActive) => adminApi.patch(`/admin/pyq/${id}/toggle`, { isActive }),
  bulkImport: (questions) => adminApi.post('/admin/pyq/import', { questions }),
  uploadPdf: (formData, onProgress) => adminApi.post('/admin/pyq/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
    timeout: 120000,
  }),
  saveExtracted: (questions) => adminApi.post('/admin/pyq/save-extracted', { questions }),
};

export const adminFlashcardService = {
  getAll: (params) => adminApi.get('/admin/gate-vault/flashcards', { params }),
  create: (data) => adminApi.post('/admin/gate-vault/flashcards', data),
  update: (id, data) => adminApi.put(`/admin/gate-vault/flashcards/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/gate-vault/flashcards/${id}`),
  bulkImport: (cards) => adminApi.post('/admin/gate-vault/flashcards/bulk', { cards }),
  upload: (formData, onProgress) =>
    adminApi.post('/admin/gate-vault/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  replaceFile: (id, formData, onProgress) =>
    adminApi.put(`/admin/gate-vault/upload/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  togglePublish: (id, isPublished) =>
    adminApi.patch(`/admin/gate-vault/flashcards/${id}/publish`, { isPublished }),
  importCsv: (csv) => adminApi.post('/admin/gate-vault/flashcards/import/csv', { csv }),
  importJson: (data) => adminApi.post('/admin/gate-vault/flashcards/import/json', { data }),
  bulkDelete: (ids) => adminApi.post('/admin/gate-vault/flashcards/bulk/delete', { ids }),
  bulkPublish: (ids, isPublished) => adminApi.post('/admin/gate-vault/flashcards/bulk/publish', { ids, isPublished }),
  getMonthlySets: () => adminApi.get('/admin/gate-vault/monthly-sets'),
  createMonthlySet: (data) => adminApi.post('/admin/gate-vault/monthly-sets', data),
  publishMonthlySet: (id) => adminApi.post(`/admin/gate-vault/monthly-sets/${id}/publish`),
  deleteMonthlySet: (id) => adminApi.delete(`/admin/gate-vault/monthly-sets/${id}`),
};

// ΓöÇΓöÇΓöÇ CMS Management ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function createCmsService(basePath) {
  return {
    list: (params) => adminApi.get(`/admin/cms/${basePath}`, { params }),
    get: (id) => adminApi.get(`/admin/cms/${basePath}/${id}`),
    create: (data) => adminApi.post(`/admin/cms/${basePath}`, data),
    update: (id, data) => adminApi.put(`/admin/cms/${basePath}/${id}`, data),
    delete: (id) => adminApi.delete(`/admin/cms/${basePath}/${id}`),
    togglePublish: (id, isPublished) => adminApi.patch(`/admin/cms/${basePath}/${id}/publish`, { isPublished }),
    bulkDelete: (ids) => adminApi.post(`/admin/cms/${basePath}/bulk/delete`, { ids }),
    bulkPublish: (ids, isPublished) => adminApi.post(`/admin/cms/${basePath}/bulk/publish`, { ids, isPublished }),
  };
}

export const cmsService = {
  insights: createCmsService('insights'),
  challenges: createCmsService('challenges'),
  motivation: createCmsService('motivation'),
  featuredResources: createCmsService('featured-resources'),
  featuredContent: createCmsService('featured-content'),
  announcements: createCmsService('announcements'),
  getStats: () => adminApi.get('/admin/cms/stats'),
};

// ΓöÇΓöÇΓöÇ Question Bank Management ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const questionBankService = {
  list: (params) => adminApi.get('/admin/question-bank', { params }),
  stats: () => adminApi.get('/admin/question-bank/stats'),
  grouped: (params) => adminApi.get('/admin/question-bank/grouped', { params }),
  duplicates: () => adminApi.get('/admin/question-bank/duplicates'),
  create: (data) => adminApi.post('/admin/question-bank', data),
  update: (id, data) => adminApi.put(`/admin/question-bank/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/question-bank/${id}`),
  importJson: (questions) => adminApi.post('/admin/question-bank/import/json', { questions }),
  importCsv: (csv) => adminApi.post('/admin/question-bank/import/csv', { csv }),
  bulkDelete: (ids) => adminApi.post('/admin/question-bank/bulk/delete', { ids }),
  bulkSubject: (ids, subject) => adminApi.post('/admin/question-bank/bulk/subject', { ids, subject }),
  bulkDifficulty: (ids, difficulty) => adminApi.post('/admin/question-bank/bulk/difficulty', { ids, difficulty }),
};

// ΓöÇΓöÇΓöÇ Notification Center ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const adminNotificationService = {
  getStats: () => adminApi.get('/admin/notifications/stats'),
  list: (params) => adminApi.get('/admin/notifications', { params }),
  getOne: (id) => adminApi.get(`/admin/notifications/${id}`),
  create: (data) => adminApi.post('/admin/notifications', data),
  update: (id, data) => adminApi.put(`/admin/notifications/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/notifications/${id}`),
  send: (id) => adminApi.post(`/admin/notifications/${id}/send`),
  schedule: (id, scheduledAt) => adminApi.post(`/admin/notifications/${id}/schedule`, { scheduledAt }),
  getAnalytics: (period) => adminApi.get('/admin/notifications/analytics/overview', { params: { period } }),
};

// ΓöÇΓöÇΓöÇ Feedback Center ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const adminFeedbackService = {
  getStats: () => adminApi.get('/admin/feedback/stats'),
  list: (params) => adminApi.get('/admin/feedback', { params }),
  getOne: (id) => adminApi.get(`/admin/feedback/${id}`),
  update: (id, data) => adminApi.put(`/admin/feedback/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/feedback/${id}`),
  reply: (id, message) => adminApi.post(`/admin/feedback/${id}/reply`, { message }),
  getAnalytics: () => adminApi.get('/admin/feedback/analytics/overview'),
  listRequests: () => adminApi.get('/admin/feedback/requests/all'),
  createRequest: (data) => adminApi.post('/admin/feedback/requests', data),
  updateRequest: (id, data) => adminApi.put(`/admin/feedback/requests/${id}`, data),
  deleteRequest: (id) => adminApi.delete(`/admin/feedback/requests/${id}`),
};

const datasetCrud = (base, modelName) => ({
  list: (params) => adminApi.get(`/admin/predictor/${base}`, { params }),
  get: (id) => adminApi.get(`/admin/predictor/${base}/${id}`),
  create: (data) => adminApi.post(`/admin/predictor/${base}`, data),
  update: (id, data) => adminApi.put(`/admin/predictor/${base}/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/predictor/${base}/${id}`),
  importBulk: (data) => adminApi.post(`/admin/predictor/${base}/import`, { data }),
});

export const adminPredictorService = {
  // Stats + bulk import
  getStats: () => adminApi.get('/admin/predictor/stats'),
  getDatasetCounts: () => adminApi.get('/admin/predictor/dataset-counts'),
  getAccuracy: () => adminApi.get('/admin/predictor/accuracy'),
  getFeedback: (params) => adminApi.get('/admin/predictor/feedback', { params }),

  // Smart Import
  importSmart: (data, type, year, paper) => adminApi.post('/admin/predictor/import', { data, type, year, paper }),
  previewImport: (data, type) => adminApi.post('/admin/predictor/import/preview', { data, type }),

  // Danger zone
  clearDataset: (type) => adminApi.delete(`/admin/predictor/clear/${type}`),

  // Legacy endpoints (keep for backward compat)
  getYears: () => adminApi.get('/admin/predictor/years'),
  createYear: (data) => adminApi.post('/admin/predictor/years', data),
  updateYear: (id, data) => adminApi.put(`/admin/predictor/years/${id}`, data),
  deleteYear: (id) => adminApi.delete(`/admin/predictor/years/${id}`),
  getCutoffs: (params) => adminApi.get('/admin/predictor/cutoffs', { params }),
  createCutoff: (data) => adminApi.post('/admin/predictor/cutoffs', data),
  updateCutoff: (id, data) => adminApi.put(`/admin/predictor/cutoffs/${id}`, data),
  deleteCutoff: (id) => adminApi.delete(`/admin/predictor/cutoffs/${id}`),
  importCutoffs: (cutoffs) => adminApi.post('/admin/predictor/cutoffs/import', { cutoffs }),
  getRankData: (params) => adminApi.get('/admin/predictor/rank-data', { params }),
  createRankData: (data) => adminApi.post('/admin/predictor/rank-data', data),
  importRankData: (data) => adminApi.post('/admin/predictor/rank-data/import', { data }),
  deleteRankData: (id) => adminApi.delete(`/admin/predictor/rank-data/${id}`),
  getScoreData: (params) => adminApi.get('/admin/predictor/score-data', { params }),
  createScoreData: (data) => adminApi.post('/admin/predictor/score-data', data),
  importScoreData: (data) => adminApi.post('/admin/predictor/score-data/import', { data }),
  deleteScoreData: (id) => adminApi.delete(`/admin/predictor/score-data/${id}`),
  getColleges: (params) => adminApi.get('/admin/predictor/colleges', { params }),
  createCollege: (data) => adminApi.post('/admin/predictor/colleges', data),
  updateCollege: (id, data) => adminApi.put(`/admin/predictor/colleges/${id}`, data),
  deleteCollege: (id) => adminApi.delete(`/admin/predictor/colleges/${id}`),
  importColleges: (colleges) => adminApi.post('/admin/predictor/colleges/import', { colleges }),
  getCollegeCutoffs: (params) => adminApi.get('/admin/predictor/college-cutoffs', { params }),
  createCollegeCutoff: (data) => adminApi.post('/admin/predictor/college-cutoffs', data),
  updateCollegeCutoff: (id, data) => adminApi.put(`/admin/predictor/college-cutoffs/${id}`, data),
  deleteCollegeCutoff: (id) => adminApi.delete(`/admin/predictor/college-cutoffs/${id}`),
  importCollegeCutoffs: (cutoffs) => adminApi.post('/admin/predictor/college-cutoffs/import', { cutoffs }),
  getPsus: (params) => adminApi.get('/admin/predictor/psus', { params }),
  createPsu: (data) => adminApi.post('/admin/predictor/psus', data),
  updatePsu: (id, data) => adminApi.put(`/admin/predictor/psus/${id}`, data),
  deletePsu: (id) => adminApi.delete(`/admin/predictor/psus/${id}`),
  importPsus: (psus) => adminApi.post('/admin/predictor/psus/import', { psus }),

  // NEW dataset endpoints
  marksScore: datasetCrud('marks-score', 'GateMarksScore'),
  scoreRank: datasetCrud('score-rank', 'GateScoreRank'),
  rankPercentile: datasetCrud('rank-percentile', 'GateRankPercentile'),
  gateStatistics: datasetCrud('gate-statistics', 'GateStatistics'),
  ccmt: datasetCrud('ccmt', 'CcmtCutoff'),
  coap: datasetCrud('coap', 'CoapCutoff'),
  seatMatrix: datasetCrud('seat-matrix', 'SeatMatrix'),
  branchStats: datasetCrud('branch-stats', 'BranchStatistics'),
  psuRecruitment: datasetCrud('psu-recruitment', 'PsuRecruitment'),
};

export default adminApi;
