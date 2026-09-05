import api from './api';

export const customerPortalService = {
  quotations: () => api.get('/customer/quotations'),
  quotation: (id) => api.get(`/customer/quotations/${id}`),
  negotiations: (id) => api.get(`/customer/negotiations/${id}`),
  message: (id, message) => api.post(`/customer/negotiations/${id}/message`, { message }),
  accept: (id) => api.post(`/customer/quotations/${id}/accept`),
  reject: (id) => api.post(`/customer/quotations/${id}/reject`),
  createRequest: (id, data) => api.post(`/customer/quotations/${id}/requests`, data),
  requests: (id) => api.get(`/customer/quotations/${id}/requests`),
  invoices: () => api.get('/customer/invoices'),
  invoice: (id) => api.get(`/customer/invoices/${id}`),
  billing: (quotationId) => api.get(`/customer/billing/${quotationId}`),
};
