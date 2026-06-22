import api from './api';

const PROGRAM_GOAL_ENDPOINTS = {
  LIST: '/program-goals',
  DETAIL: '/program-goals',
  CREATE: '/program-goals',
  UPDATE: '/program-goals',
  DELETE: '/program-goals',
};

class ProgramGoalService {
  /**
   * Get list of program goals with pagination and search
   * @param {Object} params - { page, per_page, search }
   */
  async getProgramGoals(params = {}) {
    try {
      const filteredParams = {};
      if (params.page) filteredParams.page = params.page;
      if (params.per_page) filteredParams.per_page = params.per_page;
      if (params.search && params.search.trim()) filteredParams.search = params.search.trim();
      
      const response = await api.get(PROGRAM_GOAL_ENDPOINTS.LIST, { params: filteredParams });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil data tujuan program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get program goal detail by ID
   * @param {number} id - Program Goal ID
   */
  async getProgramGoalDetail(id) {
    try {
      const response = await api.get(`${PROGRAM_GOAL_ENDPOINTS.DETAIL}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil detail tujuan program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new program goal
   * @param {Object} goalData - { nama, is_active }
   */
  async createProgramGoal(goalData) {
    try {
      const response = await api.post(PROGRAM_GOAL_ENDPOINTS.CREATE, goalData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Tujuan program berhasil dibuat',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal membuat tujuan program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update program goal
   * @param {number} id - Program Goal ID
   * @param {Object} goalData - { nama, is_active }
   */
  async updateProgramGoal(id, goalData) {
    try {
      const response = await api.put(`${PROGRAM_GOAL_ENDPOINTS.UPDATE}/${id}`, goalData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Tujuan program berhasil diupdate',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal update tujuan program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete program goal
   * @param {number} id - Program Goal ID
   */
  async deleteProgramGoal(id) {
    try {
      const response = await api.delete(`${PROGRAM_GOAL_ENDPOINTS.DELETE}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Tujuan program berhasil dihapus',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal hapus tujuan program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return {
            success: false,
            message: data.message || 'Sesi berakhir, silakan login kembali',
          };
        case 403:
          return {
            success: false,
            message: data.message || 'Anda tidak memiliki akses',
          };
        case 422:
          const errors = data.errors || {};
          const firstError = Object.values(errors)[0]?.[0] || data.message || 'Validasi gagal';
          return {
            success: false,
            message: firstError,
            errors: errors,
          };
        case 500:
          return {
            success: false,
            message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
          };
        default:
          return {
            success: false,
            message: data.message || 'Terjadi kesalahan',
          };
      }
    } else if (error.request) {
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan',
      };
    }
  }
}

export default new ProgramGoalService();