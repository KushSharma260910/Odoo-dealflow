import api from './api';

export const discountService = {
  listRules: () => api.get('/discounts/rules'),
  createRule: (data) => api.post('/discounts/rules', data),
  updateRule: (id, data) => api.put(`/discounts/rules/${id}`, data),
  evaluate: (quotationId) => api.post(`/discounts/evaluate/${quotationId}`),
};
