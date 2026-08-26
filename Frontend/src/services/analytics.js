import apiClient from './api/client';

export const analyticsService = {
  getDashboard: async () => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  },

  getKpis: async () => {
    const res = await apiClient.get('/analytics/kpis');
    return res.data;
  },

  getSiteBreakdown: async () => {
    const res = await apiClient.get('/analytics/by-site');
    return res.data;
  },

  getPrecursorBreakdown: async () => {
    const res = await apiClient.get('/analytics/by-precursor');
    return res.data;
  },

  getTrends: async () => {
    const res = await apiClient.get('/analytics/trends');
    return res.data;
  },

  getBarrierHealth: async () => {
    const res = await apiClient.get('/analytics/barriers');
    return res.data;
  },
};

export default analyticsService;
