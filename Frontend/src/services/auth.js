import apiClient from './api/client';

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    const { user, token } = response?.data || {};

    if (token) {
      localStorage.setItem('sih_auth_token', token);
    }
    if (user) {
      localStorage.setItem('sih_user', JSON.stringify(user));
    }

    return { user, token };
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    const { user, token } = response?.data || {};

    if (token) {
      localStorage.setItem('sih_auth_token', token);
    }
    if (user) {
      localStorage.setItem('sih_user', JSON.stringify(user));
    }

    return { user, token };
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    const user = response?.data;
    if (user) {
      localStorage.setItem('sih_user', JSON.stringify(user));
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem('sih_auth_token');
    localStorage.removeItem('sih_user');
  },
};

export default authService;

