import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — global error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error?.response?.data?.message || 'Something went wrong';
    console.error('[API Error]', message);
    return Promise.reject(error);
  },
);

export default apiClient;
