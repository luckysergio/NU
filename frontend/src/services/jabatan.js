import api from './api';

export const jabatanService = {
  async getAll(params = {}) {
    const response = await api.get('/jabatans', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/jabatans/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/jabatans', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/jabatans/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/jabatans/${id}`);
    return response.data;
  },

  async getActive(level = null) {
    const params = {};
    if (level) params.level = level;
    const response = await api.get('/jabatans/active', { params });
    return response.data;
  },

  async getByLevel(level) {
    const response = await api.get('/jabatans/by-level', { params: { level } });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/jabatans/statistics');
    return response.data;
  },

  async toggleActive(id) {
    const response = await api.patch(`/jabatans/${id}/toggle-active`);
    return response.data;
  },
};

export default jabatanService;