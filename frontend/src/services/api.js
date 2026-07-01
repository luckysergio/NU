// src/services/api.js
import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue = [];
let isLoggingOut = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = (message = 'Sesi berakhir, silakan login kembali') => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  
  tokenManager.clear();
  
  if (!window.location.pathname.includes('/login')) {
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }
  
  setTimeout(() => {
    isLoggingOut = false;
  }, 500);
};

api.interceptors.request.use(
  (config) => {
    if (isLoggingOut) return config;
    
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
      return config;
    }
    
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const skipUrls = ['/auth/login', '/auth/refresh', '/auth/logout'];
      if (skipUrls.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }

      if (isLoggingOut) {
        return Promise.reject(error);
      }

      if (!tokenManager.isValid()) {
        clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        
        if (response.data?.success) {
          const { access_token, expires_in } = response.data.data || {};
          
          if (access_token) {
            tokenManager.setToken(access_token, expires_in);
            processQueue(null, access_token);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
        throw new Error('Refresh token failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Anda tidak memiliki akses';
      if (message.toLowerCase().includes('ip')) {
        // Toast akan ditangani di komponen
      } else if (message.toLowerCase().includes('akun') || message.toLowerCase().includes('account')) {
        clearAuthAndRedirect(message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;