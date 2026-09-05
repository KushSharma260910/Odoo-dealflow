import api from './api';

export const billingService = {
  calculate: (quotationId) => api.post('/billing/calculate', { quotation_id: quotationId }),
  generate: (orderId, data) => api.post('/billing/generate', { order_id: orderId, ...data }),
  byQuotation: (quotationId) => api.get(`/billing/${quotationId}`),
};
