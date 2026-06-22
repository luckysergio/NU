import api from './api';

export const activityLogService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/activity-logs', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get activity logs error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data activity log',
      };
    }
  },

  async getModules() {
    try {
      const response = await api.get('/activity-logs/modules');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get modules error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data modul',
      };
    }
  },

  async getActions() {
    try {
      const response = await api.get('/activity-logs/actions');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get actions error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data aksi',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/activity-logs/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get activity log detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail activity log',
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/activity-logs/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete activity log error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus activity log',
      };
    }
  },
};

export default activityLogService;