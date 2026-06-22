import api from './api';

export const activityService = {
  /**
   * Get all activities with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @param {string} params.search - Search by activity name
   * @param {number} params.organization_id - Filter by organization
   * @param {number} params.work_program_id - Filter by work program
   * @param {string} params.status - Filter by status (draft, completed, cancelled)
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/activities', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
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
   * @param {number} id - Activity ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/activities/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
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
   * @param {FormData} formData - Form data with files
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
        message: response.data.message,
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
   * @param {number} id - Activity ID
   * @param {FormData} formData - Form data with files
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
        message: response.data.message,
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
   * @param {number} id - Activity ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/activities/${id}`);
      return {
        success: true,
        message: response.data.message,
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
   * @param {number} id - Activity ID
   * @param {string} status - Status (draft, completed, cancelled)
   */
  async updateStatus(id, status) {
    try {
      const response = await api.patch(`/activities/${id}/status`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate status kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default activityService;