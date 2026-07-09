import api from './api';

export const kelurahanService = {
  async getAll(params = {}) {
    const response = await api.get('/kelurahans', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/kelurahans/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/kelurahans', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/kelurahans/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/kelurahans/${id}`);
    return response.data;
  },

  async getAvailableForRanting(
    kecamatanId,
    kotaId = null,
    ignoreOrganizationId = null,
  ) {
    const params = {};
    if (kecamatanId) params.kecamatan_id = kecamatanId;
    if (kotaId) params.kota_id = kotaId;
    if (ignoreOrganizationId)
      params.ignore_organization_id = ignoreOrganizationId;
    const response = await api.get('/kelurahans/available-for-ranting', {
      params,
    });
    return response.data;
  },

  async getByKecamatan(kecamatanId) {
    const response = await api.get('/kelurahans', {
      params: { kecamatan_id: kecamatanId, per_page: 100 },
    });
    return response.data;
  },

  async getByKota(kotaId) {
    const response = await api.get('/kelurahans', {
      params: { kota_id: kotaId, per_page: 100 },
    });
    return response.data;
  },
};

export default kelurahanService;