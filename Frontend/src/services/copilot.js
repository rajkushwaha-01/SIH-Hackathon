import apiClient from './api/client';

const copilotService = {
  createSession: async (data = {}) => {
    return apiClient.post('/copilot/sessions', data);
  },

  getSessions: async () => {
    return apiClient.get('/copilot/sessions');
  },

  getSessionById: async (sessionId) => {
    return apiClient.get(`/copilot/sessions/${sessionId}`);
  },

  deleteSession: async (sessionId) => {
    return apiClient.delete(`/copilot/sessions/${sessionId}`);
  },

  chat: async (payload) => {
    return apiClient.post('/copilot/chat', payload);
  },
};

export default copilotService;