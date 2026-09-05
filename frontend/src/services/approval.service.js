import api from './api';

export const approvalService = {
  list: (params) => api.get('/approvals', { params }),
  get: (id) => api.get(`/approvals/${id}`),
  approve: (id, reason) => api.post(`/approvals/${id}/approve`, { reason }),
  reject: (id, reason) => api.post(`/approvals/${id}/reject`, { reason }),
  listRules: () => api.get('/approvals/rules'),
  createRule: (data) => api.post('/approvals/rules', data),
};
