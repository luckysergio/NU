import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Flag untuk mencegah multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];
// Flag untuk menandai sedang logout
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

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    // Jangan tambahkan token jika sedang logout
    if (isLoggingOut) {
      return config;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper untuk set status logout
export const setLoggingOut = (status) => {
  isLoggingOut = status;
};

// Response interceptor untuk handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh token untuk login endpoint
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }
      
      // Skip refresh token untuk logout endpoint
      if (originalRequest.url?.includes('/auth/logout')) {
        return Promise.reject(error);
      }

      // Jika sedang logout, jangan coba refresh
      if (isLoggingOut) {
        return Promise.reject(error);
      }

      // Jika tidak ada token, redirect ke login
      const token = localStorage.getItem('access_token');
      if (!token) {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Jika sedang refresh, queue request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        
        if (response.data.success) {
          const { access_token, expires_in } = response.data.data;
          
          localStorage.setItem('access_token', access_token);
          
          // Update expiration time
          if (expires_in) {
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
            localStorage.setItem('expires_at', expiresAt.toISOString());
          }
          
          // Process queue
          processQueue(null, access_token);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } else {
          throw new Error(response.data.message || 'Refresh token failed');
        }
      } catch (refreshError) {
        // Refresh failed, clear all auth data
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('expires_at');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
          toast.error('Sesi berakhir, silakan login kembali');
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - Akun tidak dapat login atau IP diblokir
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Anda tidak memiliki akses';
      
      // Cek apakah pesan mengindikasikan IP diblokir
      if (message.toLowerCase().includes('ip')) {
        toast.error(message || 'IP Address Anda diblokir sementara. Silakan coba lagi nanti.');
      } 
      // Cek apakah akun tidak dapat login
      else if (message.toLowerCase().includes('akun') || message.toLowerCase().includes('account')) {
        toast.error(message);
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } 
      // Selain itu, tampilkan error biasa
      else {
        toast.error(message);
      }
      
      return Promise.reject(error);
    }

    // Handle 422 Validation Error (Captcha invalid, etc)
    if (error.response?.status === 422) {
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const message = error.response.data?.message || 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
      toast.error(message);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500 && error.response?.status < 600) {
      const message = error.response.data?.message || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
      toast.error(message);
    }

    // Handle network error
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Koneksi terputus. Periksa koneksi internet Anda.');
    }

    return Promise.reject(error);
  }
);

export default api;