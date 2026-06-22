import api from './api';

const PROGRAM_THEME_ENDPOINTS = {
  LIST: '/program-themes',
  DETAIL: '/program-themes',
  CREATE: '/program-themes',
  UPDATE: '/program-themes',
  DELETE: '/program-themes',
};

class ProgramThemeService {
  /**
   * Get list of program themes with pagination, search, and date filters
   * @param {Object} params - { page, per_page, search, start_date, end_date, organization_id }
   */
  async getProgramThemes(params = {}) {
    try {
      // Filter out empty params
      const filteredParams = {};
      if (params.page) filteredParams.page = params.page;
      if (params.per_page) filteredParams.per_page = params.per_page;
      if (params.search && params.search.trim()) filteredParams.search = params.search.trim();
      if (params.start_date && params.start_date.trim()) filteredParams.start_date = params.start_date;
      if (params.end_date && params.end_date.trim()) filteredParams.end_date = params.end_date;
      if (params.organization_id) filteredParams.organization_id = params.organization_id;
      
      const response = await api.get(PROGRAM_THEME_ENDPOINTS.LIST, { params: filteredParams });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil data tema program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get program theme detail by ID
   * @param {number} id - Program Theme ID
   */
  async getProgramThemeDetail(id) {
    try {
      const response = await api.get(`${PROGRAM_THEME_ENDPOINTS.DETAIL}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal mengambil detail tema program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new program theme
   * @param {Object} themeData - { organization_id, nama, deskripsi, periode, tanggal_mulai, tanggal_selesai, is_active }
   */
  async createProgramTheme(themeData) {
    try {
      const response = await api.post(PROGRAM_THEME_ENDPOINTS.CREATE, themeData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal membuat tema program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update program theme
   * @param {number} id - Program Theme ID
   * @param {Object} themeData - { organization_id, nama, deskripsi, periode, tanggal_mulai, tanggal_selesai, is_active }
   */
  async updateProgramTheme(id, themeData) {
    try {
      const response = await api.put(`${PROGRAM_THEME_ENDPOINTS.UPDATE}/${id}`, themeData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal update tema program',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete program theme
   * @param {number} id - Program Theme ID
   */
  async deleteProgramTheme(id) {
    try {
      const response = await api.delete(`${PROGRAM_THEME_ENDPOINTS.DELETE}/${id}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Gagal hapus tema program',
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
          console.error('Server error:', data);
          return {
            success: false,
            message: data.message || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
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

export default new ProgramThemeService();