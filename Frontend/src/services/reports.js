import apiClient from './api/client';

export const reportsService = {
  getReports: async (params = {}) => {
    const res = await apiClient.get('/reports', { params });
    return {
      reports: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  getReportById: async (id) => {
    const res = await apiClient.get(`/reports/${id}`);
    return res.data;
  },

  getReportDetail: async (id) => {
    const res = await apiClient.get(`/reports/${id}/detail`);
    return res.data;
  },

  createReport: async (reportData) => {
    const res = await apiClient.post('/reports', reportData);
    return res.data;
  },

  uploadReport: async (formData) => {
    const res = await apiClient.post('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteReport: async (id) => {
    const res = await apiClient.delete(`/reports/${id}`);
    return res.data;
  },

  triggerAnalysis: async (id) => {
    const res = await apiClient.post(`/reports/${id}/analyze`);
    return res.data;
  },

  reanalyzeReport: async (id, options = {}) => {
    const res = await apiClient.post(`/reports/${id}/reanalyze`, options);
    return res.data;
  },

  submitReview: async (id, reviewData) => {
    const res = await apiClient.post(`/reports/${id}/review`, reviewData);
    return res.data;
  },

  getAuditTrail: async (id) => {
    const res = await apiClient.get(`/reports/${id}/audit-trail`);
    return res.data;
  },

  getSimilarReports: async (id) => {
    const res = await apiClient.get(`/reports/${id}/similar`);
    return res.data;
  },
};

export default reportsService;
