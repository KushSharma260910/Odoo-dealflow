import api from './api';

export const negotiationService = {
  list: () => api.get('/negotiations'),
  get: (id) => api.get(`/negotiations/${id}`),
  addMessage: (id, message) => api.post(`/negotiations/${id}/message`, { message }),
  respond: (id, data) => api.post(`/negotiations/${id}/respond`, data),
};
