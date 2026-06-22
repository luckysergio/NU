// services/kecamatan.js
import api from './api';

export const kecamatanService = {
  /**
   * Get all districts with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page (max 1000)
   * @param {string} params.search - Search by name or code
   * @param {number} params.kota_id - Filter by city ID
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/kecamatans', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kecamatans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get districts available for MWC organization (districts without MWC organization)
   * @param {number} kotaId - City ID (required)
   * @param {number} ignoreOrganizationId - Organization ID to ignore (for edit mode)
   */
  async getAvailableForMWC(kotaId, ignoreOrganizationId = null) {
    try {
      const params = {};
      
      if (kotaId) {
        params.kota_id = kotaId;
      }
      
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      
      const response = await api.get('/kecamatans/available-for-mwc', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available kecamatans for MWC error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan yang tersedia untuk MWC',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get districts by city ID (alias for getAll with kota_id filter)
   * @param {number} kotaId - City ID
   */
  async getByKota(kotaId) {
    try {
      const response = await api.get('/kecamatans', { params: { kota_id: kotaId, per_page: 100 } });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kecamatans by kota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single district by ID
   * @param {number} id - District ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/kecamatans/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kecamatan detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new district
   * @param {Object} data - District data
   * @param {number} data.kota_id - City ID (required)
   * @param {string} data.nama - District name (required)
   * @param {string} data.kode - District code (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/kecamatans', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create kecamatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update existing district
   * @param {number} id - District ID
   * @param {Object} data - Updated district data
   * @param {number} data.kota_id - City ID (required)
   * @param {string} data.nama - District name (required)
   * @param {string} data.kode - District code (optional)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/kecamatans/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update kecamatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete district
   * @param {number} id - District ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/kecamatans/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete kecamatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus kecamatan',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default kecamatanService;