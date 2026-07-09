// src/features/products/services/productService.js
import apiClient from '../../../services/apiClient';
import { ENDPOINTS } from '../../../services/endpoints';

export const productService = {
  getNewArrivals:      () => apiClient.get(ENDPOINTS.NEW_ARRIVALS),
  getSneakers:         () => apiClient.get(ENDPOINTS.SNEAKERS),
  getSandal:           () => apiClient.get(ENDPOINTS.SANDAL),
  getApparel:          () => apiClient.get(ENDPOINTS.APPAREL),
  getAccessories:      () => apiClient.get(ENDPOINTS.ACCESSORIES),

  getLatestProducts:   () => apiClient.get(ENDPOINTS.LATEST_PRODUCTS),
  getBelts:            () => apiClient.get(ENDPOINTS.BELTS),
  getCaps:             () => apiClient.get(ENDPOINTS.CAPS),

  // API pattern: /api/product/{slug}-{id}
  // e.g. /api/product/mans-panjabi-48
  getProductBySlug:    (slug) => apiClient.get(ENDPOINTS.PRODUCT_DETAIL(slug)),
};