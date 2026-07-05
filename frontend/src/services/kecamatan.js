// services/kecamatan.js
import api from './api';

export const kecamatanService = {
  /**
   * Get all districts with pagination and filters
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
   * Get districts available for MWC organization
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
   * Get districts available for Banom organization
   * Returns all districts in a city, excluding those already used by Banom with same type
   */
  async getAvailableForBanom(kotaId, typeId = null, currentId = null) {
    try {
      const params = {};
      
      if (kotaId) {
        params.kota_id = kotaId;
      }
      
      if (typeId) {
        params.type_id = typeId;
      }
      
      if (currentId) {
        params.current_id = currentId;
      }
      
      const response = await api.get('/kecamatans/available-for-banom', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available kecamatans for Banom error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kecamatan yang tersedia untuk Banom',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get districts by city ID
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