// services/rw.js
import api from './api';

export const rwService = {
  /**
   * Get all RW with filters
   * @param {Object} params - Query parameters
   * @param {number} params.kelurahan_id - Filter by kelurahan
   * @param {string} params.search - Search by nomor RW
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/rws', { params });
      // Backend returns { status: true, data: [...] }
      const data = response.data?.data || [];
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: response.data?.message,
      };
    } catch (error) {
      console.error('Get RW error:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Gagal mengambil data RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single RW by ID
   * @param {number} id - RW ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/rws/${id}`);
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message,
      };
    } catch (error) {
      console.error('Get RW detail error:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Gagal mengambil detail RW',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new RW
   * @param {Object} data - RW data
   * @param {number} data.kelurahan_id - Kelurahan ID (required)
   * @param {string} data.nomor - RW number (required, max 5 chars)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/rws', data);
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'RW berhasil dibuat',
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

  /**
   * Update existing RW
   * @param {number} id - RW ID
   * @param {Object} data - Updated RW data
   * @param {number} data.kelurahan_id - Kelurahan ID (required)
   * @param {string} data.nomor - RW number (required, max 5 chars)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/rws/${id}`, data);
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'RW berhasil diubah',
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

  /**
   * Delete RW
   * @param {number} id - RW ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/rws/${id}`);
      return {
        success: true,
        message: response.data?.message || 'RW berhasil dihapus',
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
  /**
   * Get RW available for Anak Ranting (RW without Anak Ranting organization)
   * @param {number} kelurahanId - Village ID (optional)
   * @param {number} ignoreOrganizationId - Organization ID to ignore (for edit mode)
   */
  async getAvailableForAnakRanting(kelurahanId = null, ignoreOrganizationId = null) {
    try {
      const params = {};
      
      if (kelurahanId) {
        params.kelurahan_id = kelurahanId;
      }
      
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      
      const response = await api.get('/rws/available-for-anak-ranting', { params });
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