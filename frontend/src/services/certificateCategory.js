import api from './api';

export const certificateCategoryService = {
  async getAll(params = {}) {
    const response = await api.get('/certificate-categories', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/certificate-categories/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/certificate-categories', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/certificate-categories/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/certificate-categories/${id}`);
    return response.data;
  },

  async toggleStatus(id) {
    const response = await api.patch(
      `/certificate-categories/${id}/toggle-status`,
    );
    return response.data;
  },

  async getActive() {
    const response = await api.get('/certificate-categories/active');
    return response.data;
  },

  async getWithCount() {
    const response = await api.get('/certificate-categories/with-count');
    return response.data;
  },

  async getBySlug(slug) {
    const response = await api.get(`/certificate-categories/slug/${slug}`);
    return response.data;
  },

  async checkSlug(slug, excludeId = null) {
    const response = await api.get('/certificate-categories/check-slug', {
      params: { slug, exclude_id: excludeId },
    });
    return response.data;
  },
};

export default certificateCategoryService;