// src/services/certificate.js
import api from './api';

export const certificateService = {
  /**
   * Get all certificates with pagination and filters
   */
  async getAll(params = {}) {
    try {
      const response = await api.get('/certificates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  /**
   * Get single certificate by ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  },

  /**
   * Get certificates by anggota ID
   */
  async getByAnggota(anggotaId) {
    try {
      const response = await api.get(`/certificates/anggota/${anggotaId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates by anggota:', error);
      throw error;
    }
  },

  /**
   * Get certificate categories
   */
  async getCategories() {
    try {
      const response = await api.get('/certificates/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate categories:', error);
      throw error;
    }
  },

  /**
   * Create new certificate with file upload
   */
  async create(data) {
    try {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      const response = await api.post('/certificates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  },

  /**
   * Update certificate with file upload
   */
  async update(id, data) {
    try {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      formData.append('_method', 'PUT');

      const response = await api.post(`/certificates/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  },

  /**
   * Delete certificate
   */
  async delete(id) {
    try {
      const response = await api.delete(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  },

  /**
   * Download certificate file
   */
  async download(id) {
    try {
      const response = await api.get(`/certificates/${id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'sertifikat.pdf';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'File berhasil diunduh' };
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  /**
   * Get file URL for viewing
   */
  getFileUrl(filePath) {
    if (!filePath) return null;
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const baseUrl = import.meta.env.VITE_STORAGE_URL || 
                    import.meta.env.VITE_API_URL?.replace('/api', '') || 
                    'http://localhost:8000';
    
    const cleanPath = filePath.replace(/^\/storage\//, '');
    return `${baseUrl}/storage/${cleanPath}`;
  },

  // ===================== CATEGORY MANAGEMENT =====================

  /**
   * Create new certificate category
   * @param {Object} data - { nama: string }
   */
  async createCategory(data) {
    try {
      const response = await api.post('/certificates/categories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating certificate category:', error);
      throw error;
    }
  },

  /**
   * Update certificate category
   * @param {number} id - Category ID
   * @param {Object} data - { nama: string, is_active: boolean }
   */
  async updateCategory(id, data) {
    try {
      const response = await api.put(`/certificates/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating certificate category:', error);
      throw error;
    }
  },

  /**
   * Delete certificate category
   * @param {number} id - Category ID
   */
  async deleteCategory(id) {
    try {
      const response = await api.delete(`/certificates/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting certificate category:', error);
      throw error;
    }
  },

  /**
   * Get single certificate category by ID
   */
  async getCategoryById(id) {
    try {
      const response = await api.get(`/certificates/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate category:', error);
      throw error;
    }
  },
};

export default certificateService;