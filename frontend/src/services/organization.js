// src/services/organization.js
import api from './api';

export const organizationService = {
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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/organizations/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/organizations', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/organizations/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/organizations/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getLevelFilters(levelId) {
    try {
      const response = await api.get(`/organizations/level-filters/${levelId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil filter level',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan level',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getChildren(id) {
    try {
      const response = await api.get(`/organizations/${id}/children`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi turunan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAncestors(id) {
    try {
      const response = await api.get(`/organizations/${id}/ancestors`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi induk',
        errors: error.response?.data?.errors,
      };
    }
  },

  async toggleActive(id) {
    try {
      const response = await api.patch(`/organizations/${id}/toggle-active`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengubah status organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async bulkDelete(ids) {
    try {
      const response = await api.delete('/organizations/bulk', { data: { ids } });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async export(params = {}) {
    try {
      const response = await api.get('/organizations/export', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengexport data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getStatistics() {
    try {
      const response = await api.get('/organizations/statistics');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mencari organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAvailableParents(levelId, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-parents', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data parent organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getAvailableParentsForLembagaBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (organizationTypeId) params.organization_type_id = organizationTypeId;
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-parents-lembaga-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data parent organisasi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getAvailableTypesForLembagaByParent(params = {}) {
    try {
      const response = await api.get('/organizations/available-types-lembaga-by-parent', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe Lembaga',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getTypesWithBanomPc(levelId, currentId = null) {
    try {
      const params = { organization_level_id: levelId };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/types-with-banom-pc', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe Banom PC',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getAvailableTypesForBanom(levelId, isBanomPc = true, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        is_banom_pc: isBanomPc
      };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-types-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getAvailableTypesForParent(parentId, levelId, currentId = null) {
    try {
      const params = { 
        parent_id: parentId,
        organization_level_id: levelId
      };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-types-for-parent', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tipe organisasi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getUsedKecamatanForBanom(typeId, currentId = null) {
    try {
      const params = { type_id: typeId };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/used-kecamatan-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan yang digunakan',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getAvailablePcForBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        organization_type_id: organizationTypeId
      };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-pc-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data PC untuk Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  async getAvailableBanomPcForBanom(levelId, organizationTypeId = null, currentId = null) {
    try {
      const params = { 
        organization_level_id: levelId,
        organization_type_id: organizationTypeId
      };
      if (currentId) params.current_id = currentId;
      
      const response = await api.get('/organizations/available-banom-pc-for-banom', { params });
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data Banom PC untuk Banom',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan parent',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan tipe',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil hierarki organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getBySlug(slug) {
    try {
      const response = await api.get(`/organizations/slug/${slug}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

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
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengecek ketersediaan nama',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getStatisticsByLevel(levelId) {
    try {
      const response = await api.get(`/organizations/statistics/level/${levelId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik organisasi per level',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getRootOrganizations(params = {}) {
    try {
      const response = await api.get('/organizations/root', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi root',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getByLocation(params = {}) {
    try {
      const response = await api.get('/organizations/by-location', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi berdasarkan lokasi',
        errors: error.response?.data?.errors,
      };
    }
  }
};

export default organizationService;