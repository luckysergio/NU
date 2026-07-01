// src/services/dashboard.js
import api from './api';

export const dashboardService = {
  async getDashboard() {
    try {
      const response = await api.get('/dashboard');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dashboard berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data dashboard',
        errors: error.response?.data?.errors,
      };
    }
  },

  async refreshDashboard() {
    try {
      const response = await api.post('/dashboard/refresh');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dashboard berhasil di-refresh',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal refresh dashboard',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getThemeChartData(themeId) {
    try {
      // Gunakan endpoint yang sesuai dengan route: /dashboard/themes/{themeId}/chart
      const response = await api.get(`/dashboard/themes/${themeId}/chart`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Data chart tema berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data chart tema',
        errors: error.response?.data?.errors,
      };
    }
  },

  async refreshThemeChart(themeId) {
    try {
      const response = await api.post(`/dashboard/themes/${themeId}/refresh`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Chart berhasil di-refresh',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal refresh chart',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getThemeStatistics(themeId) {
    try {
      const response = await api.get(`/dashboard/theme-statistics/${themeId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Statistik tema berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik tema',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getThemeDetail(themeId) {
    try {
      const response = await api.get(`/dashboard/themes/${themeId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail tema berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail tema',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getOrganizationsDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/organizations', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail organisasi berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail organisasi',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getMembersDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/members', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail anggota berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail anggota',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getWorkProgramsDetail(params = {}) {
    try {
      const response = await api.get('/dashboard/work-programs', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Detail program kerja berhasil diambil',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default dashboardService;