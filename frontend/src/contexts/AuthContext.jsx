import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { tokenManager } from '../utils/tokenManager';
import { authService } from '../services/auth';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkIntervalRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    tokenManager.initialize();
    
    const currentState = tokenManager.getState();
    setState({
      user: currentState.user,
      token: currentState.token,
      isAuthenticated: currentState.isAuthenticated,
      isLoading: false,
    });

    const unsubscribe = tokenManager.subscribe((newState) => {
      setState({
        user: newState.user,
        token: newState.token,
        isAuthenticated: newState.isAuthenticated,
        isLoading: false,
      });
    });

    checkIntervalRef.current = setInterval(checkTokenExpiry, 30000);

    const handleStorageChange = (e) => {
      if (['access_token', 'expires_at', 'user'].includes(e.key)) {
        tokenManager.initialize();
        const newState = tokenManager.getState();
        setState({
          user: newState.user,
          token: newState.token,
          isAuthenticated: newState.isAuthenticated,
          isLoading: false,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkTokenExpiry = useCallback(async () => {
    if (isLoggingOutRef.current || !state.isAuthenticated) {
      return;
    }

    if (!tokenManager.isValid()) {
      const refreshed = await authService.refreshToken();
      if (!refreshed) {
        tokenManager.clear();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
  }, [state.isAuthenticated]);

  const login = useCallback(async (credentials, recaptchaToken) => {
    try {
      const result = await authService.login(credentials, recaptchaToken);
      
      if (result.success) {
        const newState = tokenManager.getState();
        setState({
          user: newState.user,
          token: newState.token,
          isAuthenticated: newState.isAuthenticated,
          isLoading: false,
        });
        
        setTimeout(() => checkTokenExpiry(), 1000);
        
        return {
          success: true,
          user: result.user,
          message: result.message || 'Login berhasil!',
        };
      }
      
      return {
        success: false,
        message: result.message || 'Login gagal, silakan coba lagi',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan saat login',
      };
    }
  }, [checkTokenExpiry]);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return { success: false, message: 'Logout already in progress' };
    }

    isLoggingOutRef.current = true;

    try {
      await authService.logout();
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      return { success: true, message: 'Logout berhasil' };
    } catch (error) {
      console.error('Logout error:', error);
      tokenManager.clear();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return { success: true, message: 'Logout berhasil' };
    } finally {
      isLoggingOutRef.current = false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (isLoggingOutRef.current || !state.isAuthenticated) {
      return null;
    }

    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setState(prev => ({
          ...prev,
          user: userData,
        }));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  }, [state.isAuthenticated]);

  const updateUser = useCallback((updatedData) => {
    if (!state.isAuthenticated || !state.user) return;

    const newUser = { ...state.user, ...updatedData };
    tokenManager.setUser(newUser);
    setState(prev => ({
      ...prev,
      user: newUser,
    }));
  }, [state.isAuthenticated, state.user]);

  const getUserRole = useCallback(() => {
    return state.user?.role?.slug || state.user?.role || null;
  }, [state.user]);

  const getUserOrganization = useCallback(() => {
    return state.user?.organization || null;
  }, [state.user]);

  const getUserOrganizationLevel = useCallback(() => {
    const org = state.user?.organization;
    if (!org) return null;
    return typeof org.level === 'object' ? org.level?.slug : org.level;
  }, [state.user]);

  const hasRole = useCallback((roles) => {
    const userRole = getUserRole();
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  }, [getUserRole]);

  const isSuperAdmin = useCallback(() => {
    return hasRole(['super-admin', 'Super Admin', 'admin']);
  }, [hasRole]);

  const isPC = useCallback(() => {
    return hasRole(['pc', 'PC']) || state.user?.organization?.level?.slug === 'pc';
  }, [hasRole, state.user]);

  const isMWC = useCallback(() => {
    return hasRole(['mwc', 'MWC']) || state.user?.organization?.level?.slug === 'mwc';
  }, [hasRole, state.user]);

  const value = useMemo(() => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
    getUserRole,
    getUserOrganization,
    getUserOrganizationLevel,
    hasRole,
    isSuperAdmin,
    isPC,
    isMWC,
    checkTokenExpiry,
  }), [
    state.user,
    state.token,
    state.isAuthenticated,
    state.isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
    getUserRole,
    getUserOrganization,
    getUserOrganizationLevel,
    hasRole,
    isSuperAdmin,
    isPC,
    isMWC,
    checkTokenExpiry,
  ]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;