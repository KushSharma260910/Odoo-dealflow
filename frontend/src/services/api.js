import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dealflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    if (error.response?.status === 401) {
      // Clear token if unauthorized on a protected resource
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('dealflow_token');
        localStorage.removeItem('dealflow_user');
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
