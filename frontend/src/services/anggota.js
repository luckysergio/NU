// services/anggota.js
import api from './api';

export const anggotaService = {
  /**
   * Get all anggota with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @param {string} params.search - Search by name, phone, or address
   * @param {number} params.organization_id - Filter by organization
   * @param {number} params.jabatan_id - Filter by position
   * @param {boolean} params.is_active - Filter by active status
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/anggotas', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get anggotas error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single anggota by ID
   * @param {number} id - Anggota ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/anggotas/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get anggota detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new anggota
   * @param {Object} data - Anggota data
   * @param {number} data.organization_id - Organization ID (required)
   * @param {number} data.jabatan_id - Position ID (required)
   * @param {string} data.nama - Full name (required)
   * @param {string} data.no_hp - Phone number (optional)
   * @param {string} data.alamat - Address (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/anggotas', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update existing anggota
   * @param {number} id - Anggota ID
   * @param {Object} data - Updated anggota data
   * @param {number} data.organization_id - Organization ID (required)
   * @param {number} data.jabatan_id - Position ID (required)
   * @param {string} data.nama - Full name (required)
   * @param {string} data.no_hp - Phone number (optional)
   * @param {string} data.alamat - Address (optional)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/anggotas/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete anggota
   * @param {number} id - Anggota ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/anggotas/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations for dropdown (filtered by access)
   * Note: This endpoint might need to be added to backend
   * @param {Object} params - Query parameters
   */
  async getOrganizations(params = {}) {
    try {
      const response = await api.get('/organizations', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
      };
    }
  },

  /**
   * Get positions for dropdown
   * Note: This endpoint might need to be added to backend
   * @param {Object} params - Query parameters
   */
  async getJabatans(params = {}) {
    try {
      const response = await api.get('/jabatans', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get jabatans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data jabatan',
      };
    }
  },
};

export default anggotaService;