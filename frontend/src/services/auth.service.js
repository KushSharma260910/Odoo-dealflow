import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('dealflow_token');
    localStorage.removeItem('dealflow_user');
  },
};
