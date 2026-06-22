// services/kelurahan.js
import api from './api';

export const kelurahanService = {
  /**
   * Get all villages with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page (max 1000)
   * @param {string} params.search - Search by name or code
   * @param {number} params.kecamatan_id - Filter by district ID
   * @param {number} params.kota_id - Filter by city ID (via district)
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/kelurahans', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get kelurahans error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kelurahan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get villages available for Ranting organization (villages without Ranting organization)
   * @param {number} kecamatanId - District ID (required)
   * @param {number} kotaId - City ID (optional, for filtering)
   * @param {number} ignoreOrganizationId - Organization ID to ignore (for edit mode)
   */
  async getAvailableForRanting(kecamatanId, kotaId = null, ignoreOrganizationId = null) {
    try {
      const params = {};
      
      if (kecamatanId) {
        params.kecamatan_id = kecamatanId;
      }
      
      if (kotaId) {
        params.kota_id = kotaId;
      }
      
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      
      const response = await api.get('/kelurahans/available-for-ranting', { params });
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

  /**
   * Get villages by district ID (alias for getAll with kecamatan_id filter)
   * @param {number} kecamatanId - District ID
   */
  async getByKecamatan(kecamatanId) {
    try {
      const response = await api.get('/kelurahans', { params: { kecamatan_id: kecamatanId, per_page: 100 } });
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

  /**
   * Get villages by city ID (via district relation)
   * @param {number} kotaId - City ID
   */
  async getByKota(kotaId) {
    try {
      const response = await api.get('/kelurahans', { params: { kota_id: kotaId, per_page: 100 } });
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

  /**
   * Get single village by ID
   * @param {number} id - Village ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/kelurahans/${id}`);
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

  /**
   * Create new village
   * @param {Object} data - Village data
   * @param {number} data.kecamatan_id - District ID (required)
   * @param {string} data.nama - Village name (required)
   * @param {string} data.kode - Village code (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/kelurahans', data);
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

  /**
   * Update existing village
   * @param {number} id - Village ID
   * @param {Object} data - Updated village data
   * @param {number} data.kecamatan_id - District ID (required)
   * @param {string} data.nama - Village name (required)
   * @param {string} data.kode - Village code (optional)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/kelurahans/${id}`, data);
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

  /**
   * Delete village
   * @param {number} id - Village ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/kelurahans/${id}`);
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