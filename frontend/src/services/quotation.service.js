import api from './api';

export const quotationService = {
  list: () => api.get('/quotations'),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  addItem: (id, data) => api.post(`/quotations/${id}/items`, data),
  updateItem: (id, itemId, data) => api.put(`/quotations/${id}/items/${itemId}`, data),
  removeItem: (id, itemId) => api.delete(`/quotations/${id}/items/${itemId}`),
  submit: (id) => api.post(`/quotations/${id}/submit`),
  getRisk: (id) => api.get(`/quotations/${id}/risk`),
  analyzeRisk: (id) => api.post(`/quotations/${id}/risk/analyze`),
};
