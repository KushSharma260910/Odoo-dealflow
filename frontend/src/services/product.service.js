import api from './api';

export const productService = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  bulkImport: (items) => api.post('/products/import', { items }),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  getRecommendations: (id) => api.get(`/products/${id}/recommendations`),
};
