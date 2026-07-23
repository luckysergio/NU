import api from './api';

export const anggotaService = {
  async getAll(params = {}) {
    const response = await api.get('/anggotas', { params });
    return response.data;
  },

  async searchBiodata(query) {
    if (!query || query.length < 3) return { success: true, data: [] };
    
    try {
      const response = await api.get('/anggotas/search-biodata', { 
        params: { search: query } 
      });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Gagal mencari data', 
        status: error.response?.status 
      };
    }
  },

  async getById(id) {
    const response = await api.get(`/anggotas/${id}`);
    return response.data;
  },

  async createWithFile(formData) {
    const response = await api.post('/anggotas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateWithFile(id, formData) {
    if (formData instanceof FormData && !formData.has('_method')) {
      formData.append('_method', 'PUT');
    }
    
    const response = await api.post(`/anggotas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/anggotas/${id}`);
    return response.data;
  },

  async getOrganizations(params = {}) {
    const response = await api.get('/organizations', { params });
    return response.data;
  },

  async getJabatans(params = {}) {
    const response = await api.get('/jabatans', { params });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/anggotas/statistics');
    return response.data;
  },
};

export default anggotaService;