// src/services/certificateCategory.js
import api from './api';

export const certificateCategoryService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/certificate-categories', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get certificate categories error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kategori sertifikat',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getActive() {
    try {
      const response = await api.get('/certificate-categories/active');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get active certificate categories error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kategori sertifikat aktif',
      };
    }
  },

  async getWithCount() {
    try {
      const response = await api.get('/certificate-categories/with-count');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get certificate categories with count error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kategori sertifikat',
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/certificate-categories/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get certificate category detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kategori sertifikat',
      };
    }
  },

  async getBySlug(slug) {
    try {
      const response = await api.get(`/certificate-categories/slug/${slug}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get certificate category by slug error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kategori sertifikat',
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/certificate-categories', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create certificate category error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat kategori sertifikat',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/certificate-categories/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update certificate category error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate kategori sertifikat',
        errors: error.response?.data?.errors,
      };
    }
  },

  async toggleStatus(id) {
    try {
      const response = await api.patch(`/certificate-categories/${id}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Toggle certificate category status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengubah status kategori sertifikat',
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/certificate-categories/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete certificate category error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus kategori sertifikat',
        errors: error.response?.data?.errors,
      };
    }
  },

  async checkSlug(slug, excludeId = null) {
    try {
      const response = await api.get('/certificate-categories/check-slug', {
        params: { slug, exclude_id: excludeId },
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Check slug error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengecek slug',
      };
    }
  },
};

export default certificateCategoryService;