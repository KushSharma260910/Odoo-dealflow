import api from './api';

export const recommendationService = {
  forQuotation: (quotationId) => api.get(`/recommendations/${quotationId}`),
  forProduct: (productId) => api.get(`/products/${productId}/recommendations`),
};
