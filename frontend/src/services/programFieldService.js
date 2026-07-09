import api from './api';

export const programFieldService = {
  async getAll(params = {}) {
    const response = await api.get('/program-fields', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/program-fields/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/program-fields', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/program-fields/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/program-fields/${id}`);
    return response.data;
  },
};

export default programFieldService;