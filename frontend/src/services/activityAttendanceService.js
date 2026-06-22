import api from './api';

export const activityAttendanceService = {
  /**
   * Get participant organizations for an activity
   * @param {number} activityId - Activity ID
   */
  async getParticipants(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/participants`);
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'Berhasil mengambil data peserta',
      };
    } catch (error) {
      console.error('Get participants error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data peserta',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Add participant organizations to an activity
   * @param {number} activityId - Activity ID
   * @param {number[]} organizationIds - Array of organization IDs
   */
  async addParticipants(activityId, organizationIds) {
    try {
      const response = await api.post(`/activities/${activityId}/participants`, {
        organization_ids: organizationIds || [],
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil menyimpan peserta',
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
   * Get available organizations for attendance selection
   * @param {number} activityId - Activity ID
   */
  async getAvailableOrganizations(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/available-organizations`);
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'Berhasil mengambil data organisasi',
      };
    } catch (error) {
      console.error('Get available organizations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data organisasi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Get all attendance data for an activity
   * @param {number} activityId - Activity ID
   */
  async getAttendance(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/attendance`);
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'Berhasil mengambil data absensi',
      };
    } catch (error) {
      console.error('Get attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data absensi',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },

  /**
   * Save attendance for an activity (Admin)
   * @param {number} activityId - Activity ID
   * @param {Array} attendances - Array of attendance objects
   * @example attendances = [
   *   { anggota_id: 1, is_present: true, kritik: null, saran: null },
   *   { anggota_id: 2, is_present: false, kritik: 'Acara terlalu panjang', saran: 'Durasi dipersingkat' }
   * ]
   */
  async saveAttendance(activityId, attendances) {
    try {
      const response = await api.post(`/activities/${activityId}/attendance/admin`, {
        attendances: attendances || [],
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil menyimpan data absensi',
      };
    } catch (error) {
      console.error('Save attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menyimpan data absensi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Self attendance for a member
   * @param {number} activityId - Activity ID
   * @param {number} anggotaId - Member ID
   */
  async selfAttendance(activityId, anggotaId) {
    try {
      const response = await api.post(`/activities/${activityId}/attendance/self`, {
        anggota_id: anggotaId,
        is_present: true,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil melakukan absensi',
      };
    } catch (error) {
      console.error('Self attendance error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal melakukan absensi',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Submit feedback for an activity (for absent members)
   * @param {number} activityId - Activity ID
   * @param {number} anggotaId - Member ID
   * @param {string} kritik - Criticism
   * @param {string} saran - Suggestion
   */
  async submitFeedback(activityId, anggotaId, kritik, saran) {
    try {
      const response = await api.post(`/activities/${activityId}/feedback`, {
        anggota_id: anggotaId,
        kritik: kritik || '',
        saran: saran || '',
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengirim feedback',
      };
    } catch (error) {
      console.error('Submit feedback error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengirim feedback',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get anggota from specific organization for attendance
   * @param {number} activityId - Activity ID
   * @param {number} organizationId - Organization ID
   */
  async getAnggotaByOrganization(activityId, organizationId) {
    try {
      const response = await api.get(`/activities/${activityId}/organizations/${organizationId}/anggotas`);
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || 'Berhasil mengambil data anggota',
      };
    } catch (error) {
      console.error('Get anggota by organization error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data anggota',
        errors: error.response?.data?.errors,
        data: [],
      };
    }
  },
};

export default activityAttendanceService;