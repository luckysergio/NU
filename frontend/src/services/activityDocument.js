import api from './api';

export const activityDocumentService = {
  /**
   * Get all documents by activity ID
   * @param {number} activityId - Activity ID
   * @param {Object} params - Query parameters
   */
  async getAll(activityId, params = {}) {
    try {
      const response = await api.get(`/activities/${activityId}/documents`, { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil data dokumen',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get single document by ID
   * @param {number} id - Document ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/documents/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil detail dokumen',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Upload multiple documents
   * @param {number} activityId - Activity ID
   * @param {FormData} formData - Form data dengan files
   */
  async upload(activityId, formData) {
    try {
      const response = await api.post(`/activities/${activityId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dokumen berhasil diupload',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupload dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update document metadata
   * @param {number} id - Document ID
   * @param {Object} data - Data update (description, category)
   */
  async update(id, data) {
    try {
      const response = await api.put(`/documents/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Dokumen berhasil diupdate',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete document
   * @param {number} id - Document ID
   */
  async delete(id) {
    try {
      const response = await api.delete(`/documents/${id}`);
      return {
        success: true,
        message: response.data.message || 'Dokumen berhasil dihapus',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus dokumen',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get document statistics
   * @param {number} activityId - Activity ID
   */
  async getStatistics(activityId) {
    try {
      const response = await api.get(`/activities/${activityId}/documents/statistics`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil statistik',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil statistik',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get upload options (categories, allowed types)
   */
  async getOptions() {
    try {
      const response = await api.get('/activity-documents/options');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil opsi upload',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil opsi upload',
        errors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Get download URL for document
   * @param {number} id - Document ID
   * @returns {string} Download URL
   */
  getDownloadUrl(id) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return `${baseUrl}/documents/${id}/download`;
  },

  /**
   * Get file URL for preview
   * @param {string} filePath - File path from storage
   * @returns {string} Full URL
   */
  getFileUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const baseUrl = import.meta.env.VITE_STORAGE_URL || 
                    import.meta.env.VITE_BASE_URL || 
                    'http://localhost:8000';
    const cleanBaseUrl = baseUrl.replace(/\/storage$/, '');
    const cleanPath = filePath.replace(/^\/storage\//, '');
    return `${cleanBaseUrl}/storage/${cleanPath}`;
  },

  // =========================================================================
  // ✅ BACKWARD COMPATIBILITY - Alias untuk method lama
  // =========================================================================

  async getDocuments(activityId, params) {
    return this.getAll(activityId, params);
  },

  async getDocumentDetail(id) {
    return this.getById(id);
  },

  async uploadDocuments(activityId, formData) {
    return this.upload(activityId, formData);
  },

  async updateDocument(id, data) {
    return this.update(id, data);
  },

  async deleteDocument(id) {
    return this.delete(id);
  },

  async getDocumentStatistics(activityId) {
    return this.getStatistics(activityId);
  },
};

export default activityDocumentService;