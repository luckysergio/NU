// services/kota.js
import api from './api';

export const kotaService = {
  /**
   * Get all cities with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page (max 1000)
   * @param {string} params.search - Search by name or code
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/kotas', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kotas error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single city by ID
   * @param {number} id - City ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/kotas/${id}`);
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

  /**
   * Get cities available for PC organization (cities without PC organization)
   * @param {number} ignoreOrganizationId - Organization ID to ignore (for edit mode)
   */
  async getAvailableForPC(ignoreOrganizationId = null) {
    try {
      const params = {};
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      const response = await api.get('/kotas/available-for-pc', { params });
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

  /**
   * Create new city
   * @param {Object} data - City data
   * @param {string} data.nama - City name (required)
   * @param {string} data.kode - City code (required, unique)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/kotas', data);
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

  /**
   * Update existing city
   * @param {number} id - City ID
   * @param {Object} data - Updated city data
   * @param {string} data.nama - City name (required)
   * @param {string} data.kode - City code (required, unique)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/kotas/${id}`, data);
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

  /**
   * Delete city
   * @param {number} id - City ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/kotas/${id}`);
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