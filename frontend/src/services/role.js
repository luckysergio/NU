import api from './api';

export const roleService = {
  async getAll(params = {}) {
    const response = await api.get('/roles', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/roles', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

export default roleService;