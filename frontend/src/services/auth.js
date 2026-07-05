// services/auth.js
import api from './api';
import { tokenManager } from '../utils/tokenManager';

export const authService = {
  async login(credentials, recaptchaToken) {
    try {
      if (!recaptchaToken) {
        return {
          success: false,
          message: 'Token captcha tidak valid, silakan coba lagi',
        };
      }

      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        'g-recaptcha-response': recaptchaToken,
      });
      
      if (response.data?.success) {
        const { access_token, user, expires_in } = response.data.data || {};
        
        if (!access_token || !user) {
          return {
            success: false,
            message: 'Response data tidak lengkap dari server',
          };
        }
        
        tokenManager.setToken(access_token, expires_in);
        tokenManager.setUser(user);
        
        return { 
          success: true, 
          user,
          message: response.data.message || 'Login berhasil' 
        };
      }
      
      return { 
        success: false, 
        message: response.data?.message || 'Login gagal' 
      };
      
    } catch (error) {
      return this.handleLoginError(error);
    }
  },

  handleLoginError(error) {
    if (!error.response) {
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi Internet Anda.',
      };
    }

    const { status, data } = error.response;
    const message = data?.message;

    const errorMap = {
      400: { message: message || 'Data yang dikirim tidak valid' },
      401: { message: message || 'Email atau password salah' },
      403: { 
        message: message?.toLowerCase().includes('ip') 
          ? message || 'IP Address Anda diblokir sementara.'
          : message || 'Akun tidak dapat login' 
      },
      422: { 
        message: this.handleValidationError(data, message) 
      },
      429: { message: message || 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
    };

    const errorResponse = errorMap[status] || {
      message: message || 'Login gagal, silakan coba lagi',
    };

    return {
      success: false,
      message: errorResponse.message,
    };
  },

  handleValidationError(data, defaultMessage) {
    if (data?.message?.toLowerCase().includes('captcha')) {
      return 'Captcha tidak valid. Silakan coba lagi.';
    }
    
    const errors = data?.errors;
    if (errors && typeof errors === 'object') {
      const firstError = Object.values(errors)[0];
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0];
      }
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
    
    return defaultMessage || 'Validasi gagal';
  },

  async getCurrentUser() {
    try {
      if (!tokenManager.isValid()) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          tokenManager.clear();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return null;
        }
      }
      
      const response = await api.get('/auth/me');
      if (response.data?.success) {
        const userData = response.data.data;
        if (userData) {
          tokenManager.setUser(userData);
        }
        return userData;
      }
      return null;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        tokenManager.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return null;
    }
  },

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.data?.success) {
        const { access_token, expires_in } = response.data.data || {};
        
        if (access_token) {
          tokenManager.setToken(access_token, expires_in);
          if (response.data.data?.user) {
            tokenManager.setUser(response.data.data.user);
          }
          return true;
        }
      }
      
      return false;
    } catch {
      tokenManager.clear();
      return false;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silent fail, still clear frontend
    } finally {
      this.clearAllCache();
    }
  },

  clearAllCache() {
    try {
      tokenManager.clear();
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });

      // Clear React Query cache
      if (typeof window !== 'undefined' && window.queryClient) {
        window.queryClient.clear();
        window.queryClient.invalidateQueries();
        window.queryClient.removeQueries();
      }

      // Clear Cache API
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }

      // Clear IndexedDB
      if ('indexedDB' in window && indexedDB.databases) {
        indexedDB.databases().then((dbs) => {
          dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
        });
      }
    } catch {
      // Silent fail
    }
  },

  isAuthenticated() {
    return tokenManager.isValid() && !!tokenManager.getUser();
  },

  getUser() {
    return tokenManager.getUser();
  },

  getToken() {
    return tokenManager.getToken();
  },

  updateUser(userData) {
    const currentUser = this.getUser();
    if (!currentUser) return null;
    
    const updatedUser = { ...currentUser, ...userData };
    tokenManager.setUser(updatedUser);
    return updatedUser;
  },
};

export default authService;