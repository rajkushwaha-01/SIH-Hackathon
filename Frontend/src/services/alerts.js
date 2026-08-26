import apiClient from './api/client';

export const alertsService = {
  getAlerts: async (params = {}) => {
    const res = await apiClient.get('/alerts', { params });
    return res.data;
  },

  getStats: async () => {
    const res = await apiClient.get('/alerts/stats');
    return res.data;
  },

  getAlertById: async (id) => {
    const res = await apiClient.get(`/alerts/${id}`);
    return res.data;
  },

  acknowledgeAlert: async (id) => {
    const res = await apiClient.patch(`/alerts/${id}/acknowledge`);
    return res.data;
  },

  resolveAlert: async (id, resolutionNotes) => {
    const res = await apiClient.patch(`/alerts/${id}/resolve`, { resolutionNotes });
    return res.data;
  },

  dismissAlert: async (id, reason) => {
    const res = await apiClient.patch(`/alerts/${id}/dismiss`, { reason });
    return res.data;
  },
};

export default alertsService;
