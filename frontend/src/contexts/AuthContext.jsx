import React, { createContext, useState, useEffect, useRef } from "react";
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

  // Define API_URL di dalam komponen
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    checkAuth();

    return () => {
      isLoggingOutRef.current = false;
      setLoggingOut(false);
    };
  }, []);

  const checkAuth = async () => {
    setLoading(true);

    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        if (userData && !userData.error) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          await logout(false);
        }
      }
    } catch (error) {
      console.error("Check auth error:", error);
      await logout(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, recaptchaToken) => {
    try {
      const result = await authService.login(credentials, recaptchaToken);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);

        return {
          success: true,
          user: result.user,
          message: result.message || "Login berhasil!",
        };
      } else {
        showToast(result.message || "Login gagal, silakan coba lagi", "error");
        return {
          success: false,
          message: result.message || "Login gagal, silakan coba lagi",
        };
      }
    } catch (error) {
      console.error("Login error in context:", error);
      showToast("Terjadi kesalahan saat login", "error");
      return {
        success: false,
        message: error.message || "Terjadi kesalahan saat login",
      };
    }
  };

  const logout = async (showToastMessage = true) => {
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
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);

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

      if (showToastMessage) {
        showToast("Logout berhasil", "success");
      }

      return { success: true, message: "Logout berhasil" };
    } catch (error) {
      console.error("Logout error:", error);
      if (showToastMessage) {
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
    if (isAuthenticated && !isLoggingOutRef.current) {
      try {
        const userData = await authService.getCurrentUser();
        if (userData && !userData.error) {
          setUser(userData);
          return userData;
        }
      } catch (error) {
        console.error("Refresh user error:", error);
      }
    }
    return null;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshUser,
        getUserRole,
        getUserOrganizationLevel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};