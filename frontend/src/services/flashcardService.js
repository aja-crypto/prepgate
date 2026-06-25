// src/services/flashcardService.js
import axios from 'axios';

const API_URL = '/api/flashcards';

const flashcardApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

flashcardApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const flashcardService = {
  // Get user's flashcards
  getFlashcards: async (params = {}) => {
    const res = await flashcardApi.get('/', { params });
    return res;
  },

  // Get flashcard bank (all available cards)
  getFlashcardBank: async (params = {}) => {
    const res = await flashcardApi.get('/bank', { params });
    return res;
  },

  // Get review queue (due cards)
  getReviewQueue: async (limit = 10) => {
    const res = await flashcardApi.get('/review/queue', { params: { limit } });
    return res;
  },

  // Get user's flashcard stats
  getStats: async () => {
    const res = await flashcardApi.get('/stats');
    return res;
  },

  // Add flashcard to user's deck
  addFlashcard: async (flashcardId, source = 'weak_topic', tags = '', personalNotes = '') => {
    const res = await flashcardApi.post('/', { flashcardId, source, tags, personalNotes });
    return res;
  },

  // Submit review for flashcard
  submitReview: async (flashcardId, qualityOfResponse, reviewTime = 0, note = '') => {
    const res = await flashcardApi.post(`/${flashcardId}/review`, { qualityOfResponse, reviewTime, note });
    return res;
  },

  // Remove flashcard from user's deck
  removeFlashcard: async (flashcardId) => {
    const res = await flashcardApi.delete(`/${flashcardId}`);
    return res;
  },

  // Update user flashcard (notes, tags)
  updateFlashcard: async (flashcardId, data) => {
    const res = await flashcardApi.put(`/${flashcardId}`, data);
    return res;
  },
};

export default flashcardService;