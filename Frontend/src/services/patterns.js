import apiClient from './api/client';

export const patternsService = {
  getPatterns: async (params = {}) => {
    const res = await apiClient.get('/patterns', { params });
    return res.data;
  },

  getPatternById: async (id) => {
    const res = await apiClient.get(`/patterns/${id}`);
    return res.data;
  },

  detectPatterns: async () => {
    const res = await apiClient.post('/patterns/detect');
    return res.data;
  },

  updateStatus: async (id, status, notes) => {
    const res = await apiClient.patch(`/patterns/${id}/status`, { status, notes });
    return res.data;
  },
};

export default patternsService;
