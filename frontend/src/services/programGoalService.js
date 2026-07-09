import api from './api';

export const programGoalService = {
  async getAll(params = {}) {
    const response = await api.get('/program-goals', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/program-goals/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/program-goals', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/program-goals/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/program-goals/${id}`);
    return response.data;
  },
};

export default programGoalService;