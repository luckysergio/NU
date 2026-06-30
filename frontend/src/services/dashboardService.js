// services/dashboardService.js
import api from './api';

export const dashboardService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard data with organizations, members, and programs
   */
  async getDashboard() {
    try {
      const response = await api.get('/dashboard');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dashboard berhasil diambil',
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data dashboard',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get organizations detail with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.level - Filter by organization level (pc, mwc, ranting, anak-ranting, lembaga, banom)
   * @param {number} params.pc_id - Filter by PC ID (for super admin)
   */
  async getOrganizationsDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/organizations', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail organisasi berhasil diambil',
      };
    } catch (error) {
      console.error('Get organizations detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get members detail with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.organization_id - Filter by organization ID
   * @param {string} params.level - Filter by organization level
   * @param {number} params.per_page - Items per page (default: 20)
   * @param {number} params.page - Page number
   */
  async getMembersDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/members', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail anggota berhasil diambil',
        pagination: response.data.data?.pagination || null,
      };
    } catch (error) {
      console.error('Get members detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get work programs detail with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.theme_id - Filter by theme ID
   * @param {number} params.mwc_id - Filter by MWC ID
   * @param {number} params.per_page - Items per page (default: 20)
   * @param {number} params.page - Page number
   */
  async getWorkProgramsDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/work-programs', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail program kerja berhasil diambil',
        pagination: response.data.data?.pagination || null,
      };
    } catch (error) {
      console.error('Get work programs detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get theme detail with statistics
   * @param {number} themeId - Theme ID
   */
  async getThemeDetail(themeId) {
    try {
      const response = await api.get(`/dashboard/themes/${themeId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail tema berhasil diambil',
      };
    } catch (error) {
      console.error('Get theme detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail tema',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get theme statistics for a specific MWC
   * @param {number} themeId - Theme ID
   * @param {number} mwcId - MWC ID
   */
  async getThemeStatistics(themeId, mwcId) {
    try {
      const response = await api.get(`/program-themes/${themeId}/statistics/${mwcId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Statistik tema berhasil diambil',
      };
    } catch (error) {
      console.error('Get theme statistics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik tema',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get work program statistics
   * @param {number} workProgramId - Work Program ID
   */
  async getWorkProgramStatistics(workProgramId) {
    try {
      const response = await api.get(`/work-programs/${workProgramId}/statistics`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Statistik program kerja berhasil diambil',
      };
    } catch (error) {
      console.error('Get work program statistics error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  // ============ TAMBAHKAN INI ============
  /**
   * Get chart data for a specific theme
   * @param {number} themeId - Theme ID
   */
  async getThemeChartData(themeId) {
    try {
      const response = await api.get(`/dashboard/themes/${themeId}/chart`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Data chart tema berhasil diambil',
      };
    } catch (error) {
      console.error('Get theme chart data error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data chart tema',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default dashboardService;