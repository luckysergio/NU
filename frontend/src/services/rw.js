// src/services/rw.js
import api from './api';

export const rwService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/rws', { 
        params,
        timeout: 30000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get RW error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Waktu permintaan habis. Silakan coba lagi.',
          isTimeout: true,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/rws/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get RW detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/rws', data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create RW error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/rws/${id}`, data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update RW error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/rws/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete RW error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAvailableForAnakRanting(kelurahanId = null, ignoreOrganizationId = null) {
    try {
      const params = {};
      
      if (kelurahanId) params.kelurahan_id = kelurahanId;
      if (ignoreOrganizationId) params.ignore_organization_id = ignoreOrganizationId;
      
      const response = await api.get('/rws/available-for-anak-ranting', { 
        params,
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available RW for Anak Ranting error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data RW yang tersedia untuk Anak Ranting',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default rwService;