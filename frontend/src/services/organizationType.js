import api from './api';

export const organizationTypeService = {
  async getAll(params = {}) {
    const response = await api.get('/organization-types', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/organization-types/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/organization-types', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/organization-types/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/organization-types/${id}`);
    return response.data;
  },

  async getAvailableByLevel(levelId) {
    const response = await api.get(
      `/organization-types/available-by-level/${levelId}`,
    );
    return response.data;
  },

  async getUnusedByLevel(levelId, ignoreOrganizationId = null) {
    try {
      const params = {};
      if (ignoreOrganizationId) {
        params.ignore_organization_id = ignoreOrganizationId;
      }
      const response = await api.get(
        `/organization-types/unused-by-level/${levelId}`,
        { params },
      );
      return response.data;
    } catch (error) {
      const fallbackResponse = await api.get(
        `/organization-types/available-by-level/${levelId}`,
      );
      return fallbackResponse.data;
    }
  },

  async getByLevel(levelId) {
    return this.getAvailableByLevel(levelId);
  },
};

export default organizationTypeService;