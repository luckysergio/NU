import api from './api';

export const programTargetService = {
  async getAll(params = {}) {
    const response = await api.get('/program-targets', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/program-targets/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/program-targets', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/program-targets/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/program-targets/${id}`);
    return response.data;
  },
};

export default programTargetService;