// src/services/kelurahan.js
import api from './api';

export const kelurahanService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/kelurahans', { 
        params,
        timeout: 30000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kelurahans error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Waktu permintaan habis. Silakan coba lagi.',
          isTimeout: true,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAvailableForRanting(kecamatanId, kotaId = null, ignoreOrganizationId = null) {
    try {
      const params = {};
      
      if (kecamatanId) params.kecamatan_id = kecamatanId;
      if (kotaId) params.kota_id = kotaId;
      if (ignoreOrganizationId) params.ignore_organization_id = ignoreOrganizationId;
      
      const response = await api.get('/kelurahans/available-for-ranting', { 
        params,
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available kelurahans for Ranting error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kelurahan yang tersedia untuk Ranting',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getByKecamatan(kecamatanId) {
    try {
      const response = await api.get('/kelurahans', { 
        params: { kecamatan_id: kecamatanId, per_page: 100 },
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kelurahans by kecamatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getByKota(kotaId) {
    try {
      const response = await api.get('/kelurahans', { 
        params: { kota_id: kotaId, per_page: 100 },
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kelurahans by kota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/kelurahans/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kelurahan detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/kelurahans', data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create kelurahan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/kelurahans/${id}`, data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update kelurahan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/kelurahans/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete kelurahan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default kelurahanService;