import apiClient from './api/client';

export const copilotService = {
  createSession: async (data = {}) => {
    const res = await apiClient.post('/copilot/sessions', data);
    return res.data;
  },

  getSessions: async () => {
    const res = await apiClient.get('/copilot/sessions');
    return res.data;
  },

  getSessionById: async (sessionId) => {
    const res = await apiClient.get(`/copilot/sessions/${sessionId}`);
    return res.data;
  },

  deleteSession: async (sessionId) => {
    const res = await apiClient.delete(`/copilot/sessions/${sessionId}`);
    return res.data;
  },

  chat: async (payload) => {
    const res = await apiClient.post('/copilot/chat', payload);
    return res.data;
  },
};

export default copilotService;
