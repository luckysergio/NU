import api from './api';

export const workProgramService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/work-programs', { params });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil data',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/work-programs/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Berhasil mengambil detail',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil detail program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  async create(data) {
    try {
      const response = await api.post('/work-programs', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Program kerja berhasil dibuat',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/work-programs/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Program kerja berhasil diupdate',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengupdate program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/work-programs/${id}`);
      return {
        success: true,
        message: response.data.message || 'Program kerja berhasil dihapus',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal menghapus program kerja',
        errors: error.response?.data?.errors,
      };
    }
  },

  async getWorkPrograms(params = {}) {
    return this.getAll(params);
  },

  async getWorkProgramDetail(id) {
    return this.getById(id);
  },

  async createWorkProgram(data) {
    return this.create(data);
  },

  async updateWorkProgram(id, data) {
    return this.update(id, data);
  },

  async deleteWorkProgram(id) {
    return this.delete(id);
  },

  async getAvailableThemes() {
    try {
      const response = await api.get('/work-programs/available-themes');
      return {
        success: true,
        data: response.data.data || {
          available_themes: [],
          total_themes: 0,
          used_themes: 0,
          available_count: 0,
        },
        message: response.data.message || 'Berhasil mengambil data tema',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal mengambil data tema',
        data: {
          available_themes: [],
          total_themes: 0,
          used_themes: 0,
          available_count: 0,
        },
      };
    }
  },

  async getAvailableThemesForMWC() {
    return this.getAvailableThemes();
  },


  async getStatistics(id) {
    try {
      const response = await api.get(`/work-programs/${id}/statistics`);
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

  async getThemes(params = {}) {
    try {
      const validParams = {};
      
      if (params.search && params.search.trim()) validParams.search = params.search.trim();
      if (params.start_date) validParams.start_date = params.start_date;
      if (params.end_date) validParams.end_date = params.end_date;
      if (params.organization_id) validParams.organization_id = params.organization_id;
      
      if (params.per_page) {
        validParams.per_page = Math.min(parseInt(params.per_page), 100);
      } else {
        validParams.per_page = 100;
      }
      
      if (params.page) validParams.page = params.page;
      
      const response = await api.get('/program-themes', { 
        params: validParams,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching themes:', error);
      return [];
    }
  },

  async getActiveThemes() {
    try {
      let allThemes = [];
      let currentPage = 1;
      let lastPage = 1;
      
      do {
        const response = await api.get('/program-themes', {
          params: {
            per_page: 100,
            page: currentPage,
          },
        });
        
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          allThemes = [...allThemes, ...response.data.data.data];
          lastPage = response.data.data.last_page || 1;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          allThemes = [...allThemes, ...response.data.data];
          lastPage = response.data.last_page || 1;
        } else {
          break;
        }
        
        currentPage++;
      } while (currentPage <= lastPage);
      
      const activeThemes = allThemes.filter(theme => theme.is_active === true);
      return activeThemes;
    } catch (error) {
      console.error('Error fetching active themes:', error);
      return [];
    }
  },

  async getFields(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = Math.min(parseInt(params.per_page), 100);
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-fields', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching fields:', error);
      return [];
    }
  },

  async getTargets(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = Math.min(parseInt(params.per_page), 100);
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-targets', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching targets:', error);
      return [];
    }
  },

  async getGoals(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = Math.min(parseInt(params.per_page), 100);
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-goals', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  },

  async getOrganizations(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = Math.min(parseInt(params.per_page), 100);
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/organizations', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  },
};

export default workProgramService;