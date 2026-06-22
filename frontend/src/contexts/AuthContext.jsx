import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { authService } from "../services/auth";
import { useToast } from "../components/common/ToastContainer";
import api, { setLoggingOut } from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showToast } = useToast();
  const isLoggingOutRef = useRef(false);
  const checkIntervalRef = useRef(null);
  const isRedirectingRef = useRef(false);

  // Define API_URL di dalam komponen
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Function untuk clear auth dan redirect
  const clearAuthAndRedirect = useCallback((message = 'Sesi berakhir, silakan login kembali') => {
    // Cegah multiple redirect
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;

    // Clear semua data auth
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('refresh_token');

    // Set flag logout
    isLoggingOutRef.current = true;
    setLoggingOut(true);

    // Clear state
    setUser(null);
    setIsAuthenticated(false);

    // Tampilkan toast jika ada pesan
    if (message && showToast) {
      showToast(message, "error");
    }

    // Redirect ke login jika tidak sedang di halaman login
    if (!window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }

    // Reset flag setelah redirect
    setTimeout(() => {
      isLoggingOutRef.current = false;
      setLoggingOut(false);
      isRedirectingRef.current = false;
    }, 500);
  }, [showToast]);

  // Function untuk cek token expiry
  const checkTokenExpiry = useCallback(async () => {
    // Jangan cek jika sedang logout atau tidak ada user
    if (isLoggingOutRef.current || !isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('expires_at');

    if (!token || !expiresAt) {
      clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
      return;
    }

    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      
      if (isNaN(expiry.getTime())) {
        clearAuthAndRedirect('Sesi tidak valid, silakan login kembali');
        return;
      }

      const timeUntilExpiry = expiry.getTime() - now.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const oneMinute = 1 * 60 * 1000;

      // Jika sudah expired
      if (timeUntilExpiry <= 0) {
        clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
        return;
      }

      // Jika mendekati expiry (kurang dari 5 menit), coba refresh
      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        console.log('Token will expire soon, refreshing...');
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
          return;
        }
        // Refresh berhasil, update user
        await refreshUser();
      }
    } catch (error) {
      console.error('Error checking token expiry:', error);
    }
  }, [isAuthenticated, clearAuthAndRedirect]);

  useEffect(() => {
    checkAuth();

    // Set interval untuk cek token setiap 30 detik
    checkIntervalRef.current = setInterval(() => {
      checkTokenExpiry();
    }, 30000);

    // Listener untuk storage changes (ketika token diubah di tab lain)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'expires_at') {
        if (!e.newValue) {
          // Token dihapus di tab lain
          clearAuthAndRedirect('Sesi berakhir di tab lain, silakan login kembali');
        } else {
          // Token diperbarui di tab lain
          checkAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
      isLoggingOutRef.current = false;
      setLoggingOut(false);
      isRedirectingRef.current = false;
    };
  }, []);

  const checkAuth = async () => {
    // Jangan cek auth jika sedang logout
    if (isLoggingOutRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Cek apakah ada token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Cek apakah token masih valid
      if (!authService.isTokenValid()) {
        // Coba refresh token
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      // Ambil data user
      const userData = await authService.getCurrentUser();
      if (userData && !userData.error) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Jika getCurrentUser gagal, coba refresh sekali lagi
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const retryUserData = await authService.getCurrentUser();
          if (retryUserData && !retryUserData.error) {
            setUser(retryUserData);
            setIsAuthenticated(true);
          } else {
            clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
          }
        } else {
          clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
        }
      }
    } catch (error) {
      console.error("Check auth error:", error);
      // Jika error 401/403, clear auth
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearAuthAndRedirect('Sesi berakhir, silakan login kembali');
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, recaptchaToken) => {
    // Reset redirect flag saat login
    isRedirectingRef.current = false;

    try {
      const result = await authService.login(credentials, recaptchaToken);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);

        // Setelah login sukses, cek token expiry
        setTimeout(() => {
          checkTokenExpiry();
        }, 1000);

        return {
          success: true,
          user: result.user,
          message: result.message || "Login berhasil!",
        };
      } else {
        if (showToast) {
          showToast(result.message || "Login gagal, silakan coba lagi", "error");
        }
        return {
          success: false,
          message: result.message || "Login gagal, silakan coba lagi",
        };
      }
    } catch (error) {
      console.error("Login error in context:", error);
      if (showToast) {
        showToast("Terjadi kesalahan saat login", "error");
      }
      return {
        success: false,
        message: error.message || "Terjadi kesalahan saat login",
      };
    }
  };

  const logout = async (showToastMessage = true) => {
    // Cegah multiple logout
    if (isLoggingOutRef.current) {
      return { success: false, message: "Logout already in progress" };
    }

    isLoggingOutRef.current = true;
    
    // Set flag bahwa sedang logout untuk mencegah request baru
    setLoggingOut(true);

    try {
      // Hapus token IMMEDIATELY sebelum apapun
      const token = localStorage.getItem('access_token');
      
      // Clear localStorage terlebih dahulu
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('refresh_token');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);

      // Clear interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }

      // Call logout API secara async (jangan di-await untuk tidak blocking)
      if (token) {
        // Gunakan API_URL yang sudah didefinisikan
        fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => console.error('Logout API error:', err));
      }

      if (showToastMessage && showToast) {
        showToast("Logout berhasil", "success");
      }

      return { success: true, message: "Logout berhasil" };
    } catch (error) {
      console.error("Logout error:", error);
      if (showToastMessage && showToast) {
        showToast("Logout berhasil", "success");
      }
      return { success: true, message: "Logout berhasil" };
    } finally {
      isLoggingOutRef.current = false;
      // Reset flag setelah delay untuk memastikan tidak ada request yang tertunda
      setTimeout(() => {
        setLoggingOut(false);
      }, 500);
    }
  };

  const updateUser = (updatedData) => {
    if (!isAuthenticated) return;

    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    authService.updateUser(updatedData);
  };

  const refreshUser = async () => {
    // Jangan refresh jika sedang logout atau tidak authenticated
    if (isLoggingOutRef.current || !isAuthenticated) {
      return null;
    }

    try {
      const userData = await authService.getCurrentUser();
      if (userData && !userData.error) {
        setUser(userData);
        return userData;
      } else {
        // Jika gagal, coba refresh token
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const retryUserData = await authService.getCurrentUser();
          if (retryUserData && !retryUserData.error) {
            setUser(retryUserData);
            return retryUserData;
          }
        }
        // Jika semua gagal, logout
        await logout(false);
        return null;
      }
    } catch (error) {
      console.error("Refresh user error:", error);
      // Jika error 401/403, logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout(false);
      }
      return null;
    }
  };

  const getUserRole = () => {
    return user?.role?.slug || null;
  };

  const getUserOrganizationLevel = () => {
    const level = user?.organization?.level;
    if (typeof level === "object") {
      return level?.slug || null;
    }
    return level || null;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUser,
    getUserRole,
    getUserOrganizationLevel,
    // Tambahkan fungsi untuk manual check token
    checkTokenExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook untuk menggunakan AuthContext dengan error handling
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;