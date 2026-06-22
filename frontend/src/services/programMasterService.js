import api from './api';

const programMasterService = {
  async getThemes(params = {}) {
    try {
      const validParams = {};
      
      if (params.search && params.search.trim()) validParams.search = params.search.trim();
      if (params.start_date) validParams.start_date = params.start_date;
      if (params.end_date) validParams.end_date = params.end_date;
      if (params.organization_id) validParams.organization_id = params.organization_id;
      if (params.per_page) validParams.per_page = params.per_page;
      if (params.page) validParams.page = params.page;
      
      if (!validParams.per_page && !params.per_page) {
        validParams.per_page = 100;
      }
      
      const response = await api.get('/program-themes', { 
        params: validParams,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.data?.data?.data) {
        return response.data.data.data;
      }
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        }
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getActiveThemes() {
    try {
      const allThemes = await this.getThemes({ per_page: 1000 });
      const activeThemes = Array.isArray(allThemes) 
        ? allThemes.filter(theme => theme.is_active === true)
        : [];
      return activeThemes;
    } catch (error) {
      return [];
    }
  },

  async getFields(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = params.per_page;
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-fields', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data) {
        return response.data.data.data;
      }
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        }
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getTargets(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = params.per_page;
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-targets', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data) {
        return response.data.data.data;
      }
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        }
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getGoals(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = params.per_page;
      if (params.is_active !== undefined) validParams.is_active = params.is_active;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/program-goals', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data) {
        return response.data.data.data;
      }
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        }
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async getOrganizations(params = {}) {
    try {
      const validParams = {};
      if (params.per_page) validParams.per_page = params.per_page;
      if (params.search) validParams.search = params.search;
      
      const response = await api.get('/organizations', { 
        params: { ...validParams, per_page: validParams.per_page || 100 }
      });
      
      if (response.data?.data?.data) {
        return response.data.data.data;
      }
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        }
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }
};

export default programMasterService;