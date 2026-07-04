// src/services/kota.js
import api from './api';

export const kotaService = {
  async getAll(params = {}) {
    try {
      const requestParams = { ...params };
      
      const response = await api.get('/kotas', { 
        params: requestParams,
        timeout: 30000,
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kotas error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Waktu permintaan habis. Silakan coba lagi.',
          isTimeout: true,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/kotas/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kota detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAvailableForPC(ignoreOrganizationId = null) {
    try {
      const params = {};
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      const response = await api.get('/kotas/available-for-pc', { 
        params,
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available kotas for PC error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kota yang tersedia untuk PC',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/kotas', data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create kota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat kota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/kotas/${id}`, data, {
        timeout: 15000,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update kota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate kota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/kotas/${id}`, {
        timeout: 15000,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete kota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus kota',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default kotaService;