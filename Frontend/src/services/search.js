import apiClient from './api/client';

export const searchService = {
  semanticSearch: async (payload) => {
    const res = await apiClient.post('/search/semantic', payload);
    return res.data;
  },

  getSimilarReports: async (id, params = {}) => {
    const res = await apiClient.get(`/search/reports/${id}/similar`, { params });
    return res.data;
  },
};

export default searchService;
