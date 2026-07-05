// src/services/jabatan.js
import api from './api';

export const jabatanService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/jabatans', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get jabatans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getActive(level = null) {
    try {
      const params = {};
      if (level) {
        params.level = level;
      }
      const response = await api.get('/jabatans/active', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get active jabatans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data jabatan aktif',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getByLevel(level) {
    try {
      const response = await api.get('/jabatans/by-level', { params: { level } });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get jabatans by level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data jabatan berdasarkan level',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/jabatans/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get jabatan detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getStatistics() {
    try {
      const response = await api.get('/jabatans/statistics');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get jabatan statistics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/jabatans', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/jabatans/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/jabatans/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async toggleActive(id) {
    try {
      const response = await api.patch(`/jabatans/${id}/toggle-active`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Toggle jabatan status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengubah status jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default jabatanService;