import api from './api';

export const rwService = {
  async getAll(params = {}) {
    const response = await api.get('/rws', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/rws/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/rws', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/rws/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/rws/${id}`);
    return response.data;
  },

  async getAvailableForAnakRanting(
    kelurahanId = null,
    ignoreOrganizationId = null,
  ) {
    const params = {};
    if (kelurahanId) params.kelurahan_id = kelurahanId;
    if (ignoreOrganizationId)
      params.ignore_organization_id = ignoreOrganizationId;
    const response = await api.get('/rws/available-for-anak-ranting', {
      params,
    });
    return response.data;
  },
};

export default rwService;