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
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
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

export default adminApi;
