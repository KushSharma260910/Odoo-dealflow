import api from './api';

export const dashboardService = {
  overview: () => api.get('/dashboard/overview'),
  sales: () => api.get('/dashboard/sales'),
  deals: () => api.get('/dashboard/deals'),
  risks: () => api.get('/dashboard/risks'),
  revenue: () => api.get('/dashboard/revenue'),
};
