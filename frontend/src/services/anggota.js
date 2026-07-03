// services/anggota.js
import api from './api';

export const anggotaService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/anggotas', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get anggotas error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/anggotas/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get anggota detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/anggotas', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  // PERBAIKAN: Create dengan file upload
  async createWithFile(formData) {
    try {
      const response = await api.post('/anggotas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create anggota with file error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/anggotas/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  // PERBAIKAN: Update dengan file upload
  async updateWithFile(id, formData) {
    try {
      const response = await api.post(`/anggotas/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update anggota with file error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/anggotas/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete anggota error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getOrganizations(params = {}) {
    try {
      const response = await api.get('/organizations', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
      };
    }
  },

  async getJabatans(params = {}) {
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
};

export default anggotaService;