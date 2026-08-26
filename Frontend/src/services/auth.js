import apiClient from './api/client';

export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('sih_auth_token', res.data.token);
      localStorage.setItem('sih_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data?.token) {
      localStorage.setItem('sih_auth_token', res.data.token);
      localStorage.setItem('sih_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('sih_auth_token');
    localStorage.removeItem('sih_user');
  },
};
