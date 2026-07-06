// src/services/activityService.js
import api from './api';

export const activityService = {
  /**
   * Get all activities with pagination and filters
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/activities', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil data kegiatan',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single activity by ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/activities/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil detail kegiatan',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Create new activity
   */
  async create(formData) {
    try {
      const response = await api.post('/activities', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Kegiatan berhasil dibuat',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update existing activity
   */
  async update(id, formData) {
    try {
      const response = await api.post(`/activities/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Kegiatan berhasil diupdate',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete activity
   */
  async delete(id) {
    try {
      const response = await api.delete(`/activities/${id}`);
      return {
        success: true,
        message: response.data.message || 'Kegiatan berhasil dihapus',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update activity status
   */
  async updateStatus(id, status) {
    try {
      const response = await api.patch(`/activities/${id}/status`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Status kegiatan berhasil diupdate',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate status kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  // =========================================================================
  // ✅ BACKWARD COMPATIBILITY - Alias untuk method lama
  // =========================================================================

  async getActivities(params = {}) {
    return this.getAll(params);
  },

  async getActivityDetail(id) {
    return this.getById(id);
  },

  async createActivity(formData) {
    return this.create(formData);
  },

  async updateActivity(id, formData) {
    return this.update(id, formData);
  },

  async deleteActivity(id) {
    return this.delete(id);
  },
};

// ✅ Default export untuk backward compatibility
export default activityService;