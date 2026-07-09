import api from './api';

export const kecamatanService = {
  async getAll(params = {}) {
    const response = await api.get('/kecamatans', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/kecamatans/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/kecamatans', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/kecamatans/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/kecamatans/${id}`);
    return response.data;
  },

  async getAvailableForMWC(kotaId, ignoreOrganizationId = null) {
    const params = {};
    if (kotaId) params.kota_id = kotaId;
    if (ignoreOrganizationId) params.ignore_organization_id = ignoreOrganizationId;
    const response = await api.get('/kecamatans/available-for-mwc', { params });
    return response.data;
  },

  async getAvailableForBanom(kotaId, typeId = null, currentId = null) {
    const params = {};
    if (kotaId) params.kota_id = kotaId;
    if (typeId) params.type_id = typeId;
    if (currentId) params.current_id = currentId;
    const response = await api.get('/kecamatans/available-for-banom', { params });
    return response.data;
  },

  async getByKota(kotaId) {
    const response = await api.get('/kecamatans', {
      params: { kota_id: kotaId, per_page: 100 },
    });
    return response.data;
  },
};

export default kecamatanService;