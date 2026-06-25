import api from './api';

export const activityAttendanceService = {
  /**
   * Get all activities with attendance status
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/activities', { params });
      return {
        success: true,
        data: response.data.data,
        accessible_organization_ids: response.data.accessible_organization_ids,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get activities error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data kegiatan',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get attendance detail for a specific activity
   */
  async getAttendance(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/attendance`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get attendance detail error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail absensi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Save attendance for an activity
   */
  async saveAttendance(activityId, anggotaIds) {
    try {
      const response = await api.post(`/activities/${activityId}/attendance`, {
        anggota_ids: anggotaIds,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Save attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menyimpan absensi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * ============ MANAJEMEN ORGANISASI PESERTA ============
   */

  /**
   * Get available organizations for adding to activity
   */
  async getAvailableOrganizations(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/available-organizations`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get available organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi tersedia',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Add participants (organizations) to activity
   */
  async addParticipants(activityId, organizationIds) {
    try {
      const response = await api.post(`/activities/${activityId}/participants`, {
        organization_ids: organizationIds,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Add participants error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menambahkan peserta',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Remove participants (organizations) from activity
   */
  async removeParticipants(activityId, organizationIds) {
    try {
      const response = await api.delete(`/activities/${activityId}/participants`, {
        data: { organization_ids: organizationIds },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Remove participants error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus peserta',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get anggota from selected participant organizations
   */
  async getParticipantAnggota(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/participant-anggotas`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Get participant anggotas error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data anggota peserta',
        errors: error.response?.data?.errors,
      };
    }
  },
};

export default activityAttendanceService;