import api from './api';

export const organizationLevelService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/organization-levels', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get organization levels error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data level organisasi',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/organization-levels/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get organization level detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail level organisasi',
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/organization-levels', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create organization level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat level organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/organization-levels/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update organization level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate level organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/organization-levels/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete organization level error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus level organisasi',
      };
    }
  },
};

export default organizationLevelService;