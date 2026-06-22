// services/user.js
import api from './api';

export const userService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data user',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get user detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail user',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get available roles for a specific organization
   * @param {number} organizationId - The organization ID
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getAvailableRoles(organizationId) {
    try {
      const response = await api.get(`/users/available-roles/${organizationId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available roles error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil daftar role yang tersedia',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/users', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat user',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/users/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate user',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus user',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default userService;