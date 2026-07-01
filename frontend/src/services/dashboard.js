// src/services/dashboard.js
import api from './api';
import echo from './echo';

export const dashboardService = {
  // Get dashboard data
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

  // Refresh dashboard data
  async refreshDashboard() {
    try {
      const response = await api.post('/dashboard/refresh');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dashboard berhasil di-refresh',
      };
    } catch (error) {
      console.error('Refresh dashboard error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal refresh dashboard',
        errors: error.response?.data?.errors,
      };
    }
  },

  // Get theme chart data
  async getThemeChartData(themeId) {
    try {
      const response = await api.get(`/dashboard/theme-chart/${themeId}`);
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

  // Refresh theme chart
  async refreshThemeChart(themeId) {
    try {
      const response = await api.post(`/dashboard/theme-chart/${themeId}/refresh`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Chart berhasil di-refresh',
      };
    } catch (error) {
      console.error('Refresh theme chart error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal refresh chart',
        errors: error.response?.data?.errors,
      };
    }
  },

  // Get theme statistics
  async getThemeStatistics(themeId) {
    try {
      const response = await api.get(`/dashboard/theme-statistics/${themeId}`);
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

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  subscribeDashboard(callback) {
    console.log('🔌 Subscribing to dashboard channel...');
    
    try {
      if (!echo) {
        console.warn('⚠️ Echo not initialized, real-time updates disabled');
        return null;
      }

      const channel = echo.channel('dashboard');
      
      channel.listen('dashboard.updated', (event) => {
        console.log('📊 Dashboard real-time update received:', event);
        callback(event);
      });

      channel.subscribed(() => {
        console.log('✅ Successfully subscribed to dashboard channel');
      });
      
      channel.error((error) => {
        console.error('❌ Dashboard channel error:', error);
      });

      return channel;
    } catch (error) {
      console.error('❌ Error subscribing to dashboard channel:', error);
      return null;
    }
  },

  subscribeThemeChart(themeId, callback) {
    console.log(`🔌 Subscribing to theme chart channel for theme ${themeId}...`);
    
    try {
      if (!echo) {
        console.warn('⚠️ Echo not initialized, real-time updates disabled');
        return null;
      }

      const channel = echo.channel(`theme-chart.${themeId}`);
      
      channel.listen('theme.chart.updated', (event) => {
        console.log(`📈 Theme chart ${themeId} real-time update:`, event);
        callback(event);
      });

      channel.subscribed(() => {
        console.log(`✅ Successfully subscribed to theme chart channel ${themeId}`);
      });
      
      channel.error((error) => {
        console.error(`❌ Theme chart ${themeId} channel error:`, error);
      });

      return channel;
    } catch (error) {
      console.error(`❌ Error subscribing to theme chart channel ${themeId}:`, error);
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
      console.log('🔌 Unsubscribed from channel:', channel.name);
    } catch (e) {
      console.debug('Unsubscribe error (ignored):', e.message);
    }
  },
};

export default dashboardService;