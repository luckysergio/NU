import api from './api';

const PROGRAM_TARGET_ENDPOINTS = {
  LIST: '/program-targets',
  DETAIL: '/program-targets',
  CREATE: '/program-targets',
  UPDATE: '/program-targets',
  DELETE: '/program-targets',
};

class ProgramTargetService {
  /**
   * Get list of program targets with pagination and search
   * @param {Object} params - { page, per_page, search }
   */
  async getProgramTargets(params = {}) {
    try {
      const filteredParams = {};
      if (params.page) filteredParams.page = params.page;
      if (params.per_page) filteredParams.per_page = params.per_page;
      if (params.search && params.search.trim()) filteredParams.search = params.search.trim();
      
      const response = await api.get(PROGRAM_TARGET_ENDPOINTS.LIST, { params: filteredParams });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil data sasaran program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get program target detail by ID
   * @param {number} id - Program Target ID
   */
  async getProgramTargetDetail(id) {
    try {
      const response = await api.get(`${PROGRAM_TARGET_ENDPOINTS.DETAIL}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil detail sasaran program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new program target
   * @param {Object} targetData - { nama, is_active }
   */
  async createProgramTarget(targetData) {
    try {
      const response = await api.post(PROGRAM_TARGET_ENDPOINTS.CREATE, targetData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Sasaran program berhasil dibuat',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal membuat sasaran program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update program target
   * @param {number} id - Program Target ID
   * @param {Object} targetData - { nama, is_active }
   */
  async updateProgramTarget(id, targetData) {
    try {
      const response = await api.put(`${PROGRAM_TARGET_ENDPOINTS.UPDATE}/${id}`, targetData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Sasaran program berhasil diupdate',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal update sasaran program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete program target
   * @param {number} id - Program Target ID
   */
  async deleteProgramTarget(id) {
    try {
      const response = await api.delete(`${PROGRAM_TARGET_ENDPOINTS.DELETE}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Sasaran program berhasil dihapus',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal hapus sasaran program',
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

export default new ProgramTargetService();