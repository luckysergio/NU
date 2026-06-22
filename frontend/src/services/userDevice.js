import api from './api';

export const userDeviceService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/user-devices', { params });
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Get user devices error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data perangkat user',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/user-devices/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get user device detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail perangkat',
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/user-devices/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete user device error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus perangkat',
      };
    }
  },

  async deleteByUser(userId) {
    try {
      const response = await api.delete(`/user-devices/user/${userId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete user devices error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus semua perangkat user',
      };
    }
  },
};

export default userDeviceService;