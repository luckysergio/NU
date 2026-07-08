import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../services/auth';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const logout = async () => {
    try {
      await authService.logout();

      if (queryClient) {
        queryClient.clear();
      }

      navigate('/login', { replace: true });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      if (queryClient) {
        queryClient.clear();
      }
      
      navigate('/login', { replace: true });
      
      return { 
        success: false, 
        message: error.message || 'Terjadi kesalahan saat logout' 
      };
    }
  };

  return {
    ...context,
    logout,
  };
};