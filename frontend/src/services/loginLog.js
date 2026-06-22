import api from './api';

export const loginLogService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/login-logs', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get login logs error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data log login',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/login-logs/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get login log detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail log login',
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/login-logs/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete login log error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus log login',
      };
    }
  },
};

export default loginLogService;