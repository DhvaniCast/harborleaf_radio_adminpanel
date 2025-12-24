import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://100.31.177.152/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('🔧 [API] Raw Response:', response);
    console.log('🔧 [API] Response.data:', response.data);
    return response.data;
  },
  (error) => {
    console.error('❌ [API] Error Response:', error.response);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
