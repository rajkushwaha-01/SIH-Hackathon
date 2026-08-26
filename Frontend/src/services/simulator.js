import apiClient from './api/client';

export const simulatorService = {
  simulate: async (data) => {
    const res = await apiClient.post('/simulator/simulate', data);
    return res.data;
  },

  getSimulations: async (params = {}) => {
    const res = await apiClient.get('/simulator', { params });
    return res.data;
  },

  getSimulationById: async (id) => {
    const res = await apiClient.get(`/simulator/${id}`);
    return res.data;
  },

  compareSimulations: async (simulationIds) => {
    const res = await apiClient.post('/simulator/compare', { simulationIds });
    return res.data;
  },
};

export default simulatorService;
