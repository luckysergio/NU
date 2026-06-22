import api from './api';

const PROGRAM_FIELD_ENDPOINTS = {
  LIST: '/program-fields',
  DETAIL: '/program-fields',
  CREATE: '/program-fields',
  UPDATE: '/program-fields',
  DELETE: '/program-fields',
};

class ProgramFieldService {
  /**
   * Get list of program fields with pagination and search
   * @param {Object} params - { page, per_page, search }
   */
  async getProgramFields(params = {}) {
    try {
      const filteredParams = {};
      if (params.page) filteredParams.page = params.page;
      if (params.per_page) filteredParams.per_page = params.per_page;
      if (params.search && params.search.trim()) filteredParams.search = params.search.trim();
      
      const response = await api.get(PROGRAM_FIELD_ENDPOINTS.LIST, { params: filteredParams });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil data bidang program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get program field detail by ID
   * @param {number} id - Program Field ID
   */
  async getProgramFieldDetail(id) {
    try {
      const response = await api.get(`${PROGRAM_FIELD_ENDPOINTS.DETAIL}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil detail bidang program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new program field
   * @param {Object} fieldData - { nama, is_active }
   */
  async createProgramField(fieldData) {
    try {
      const response = await api.post(PROGRAM_FIELD_ENDPOINTS.CREATE, fieldData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: 'Bidang program berhasil dibuat',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal membuat bidang program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update program field
   * @param {number} id - Program Field ID
   * @param {Object} fieldData - { nama, is_active }
   */
  async updateProgramField(id, fieldData) {
    try {
      const response = await api.put(`${PROGRAM_FIELD_ENDPOINTS.UPDATE}/${id}`, fieldData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: 'Bidang program berhasil diupdate',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal update bidang program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete program field
   * @param {number} id - Program Field ID
   */
  async deleteProgramField(id) {
    try {
      const response = await api.delete(`${PROGRAM_FIELD_ENDPOINTS.DELETE}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Bidang program berhasil dihapus',
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal hapus bidang program',
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

export default new ProgramFieldService();