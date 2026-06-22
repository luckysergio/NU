import api from './api';

const WORK_PROGRAM_ENDPOINTS = {
  LIST: '/work-programs',
  DETAIL: '/work-programs',
  CREATE: '/work-programs',
  UPDATE: '/work-programs',
  DELETE: '/work-programs',
  AVAILABLE_THEMES: '/work-programs/available-themes',
};

class WorkProgramService {
  async getWorkPrograms(params = {}) {
    try {
      const filteredParams = {};
      if (params.page) filteredParams.page = params.page;
      if (params.per_page) filteredParams.per_page = params.per_page;
      if (params.search && params.search.trim()) filteredParams.search = params.search.trim();
      if (params.tahun) filteredParams.tahun = params.tahun;
      if (params.status) filteredParams.status = params.status;
      if (params.organization_id) filteredParams.organization_id = params.organization_id;
      
      const response = await api.get(WORK_PROGRAM_ENDPOINTS.LIST, { params: filteredParams });
      
      // Handle berbagai format response
      if (response.data?.success === true && response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Berhasil mengambil data',
        };
      }
      
      if (response.data?.success === true && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: {
            data: response.data.data,
            current_page: 1,
            last_page: 1,
            per_page: response.data.data.length,
            total: response.data.data.length,
          },
          message: response.data.message || 'Berhasil mengambil data',
        };
      }
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.current_page !== undefined) {
        return {
          success: true,
          data: response.data,
          message: 'Berhasil mengambil data',
        };
      }
      
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: {
            data: response.data,
            current_page: 1,
            last_page: 1,
            per_page: response.data.length,
            total: response.data.length,
          },
          message: 'Berhasil mengambil data',
        };
      }
      
      if (response.data?.success === true && response.data?.data && !Array.isArray(response.data.data)) {
        return {
          success: true,
          data: {
            data: [response.data.data],
            current_page: 1,
            last_page: 1,
            per_page: 1,
            total: 1,
          },
          message: response.data.message || 'Berhasil mengambil data',
        };
      }
      
      return {
        success: true,
        data: { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 },
        message: 'Berhasil mengambil data',
      };
      
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWorkProgramDetail(id) {
    try {
      const response = await api.get(`${WORK_PROGRAM_ENDPOINTS.DETAIL}/${id}`);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Berhasil mengambil detail',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createWorkProgram(programData) {
    try {
      const response = await api.post(WORK_PROGRAM_ENDPOINTS.CREATE, programData);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Program kerja berhasil dibuat',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateWorkProgram(id, programData) {
    try {
      const response = await api.put(`${WORK_PROGRAM_ENDPOINTS.UPDATE}/${id}`, programData);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Program kerja berhasil diupdate',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteWorkProgram(id) {
    try {
      const response = await api.delete(`${WORK_PROGRAM_ENDPOINTS.DELETE}/${id}`);
      
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      
      return {
        success: true,
        message: response.data?.message || 'Program kerja berhasil dihapus',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAvailableThemesForMWC() {
    try {
      const response = await api.get(WORK_PROGRAM_ENDPOINTS.AVAILABLE_THEMES);

      if (response.data && response.data.success !== undefined) {
        return response.data;
      }

      return {
        success: true,
        data: response.data?.data || {
          available_themes: [],
          total_themes: 0,
          used_themes: 0,
          available_count: 0,
        },
        message: response.data?.message || 'Berhasil mengambil data tema',
      };
    } catch (error) {
      return this.handleError(error, {
        available_themes: [],
        total_themes: 0,
        used_themes: 0,
        available_count: 0,
      });
    }
  }

  handleError(error, fallbackData = null) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return {
            success: false,
            message: data?.message || 'Sesi berakhir, silakan login kembali',
            data: fallbackData,
          };
        case 403:
          return {
            success: false,
            message: data?.message || 'Anda tidak memiliki akses',
            data: fallbackData,
          };
        case 422:
          const errors = data?.errors || {};
          const firstError = Object.values(errors)[0]?.[0] || data?.message || 'Validasi gagal';
          return {
            success: false,
            message: firstError,
            errors: errors,
            data: fallbackData,
          };
        case 500:
          return {
            success: false,
            message: data?.message || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
            data: fallbackData,
          };
        default:
          return {
            success: false,
            message: data?.message || 'Terjadi kesalahan',
            data: fallbackData,
          };
      }
    } else if (error.request) {
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        data: fallbackData,
      };
    } else {
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan',
        data: fallbackData,
      };
    }
  }
}

export default new WorkProgramService();