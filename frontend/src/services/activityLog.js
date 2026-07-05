// src/services/activityLog.js
import api from './api';

export const activityLogService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/activity-logs', { 
        params,
        timeout: 30000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get activity logs error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Waktu permintaan habis. Silakan coba lagi.',
          isTimeout: true,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data activity log',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getModules() {
    try {
      const response = await api.get('/activity-logs/modules', {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data?.message || 'Data modul berhasil diambil',
      };
    } catch (error) {
      console.error('Get modules error:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Gagal mengambil data modul',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getActions() {
    try {
      const response = await api.get('/activity-logs/actions', {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data?.message || 'Data aksi berhasil diambil',
      };
    } catch (error) {
      console.error('Get actions error:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Gagal mengambil data aksi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getUsers() {
    try {
      const response = await api.get('/activity-logs/users', {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data?.message || 'Data user berhasil diambil',
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Gagal mengambil data user',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/activity-logs/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get activity log detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail activity log',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/activity-logs/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        message: response.data.message || 'Activity log berhasil dihapus',
      };
    } catch (error) {
      console.error('Delete activity log error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus activity log',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default activityLogService;