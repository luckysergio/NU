import api from './api';

export const certificateService = {

  async getAll(params = {}) {
    try {
      const response = await api.get('/certificates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  },

  async getByBiodata(biodataId) {
    try {
      const response = await api.get(`/certificates/biodata/${biodataId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates by biodata:', error);
      throw error;
    }
  },

  async getCategories() {
    try {
      const response = await api.get('/certificates/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate categories:', error);
      throw error;
    }
  },

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

  async delete(id) {
    try {
      const response = await api.delete(`/certificates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  },

  async download(id) {
    try {
      const response = await api.get(`/certificates/${id}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      
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
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true, message: 'File berhasil diunduh' };
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  getFileUrl(filePath) {
    if (!filePath) return null;
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    if (filePath.startsWith('/storage/')) {
      const baseUrl = this.getBaseUrl();
      return `${baseUrl}${filePath}`;
    }
    
    if (filePath.startsWith('storage/')) {
      const baseUrl = this.getBaseUrl();
      return `${baseUrl}/${filePath}`;
    }
    
    const baseUrl = this.getBaseUrl();
    const cleanPath = filePath.replace(/^\/storage\//, '').replace(/^storage\//, '');
    return `${baseUrl}/storage/${cleanPath}`;
  },

  getBaseUrl() {
    const storageUrl = import.meta.env.VITE_STORAGE_URL;
    if (storageUrl) {
      return storageUrl.replace(/\/$/, '');
    }
    
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl.replace(/\/api$/, '').replace(/\/$/, '');
    }
    
    return 'http://localhost:8000';
  },

  isPdf(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ext === 'pdf';
  },

  isImage(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  },

  isDocument(filePath) {
    if (!filePath) return false;
    const ext = filePath.split('.').pop().toLowerCase();
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext);
  },

  getFileExtension(filePath) {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  },

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

  getFileSize(sizeInBytes) {
    if (!sizeInBytes || sizeInBytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    const size = (sizeInBytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    
    return `${size} ${sizes[i]}`;
  },

  async createCategory(data) {
    try {
      const response = await api.post('/certificates/categories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating certificate category:', error);
      throw error;
    }
  },

  async updateCategory(id, data) {
    try {
      const response = await api.put(`/certificates/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating certificate category:', error);
      throw error;
    }
  },

  async deleteCategory(id) {
    try {
      const response = await api.delete(`/certificates/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting certificate category:', error);
      throw error;
    }
  },

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