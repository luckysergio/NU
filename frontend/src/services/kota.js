import api from './api';

export const kotaService = {
  async getAll(params = {}) {
    const response = await api.get('/kotas', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/kotas/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/kotas', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/kotas/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/kotas/${id}`);
    return response.data;
  },

  async getAvailableForPC(ignoreOrganizationId = null) {
    const params = {};
    if (ignoreOrganizationId) {
      params.ignore_organization_id = ignoreOrganizationId;
    }
    const response = await api.get('/kotas/available-for-pc', { params });
    return response.data;
  },
};

export default kotaService;