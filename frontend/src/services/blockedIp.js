// services/blockedIp.js
import api from './api';

export const blockedIpService = {
  // Get all blocked IPs
  async getAll(params = {}) {
    try {
      const response = await api.get('/blocked-ips', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get blocked IPs error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data IP terblokir',
      };
    }
  },

  // Get single blocked IP
  async getById(id) {
    try {
      const response = await api.get(`/blocked-ips/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get blocked IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail IP',
      };
    }
  },

  // Block new IP
  async block(data) {
    try {
      const response = await api.post('/blocked-ips', data);
      return {
        success: true,
        message: response.data.message || 'IP berhasil diblokir',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Block IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal memblokir IP',
      };
    }
  },

  // Unblock IP
  async unblock(id) {
    try {
      const response = await api.delete(`/blocked-ips/${id}`);
      return {
        success: true,
        message: response.data.message || 'IP berhasil dibuka blokirnya',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Unblock IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuka blokir IP',
      };
    }
  },

  // Update blocked IP
  async update(id, data) {
    try {
      const response = await api.put(`/blocked-ips/${id}`, data);
      return {
        success: true,
        message: response.data.message || 'IP berhasil diperbarui',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Update blocked IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal memperbarui IP',
      };
    }
  },

  // Activate IP
  async activate(id) {
    try {
      const response = await api.patch(`/blocked-ips/${id}/activate`);
      return {
        success: true,
        message: response.data.message || 'IP berhasil diaktifkan',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Activate IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengaktifkan IP',
      };
    }
  },

  // Deactivate IP
  async deactivate(id) {
    try {
      const response = await api.patch(`/blocked-ips/${id}/deactivate`);
      return {
        success: true,
        message: response.data.message || 'IP berhasil dinonaktifkan',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Deactivate IP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menonaktifkan IP',
      };
    }
  },
};

export default blockedIpService;