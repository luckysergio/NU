import api from './api';

export const authService = {
  async login(credentials, recaptchaToken) {
    try {
      if (!recaptchaToken) {
        return {
          success: false,
          message: 'Token captcha tidak valid, silakan coba lagi',
        };
      }

      const loginData = {
        email: credentials.email,
        password: credentials.password,
        'g-recaptcha-response': recaptchaToken,
      };

      const response = await api.post('/auth/login', loginData);
      
      if (response.data && response.data.success) {
        const { access_token, user, expires_in } = response.data.data || {};
        
        if (!access_token || !user) {
          return {
            success: false,
            message: 'Response data tidak lengkap dari server',
          };
        }
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600));
        localStorage.setItem('expires_at', expiresAt.toISOString());
        
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
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.message;
        
        if (status === 400) {
          return {
            success: false,
            message: message || 'Data yang dikirim tidak valid',
          };
        }
        
        if (status === 401) {
          return {
            success: false,
            message: message || 'Email atau password salah',
          };
        }
        
        if (status === 403) {
          if (message?.toLowerCase().includes('ip')) {
            return {
              success: false,
              message: message || 'IP Address Anda diblokir sementara. Silakan coba lagi nanti.',
            };
          }
          return {
            success: false,
            message: message || 'Akun tidak dapat login',
          };
        }
        
        if (status === 422) {
          if (message?.toLowerCase().includes('captcha') || message?.toLowerCase().includes('recaptcha')) {
            return {
              success: false,
              message: 'Captcha tidak valid. Silakan coba lagi.',
            };
          }
          
          const errors = data?.errors;
          if (errors && typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            if (firstError && Array.isArray(firstError) && firstError[0]) {
              return {
                success: false,
                message: firstError[0],
              };
            }
            if (typeof firstError === 'string') {
              return {
                success: false,
                message: firstError,
              };
            }
          }
          
          return {
            success: false,
            message: message || 'Validasi gagal',
          };
        }
        
        if (status === 429) {
          return {
            success: false,
            message: message || 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
          };
        }
        
        if (status >= 500) {
          return {
            success: false,
            message: message || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
          };
        }
        
        return {
          success: false,
          message: message || 'Login gagal, silakan coba lagi',
        };
        
      } else if (error.request) {
        return {
          success: false,
          message: 'Tidak dapat terhubung ke server. Periksa koneksi Internet Anda.',
        };
        
      } else {
        return {
          success: false,
          message: error.message || 'Terjadi kesalahan, silakan coba lagi',
        };
      }
    }
  },

  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }
      
      const response = await api.get('/auth/me');
      if (response.data && response.data.success) {
        const userData = response.data.data;
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return userData;
      }
      return null;
    } catch (error) {
      if (error.response?.status === 401) {
        this.clearAuthData();
      }
      
      if (error.response?.status === 403) {
        this.clearAuthData();
        const message = error.response?.data?.message || 'Akun Anda telah diblokir';
        return { error: true, message };
      }
      
      return null;
    }
  },

  async refreshToken() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }
    
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.data && response.data.success) {
        const { access_token, expires_in } = response.data.data || {};
        
        if (access_token) {
          localStorage.setItem('access_token', access_token);
          
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600));
          localStorage.setItem('expires_at', expiresAt.toISOString());
          
          if (response.data.data?.user) {
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.clearAuthData();
      }
      
      return false;
    }
  },

  async logout() {
    const token = localStorage.getItem('access_token');
    
    try {
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      // Abaikan error, tetap lanjutkan proses logout
    } finally {
      this.clearAuthData();
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('expires_at');
    const user = localStorage.getItem('user');
    
    if (!token || !expiresAt || !user) {
      return false;
    }
    
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      
      if (isNaN(expiry.getTime())) {
        return false;
      }
      
      const isValid = now < expiry;
      
      if (isValid) {
        const timeUntilExpiry = expiry.getTime() - now.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          this.refreshToken().catch(() => {});
        }
      }
      
      return isValid;
    } catch (error) {
      return false;
    }
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  updateUser(userData) {
    try {
      const currentUser = this.getUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      return null;
    }
  },

  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
  },
};

export default authService;