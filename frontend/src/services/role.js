// src/services/role.js
import api from './api';

export const roleService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/roles', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get roles error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data role',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/roles/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get role detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail role',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/roles', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create role error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat role',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/roles/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update role error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate role',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/roles/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete role error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus role',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default roleService;