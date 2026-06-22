import api from './api';

export const jabatanService = {
  async getAll(params = {}) {
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

  async getById(id) {
    try {
      const response = await api.get(`/jabatans/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get jabatan detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail jabatan',
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/jabatans', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/jabatans/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate jabatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/jabatans/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete jabatan error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus jabatan',
      };
    }
  },
};

export default jabatanService;