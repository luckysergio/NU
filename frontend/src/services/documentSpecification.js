import api from './api';

export const documentSpecificationService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/document-specifications', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get document specifications error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data spesifikasi dokumen',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/document-specifications/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get document specification detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail spesifikasi dokumen',
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/document-specifications', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create document specification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat spesifikasi dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/document-specifications/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update document specification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate spesifikasi dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/document-specifications/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete document specification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus spesifikasi dokumen',
      };
    }
  },
};

export default documentSpecificationService;