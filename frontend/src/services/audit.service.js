import api from './api';

export const auditService = {
  list: (params) => api.get('/audit', { params }),
  get: (id) => api.get(`/audit/${id}`),
};
