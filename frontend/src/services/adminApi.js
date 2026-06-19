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
        window.location.href = '/admin/login';
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
  getAllQuestions: (params) => adminApi.get('/admin/mock-questions', { params }),
  createQuestion: (data) => adminApi.post('/admin/mock-questions', data),
  updateQuestion: (id, data) => adminApi.put(`/admin/mock-questions/${id}`, data),
  deleteQuestion: (id) => adminApi.delete(`/admin/mock-questions/${id}`),
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
  getMonthlySets: () => adminApi.get('/admin/gate-vault/monthly-sets'),
  createMonthlySet: (data) => adminApi.post('/admin/gate-vault/monthly-sets', data),
  publishMonthlySet: (id) => adminApi.post(`/admin/gate-vault/monthly-sets/${id}/publish`),
  deleteMonthlySet: (id) => adminApi.delete(`/admin/gate-vault/monthly-sets/${id}`),
};

// ─── CMS Management ─────────────────────────────────────────
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

// ─── Question Bank Management ───────────────────────────────
export const questionBankService = {
  list: (params) => adminApi.get('/admin/question-bank', { params }),
  stats: () => adminApi.get('/admin/question-bank/stats'),
  create: (data) => adminApi.post('/admin/question-bank', data),
  update: (id, data) => adminApi.put(`/admin/question-bank/${id}`, data),
  delete: (id) => adminApi.delete(`/admin/question-bank/${id}`),
  importJson: (questions) => adminApi.post('/admin/question-bank/import/json', { questions }),
  importCsv: (csv) => adminApi.post('/admin/question-bank/import/csv', { csv }),
};

export default adminApi;
