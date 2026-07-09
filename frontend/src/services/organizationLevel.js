import api from './api';

export const organizationLevelService = {
  async getAll(params = {}) {
    const response = await api.get('/organization-levels', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/organization-levels/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/organization-levels', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/organization-levels/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/organization-levels/${id}`);
    return response.data;
  },
};

export default organizationLevelService;