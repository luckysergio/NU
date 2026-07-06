import api from './api';

export const anggotaService = {
  async getAll(params = {}) {
    const response = await api.get('/anggotas', { params });
    return response.data; // Biarkan TanStack Query menangkap datanya langsung
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

  // Laravel/PHP multipart form-data spoofing method untuk UPDATE (POST dengan _method=PUT)
  async updateWithFile(id, formData) {
    // Memastikan jika form data belum dispoofing method PUT oleh client, kita handle di sini
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