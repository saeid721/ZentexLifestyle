// src/services/endpoints.js
export const ENDPOINTS = {
  // Products
  PRODUCTS:          '/products',

  // product/{slug}-{id}
  PRODUCT_DETAIL:    (slug) => `/product/${slug}`,

  NEW_ARRIVALS:      '/products?tag=new_arrivals&limit=8',
  FEATURED:          '/products?featured=true&limit=8',

  // Categories
  CATEGORIES:        '/categories',
  CATEGORY_PRODUCTS: (slug) => `/categories/${slug}/products`,

  // Collections
  SNEAKERS:          '/products?category=sneakers&limit=8',
  SANDAL:            '/products?category=loafers-and-sandal&limit=8',
  APPAREL:           '/products?category=apparel&limit=8',
  ACCESSORIES:       '/products?category=accessories&limit=8',

  // Cart & Auth
  CART:              '/cart',
  AUTH_LOGIN:        '/auth/login',
  AUTH_REGISTER:     '/auth/register',
  AUTH_ME:           '/auth/me',
};