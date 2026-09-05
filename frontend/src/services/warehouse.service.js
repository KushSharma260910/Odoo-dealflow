import api from './api';

export const warehouseService = {
  list: () => api.get('/warehouses'),
  get: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  stock: (id) => api.get(`/warehouses/${id}/stock`),
  updateStock: (id, data) => api.put(`/warehouses/${id}/stock`, data),
  allocate: (orderId, items) => api.post('/warehouses/allocate', { order_id: orderId, items }),
  createOrder: (quotationId) => api.post('/orders', { quotation_id: quotationId }),
  listOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  fulfill: (id, data) => api.post(`/orders/${id}/fulfill`, data),
  fulfillmentStatus: (id) => api.get(`/orders/${id}/fulfillment`),
};
