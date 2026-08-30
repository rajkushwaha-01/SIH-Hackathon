import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sih_auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Log sanitized error details without leaking request payloads or credentials
    if (error.response) {
      console.error('API ERROR:', {
        url: error.config?.url,
        status: error.response?.status,
        code: error.response?.data?.error?.code,
      });
    } else {
      console.error('NETWORK/SERVER ERROR:', error.message);
    }

    const backendError = error.response?.data?.error;
    const statusCode = error.response?.status || 500;
    const code = backendError?.code || error.response?.data?.code || 'UNKNOWN_ERROR';

    let friendlyMessage = backendError?.message || error.response?.data?.message;

    if (!error.response) {
      friendlyMessage = 'Unable to connect to the authentication service. Please check your network.';
    } else if (statusCode === 401) {
      friendlyMessage = friendlyMessage || 'Invalid email or password.';
    } else if (statusCode === 403) {
      friendlyMessage = friendlyMessage || 'Your account has been deactivated. Please contact an administrator.';
    } else if (statusCode === 409) {
      friendlyMessage = friendlyMessage || 'An account with this email already exists.';
    } else if (statusCode === 400) {
      friendlyMessage = friendlyMessage || 'Please check the highlighted fields and try again.';
    } else if (statusCode >= 500) {
      friendlyMessage = 'Something went wrong. Please try again later.';
    } else {
      friendlyMessage = friendlyMessage || 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject({
      message: friendlyMessage,
      statusCode,
      code,
      details: backendError?.details || null,
      raw: error,
    });
  }  
);

export default apiClient;