import api from './api';

export const activityAttendanceService = {
  async getAllOrganizations() {
    try {
      const response = await api.get('/attendance/organizations');
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil data organisasi', status: error.response?.status };
    }
  },

  async getAll(params = {}) {
    try {
      const response = await api.get('/attendance/activities', { params });
      return { 
        success: true, 
        data: response.data.data, 
        accessible_organization_ids: response.data.accessible_organization_ids,
        message: response.data.message 
      };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil data kegiatan', status: error.response?.status };
    }
  },

  async getAttendance(activityId) {
    try {
      const response = await api.get(`/attendance/activities/${activityId}`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil detail absensi', status: error.response?.status };
    }
  },

  async saveAttendance(activityId, biodataIds) {
    try {
      const response = await api.post(`/attendance/activities/${activityId}/attendance`, { 
        biodata_ids: biodataIds 
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal menyimpan absensi', status: error.response?.status };
    }
  },

  async getAllOrganizationsUnderPC() {
    try {
      const response = await api.get('/attendance/organizations-under-pc');
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil data organisasi', status: error.response?.status };
    }
  },

  async getAvailableOrganizations(activityId) {
    try {
      const response = await api.get(`/attendance/activities/${activityId}/available-organizations`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil data organisasi', status: error.response?.status };
    }
  },

  async addParticipants(activityId, organizationIds) {
    try {
      const response = await api.post(`/attendance/activities/${activityId}/participants`, { organization_ids: organizationIds });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal menambahkan peserta', status: error.response?.status };
    }
  },

  async removeParticipants(activityId, organizationIds) {
    try {
      const response = await api.delete(`/attendance/activities/${activityId}/participants`, { data: { organization_ids: organizationIds } });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal menghapus peserta', status: error.response?.status };
    }
  },

  async getParticipantAnggota(activityId) {
    try {
      const response = await api.get(`/attendance/activities/${activityId}/participant-anggotas`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Gagal mengambil data anggota', status: error.response?.status };
    }
  },
};

export default activityAttendanceService;