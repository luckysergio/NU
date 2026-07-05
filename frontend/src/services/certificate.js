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
      
      // Create blob URL
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header
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
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true, message: 'File berhasil diunduh' };
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  /**
   * Get file URL for viewing
   * @param {string} filePath - Path file dari database
   * @returns {string|null} URL lengkap untuk mengakses file
   */
  getFileUrl(filePath) {
    if (!filePath) return null;
    
    // Jika sudah URL lengkap (http/https)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Jika path dimulai dengan /storage/
    if (filePath.startsWith('/storage/')) {
      const baseUrl = this.getBaseUrl();
      return `${baseUrl}${filePath}`;
    }
    
    // Jika path dimulai dengan storage/ (tanpa slash)
    if (filePath.startsWith('storage/')) {
      const baseUrl = this.getBaseUrl();
      return `${baseUrl}/${filePath}`;
    }
    
    // Default: path disimpan di storage/public
    const baseUrl = this.getBaseUrl();
    const cleanPath = filePath.replace(/^\/storage\//, '').replace(/^storage\//, '');
    return `${baseUrl}/storage/${cleanPath}`;
  },

  /**
   * Get base URL untuk storage
   * @returns {string} Base URL
   */
  getBaseUrl() {
    // Priority: VITE_STORAGE_URL, VITE_API_URL, fallback
    const storageUrl = import.meta.env.VITE_STORAGE_URL;
    if (storageUrl) {
      return storageUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl.replace(/\/api$/, '').replace(/\/$/, '');
    }
    
    // Fallback
    return 'http://localhost:8000';
  },

  /**
   * Check if file is PDF
   * @param {string} filePath - Path file
   * @returns {boolean}
   */
  isPdf(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ext === 'pdf';
  },

  /**
   * Check if file is image
   * @param {string} filePath - Path file
   * @returns {boolean}
   */
  isImage(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  },

  /**
   * Check if file is document (Word, Excel, etc)
   * @param {string} filePath - Path file
   * @returns {boolean}
   */
  isDocument(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext);
  },

  /**
   * Get file extension
   * @param {string} filePath - Path file
   * @returns {string} Extension tanpa titik
   */
  getFileExtension(filePath) {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  },

  /**
   * Get file icon based on extension
   * @param {string} filePath - Path file
   * @returns {string} Nama icon
   */
  getFileIcon(filePath) {
    if (!filePath) return 'file';
    
    const ext = this.getFileExtension(filePath);
    const iconMap = {
      pdf: 'file-pdf',
      doc: 'file-word',
      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      pptx: 'file-powerpoint',
      jpg: 'file-image',
      jpeg: 'file-image',
      png: 'file-image',
      gif: 'file-image',
      webp: 'file-image',
      svg: 'file-image',
      zip: 'file-archive',
      rar: 'file-archive',
      '7z': 'file-archive',
    };
    
    return iconMap[ext] || 'file';
  },

  /**
   * Get file size in human readable format
   * @param {number} sizeInBytes - Ukuran file dalam bytes
   * @returns {string} Ukuran file yang sudah diformat
   */
  getFileSize(sizeInBytes) {
    if (!sizeInBytes || sizeInBytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    const size = (sizeInBytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    
    return `${size} ${sizes[i]}`;
  },

  // ===================== CATEGORY MANAGEMENT =====================

  /**
   * Create new certificate category
   * @param {Object} data - { nama: string, deskripsi?: string }
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
   * @param {Object} data - { nama: string, is_active: boolean, deskripsi?: string }
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
   * @param {number} id - Category ID
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