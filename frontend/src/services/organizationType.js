// services/organizationType.js
import api from './api';

export const organizationTypeService = {
  /**
   * Get all organization types with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page (max 1000)
   * @param {string} params.search - Search by name or slug
   * @param {number} params.organization_level_id - Filter by organization level
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/organization-types', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization types error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization types available for a specific level (active only)
   * @param {number} levelId - Organization level ID
   */
  async getAvailableByLevel(levelId) {
    try {
      const response = await api.get(`/organization-types/available-by-level/${levelId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available organization types by level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe organisasi yang tersedia',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization types that don't have any organization yet (for Lembaga/Banom)
   * @param {number} levelId - Organization level ID
   * @param {number} ignoreOrganizationId - Organization ID to ignore (for edit mode)
   */
  async getUnusedByLevel(levelId, ignoreOrganizationId = null) {
    try {
      const params = {};
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      const response = await api.get(`/organization-types/unused-by-level/${levelId}`, { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get unused organization types by level error:', error);
      // Fallback: get all available types and filter client-side
      const fallbackResult = await this.getAvailableByLevel(levelId);
      if (fallbackResult.success) {
        return fallbackResult;
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe organisasi yang belum digunakan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization types by level (alias for getAvailableByLevel)
   * @param {number} levelId - Organization level ID
   */
  async getByLevel(levelId) {
    return this.getAvailableByLevel(levelId);
  },

  /**
   * Get single organization type by ID
   * @param {number} id - Organization type ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/organization-types/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization type detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail tipe organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new organization type
   * @param {Object} data - Organization type data
   * @param {number} data.organization_level_id - Organization level ID (required)
   * @param {string} data.nama - Type name (required)
   * @param {string} data.deskripsi - Description (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   */
  async create(data) {
    try {
      const response = await api.post('/organization-types', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create organization type error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat tipe organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update existing organization type
   * @param {number} id - Organization type ID
   * @param {Object} data - Updated organization type data
   * @param {number} data.organization_level_id - Organization level ID (required)
   * @param {string} data.nama - Type name (required)
   * @param {string} data.deskripsi - Description (optional)
   * @param {boolean} data.is_active - Active status
   */
  async update(id, data) {
    try {
      const response = await api.put(`/organization-types/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update organization type error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate tipe organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete organization type
   * @param {number} id - Organization type ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/organization-types/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete organization type error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus tipe organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default organizationTypeService;