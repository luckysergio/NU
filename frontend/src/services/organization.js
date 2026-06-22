// services/organization.js
import api from './api';

export const organizationService = {
  /**
   * Get all organizations with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page (max 1000)
   * @param {string} params.search - Search by name or slug
   * @param {number} params.organization_level_id - Filter by level
   * @param {number} params.organization_type_id - Filter by type
   * @param {number} params.parent_id - Filter by parent organization
   * @param {number} params.kota_id - Filter by city (for PC level)
   * @param {number} params.kecamatan_id - Filter by district (for MWC level)
   * @param {number} params.kelurahan_id - Filter by village (for Ranting level)
   * @param {number} params.rw_id - Filter by RW (for Anak Ranting level)
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/organizations', { params });
      return {
        success: true,
        data: response.data.data,
        filters: response.data.filters,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get all organizations with simple response (for dropdowns)
   * @param {Object} params - Query parameters
   */
  async getAllSimple(params = {}) {
    try {
      const response = await api.get('/organizations', { 
        params: { ...params, per_page: 1000 } 
      });
      return {
        success: true,
        data: response.data.data?.data || response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations simple error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single organization by ID
   * @param {number} id - Organization ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/organizations/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new organization
   * @param {Object} data - Organization data
   */
  async create(data) {
    try {
      const response = await api.post('/organizations', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create organization error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update existing organization
   * @param {number} id - Organization ID
   * @param {Object} data - Updated organization data
   */
  async update(id, data) {
    try {
      const response = await api.put(`/organizations/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update organization error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete organization
   * @param {number} id - Organization ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/organizations/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete organization error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get level filters for organization form
   * @param {number} levelId - Organization level ID
   */
  async getLevelFilters(levelId) {
    try {
      const response = await api.get(`/organizations/level-filters/${levelId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get level filters error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil filter level',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations by level
   * @param {string} levelSlug - Level slug (pc, mwc, ranting, anak-ranting, lembaga, banom)
   */
  async getByLevel(levelSlug) {
    try {
      const response = await api.get('/organizations/by-level', { 
        params: { level_slug: levelSlug } 
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations by level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan level',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get child organizations
   * @param {number} id - Parent organization ID
   */
  async getChildren(id) {
    try {
      const response = await api.get(`/organizations/${id}/children`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get children organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi turunan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get ancestor organizations
   * @param {number} id - Organization ID
   */
  async getAncestors(id) {
    try {
      const response = await api.get(`/organizations/${id}/ancestors`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get ancestors organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi induk',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Toggle organization active status
   * @param {number} id - Organization ID
   */
  async toggleActive(id) {
    try {
      const response = await api.patch(`/organizations/${id}/toggle-active`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Toggle organization active error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengubah status organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Bulk delete organizations
   * @param {Array} ids - Array of organization IDs to delete
   */
  async bulkDelete(ids) {
    try {
      const response = await api.delete('/organizations/bulk', { data: { ids } });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Bulk delete organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Export organizations data
   * @param {Object} params - Filter parameters for export
   */
  async export(params = {}) {
    try {
      const response = await api.get('/organizations/export', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Export organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengexport data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization statistics
   */
  async getStatistics() {
    try {
      const response = await api.get('/organizations/statistics');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization statistics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Search organizations
   * @param {string} keyword - Search keyword
   */
  async search(keyword) {
    try {
      const response = await api.get('/organizations/search', { 
        params: { keyword } 
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Search organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mencari organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get available parent organizations for a given level (for MWC, Ranting, Lembaga, Banom)
   * @param {number} levelId - Organization level ID
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailableParents(levelId, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-parents', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available parents error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data parent organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get available parents for Lembaga/Banom
   * @param {number} levelId - Organization level ID (lembaga/banom)
   * @param {number} organizationTypeId - Organization type ID
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailableParentsForLembagaBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (organizationTypeId) {
        params.organization_type_id = organizationTypeId;
      }
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-parents-lembaga-banom', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available parents for lembaga/banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data parent organisasi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get types that already have Banom PC
   * @param {number} levelId - Organization level ID
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getTypesWithBanomPc(levelId, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/types-with-banom-pc', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get types with Banom PC error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe Banom PC',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get available types for Banom
   * @param {number} levelId - Organization level ID
   * @param {boolean} isBanomPc - Whether this is for Banom PC or MWC
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailableTypesForBanom(levelId, isBanomPc = true, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        is_banom_pc: isBanomPc
      };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-types-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available types for Banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get available types for a specific parent (Lembaga/Banom)
   * @param {number} parentId - Parent organization ID
   * @param {number} levelId - Organization level ID
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailableTypesForParent(parentId, levelId, currentId = null) {
    try {
      const params = { 
        parent_id: parentId,
        organization_level_id: levelId
      };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-types-for-parent', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available types for parent error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe organisasi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get used kecamatan IDs for Banom with specific type
   * @param {number} typeId - Organization type ID
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getUsedKecamatanForBanom(typeId, currentId = null) {
    try {
      const params = { type_id: typeId };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/used-kecamatan-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get used kecamatan for Banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan yang digunakan',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /*
  |--------------------------------------------------------------------------
  | ADDED METHODS - Untuk mendukung fitur yang sudah ada di backend
  |--------------------------------------------------------------------------
  */

  /**
   * Get available PC for Banom (PC yang belum memiliki Banom PC dengan type tertentu)
   * @param {number} levelId - Organization level ID (harus banom)
   * @param {number} organizationTypeId - Organization type ID (optional)
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailablePcForBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        organization_type_id: organizationTypeId
      };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-pc-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available PC for Banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data PC untuk Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get available Banom PC for Banom MWC (Banom PC yang belum memiliki Banom MWC)
   * @param {number} levelId - Organization level ID (harus banom)
   * @param {number} organizationTypeId - Organization type ID (optional)
   * @param {number} currentId - Current organization ID (for update, optional)
   */
  async getAvailableBanomPcForBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        organization_type_id: organizationTypeId
      };
      if (currentId) {
        params.current_id = currentId;
      }
      const response = await api.get('/organizations/available-banom-pc-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available Banom PC for Banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data Banom PC untuk Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get organizations by parent ID
   * @param {number} parentId - Parent organization ID
   * @param {Object} params - Additional query parameters
   */
  async getByParent(parentId, params = {}) {
    try {
      const response = await api.get('/organizations/by-parent', { 
        params: { parent_id: parentId, ...params } 
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations by parent error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan parent',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations by type ID
   * @param {number} typeId - Organization type ID
   * @param {Object} params - Additional query parameters
   */
  async getByType(typeId, params = {}) {
    try {
      const response = await api.get('/organizations/by-type', { 
        params: { organization_type_id: typeId, ...params } 
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations by type error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan tipe',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization hierarchy (tree structure)
   * @param {number} rootId - Root organization ID (optional, default: PC)
   * @param {number} depth - Maximum depth (optional)
   */
  async getHierarchy(rootId = null, depth = null) {
    try {
      const params = {};
      if (rootId) params.root_id = rootId;
      if (depth) params.depth = depth;
      
      const response = await api.get('/organizations/hierarchy', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization hierarchy error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil hierarki organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization by slug
   * @param {string} slug - Organization slug
   */
  async getBySlug(slug) {
    try {
      const response = await api.get(`/organizations/slug/${slug}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organization by slug error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Check if organization name is available
   * @param {string} name - Organization name
   * @param {number} excludeId - Organization ID to exclude (for update)
   */
  async checkNameAvailability(name, excludeId = null) {
    try {
      const params = { name };
      if (excludeId) params.exclude_id = excludeId;
      
      const response = await api.get('/organizations/check-name', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Check name availability error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengecek ketersediaan nama',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organization statistics by level
   * @param {number} levelId - Organization level ID
   */
  async getStatisticsByLevel(levelId) {
    try {
      const response = await api.get(`/organizations/statistics/level/${levelId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get statistics by level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik organisasi per level',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations without parent (root organizations)
   * @param {Object} params - Query parameters
   */
  async getRootOrganizations(params = {}) {
    try {
      const response = await api.get('/organizations/root', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get root organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi root',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations by location (kota, kecamatan, kelurahan, rw)
   * @param {Object} params - Location parameters
   * @param {number} params.kota_id - City ID
   * @param {number} params.kecamatan_id - District ID
   * @param {number} params.kelurahan_id - Village ID
   * @param {number} params.rw_id - RW ID
   */
  async getByLocation(params = {}) {
    try {
      const response = await api.get('/organizations/by-location', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get organizations by location error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan lokasi',
        errors: error.response?.data?.errors,
      };
    }
  }
};

export default organizationService;