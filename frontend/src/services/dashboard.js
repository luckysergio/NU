import api from './api';
import echo from './echo';

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
      const response = await api.get(`/dashboard/theme-chart/${themeId}`);
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
      const response = await api.post(`/dashboard/theme-chart/${themeId}/refresh`);
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

  subscribeDashboard(callback) {
    try {
      if (!echo) return null;

      const channel = echo.channel('dashboard');
      
      channel.listen('dashboard.updated', (event) => {
        callback(event);
      });

      return channel;
    } catch (error) {
      return null;
    }
  },

  subscribeThemeChart(themeId, callback) {
    try {
      if (!echo) return null;

      const channel = echo.channel(`theme-chart.${themeId}`);
      
      channel.listen('theme.chart.updated', (event) => {
        callback(event);
      });

      return channel;
    } catch (error) {
      return null;
    }
  },

  unsubscribe(channel) {
    if (!channel) return;
    
    try {
      if (typeof channel.stopListening === 'function') {
        channel.stopListening();
      }
      if (echo && typeof echo.leaveChannel === 'function') {
        try {
          echo.leaveChannel(channel.name);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  },
};

export default dashboardService;