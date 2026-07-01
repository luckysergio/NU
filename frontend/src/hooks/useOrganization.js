// src/hooks/useOrganization.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organization';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState, useCallback } from 'react';

export const organizationKeys = {
  all: ['organizations'],
  lists: () => [...organizationKeys.all, 'list'],
  list: (params) => [...organizationKeys.lists(), params],
  details: () => [...organizationKeys.all, 'detail'],
  detail: (id) => [...organizationKeys.details(), id],
  filters: (levelId) => [...organizationKeys.all, 'filters', levelId],
  hierarchy: (rootId, depth) => [...organizationKeys.all, 'hierarchy', rootId, depth],
  statistics: () => [...organizationKeys.all, 'statistics'],
  byLevel: (levelSlug) => [...organizationKeys.all, 'by-level', levelSlug],
  byParent: (parentId) => [...organizationKeys.all, 'by-parent', parentId],
  byType: (typeId) => [...organizationKeys.all, 'by-type', typeId],
  byLocation: (params) => [...organizationKeys.all, 'by-location', params],
  root: () => [...organizationKeys.all, 'root'],
  slug: (slug) => [...organizationKeys.all, 'slug', slug],
};

// ============================================
// MAIN HOOK - NO CACHE, REAL-TIME ONLY
// ============================================

export const useOrganizations = (params = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const fetchIdRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  // Function to fetch data from API
  const fetchData = useCallback(async (isInitial = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }
    setError(null);

    try {
      const result = await organizationService.getAll(params);
      
      // Check if this is still the latest fetch
      if (fetchId !== fetchIdRef.current) {
        console.log('⏭️ Skipping stale fetch result');
        return;
      }

      if (result.success) {
        setData(result.data);
        setIsLoading(false);
        setIsFetching(false);
        console.log('✅ Data fetched successfully');
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message);
        setIsLoading(false);
        setIsFetching(false);
        console.error('❌ Fetch error:', err);
        
        // Retry after 5 seconds if not initial load
        if (!isInitial) {
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Retrying fetch...');
            fetchData(false);
          }, 5000);
        }
      }
    }
  }, [isAuthenticated, params]);

  // Initial fetch
  useEffect(() => {
    fetchData(true);
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!isAuthenticated || isSubscribedRef.current) {
      return;
    }

    console.log('🔄 Setting up real-time subscription...');

    const handleRealtimeEvent = (event) => {
      console.log('📢 Real-time event received:', event);
      
      const { action, organization, deleted_id } = event;

      // Handle different actions
      if (action === 'created' && organization) {
        // Add new organization to list
        setData(prev => {
          if (!prev) return prev;
          const existing = prev.data?.some(item => item.id === organization.id);
          if (existing) return prev;
          
          return {
            ...prev,
            data: [organization, ...(prev.data || [])],
            total: (prev.total || 0) + 1,
          };
        });
        console.log('➕ Added new organization:', organization.nama);
      } 
      else if (action === 'updated' && organization) {
        // Update organization in list
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data?.map(item => 
              item.id === organization.id ? { ...item, ...organization } : item
            ) || [],
          };
        });
        console.log('✏️ Updated organization:', organization.nama);
      } 
      else if (action === 'deleted' && deleted_id) {
        // Remove organization from list
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data?.filter(item => item.id !== deleted_id) || [],
            total: Math.max((prev.total || 0) - 1, 0),
          };
        });
        console.log('🗑️ Deleted organization ID:', deleted_id);
      }

      // Update statistics
      queryClient.invalidateQueries({ 
        queryKey: organizationKeys.statistics() 
      });
    };

    try {
      const channel = organizationService.subscribe(handleRealtimeEvent);
      
      if (channel) {
        channelRef.current = channel;
        isSubscribedRef.current = true;
        console.log('✅ Real-time subscription active');
      } else {
        console.warn('⚠️ Failed to subscribe to real-time channel');
        
        // Fallback: Polling every 10 seconds if WebSocket fails
        const intervalId = setInterval(() => {
          console.log('🔄 Polling fallback...');
          fetchData(false);
        }, 10000);
        
        return () => clearInterval(intervalId);
      }
    } catch (error) {
      console.error('❌ Error setting up subscription:', error);
    }

    return () => {
      console.log('🔌 Cleaning up real-time subscription...');
      if (channelRef.current) {
        organizationService.unsubscribe(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [isAuthenticated, queryClient, fetchData]);

  // Manual refresh function
  const refetch = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    return fetchData(false);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

// ============================================
// ORGANIZATION DETAIL - NO CACHE
// ============================================

export const useOrganization = (id) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !id) {
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await organizationService.getById(id);
      
      if (fetchId !== fetchIdRef.current) {
        return;
      }

      if (result.success) {
        setData(result.data);
      } else {
        if (result.status === 404) {
          setData(null);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time update for detail
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    console.log(`🔄 Setting up real-time subscription for organization ${id}...`);

    const handleRealtimeEvent = (event) => {
      const { action, organization, deleted_id } = event;

      if (action === 'updated' && organization && organization.id === id) {
        console.log('✏️ Updating organization detail:', organization.nama);
        setData(prev => ({ ...prev, ...organization }));
      } 
      else if (action === 'deleted' && deleted_id === id) {
        console.log('🗑️ Organization deleted, clearing detail');
        setData(null);
      }
    };

    try {
      const channel = organizationService.subscribe(handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
      }
    } catch (error) {
      console.error('❌ Error setting up detail subscription:', error);
    }

    return () => {
      if (channelRef.current) {
        organizationService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, id]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// ============================================
// ORGANIZATION STATISTICS - NO CACHE
// ============================================

export const useOrganizationStatistics = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await organizationService.getStatistics();
      
      if (fetchId !== fetchIdRef.current) {
        return;
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time update for statistics
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔄 Setting up real-time subscription for statistics...');

    const handleRealtimeEvent = (event) => {
      const { action } = event;
      // Refresh statistics on any change
      if (['created', 'updated', 'deleted'].includes(action)) {
        console.log('📊 Refreshing statistics...');
        fetchData();
      }
    };

    try {
      const channel = organizationService.subscribe(handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
      }
    } catch (error) {
      console.error('❌ Error setting up statistics subscription:', error);
    }

    return () => {
      if (channelRef.current) {
        organizationService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// ============================================
// OTHER QUERY HOOKS - NO CACHE
// ============================================

export const useOrganizationsByLevel = (levelSlug) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !levelSlug) {
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await organizationService.getByLevel(levelSlug);
      
      if (fetchId !== fetchIdRef.current) return;

      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, levelSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAuthenticated || !levelSlug) return;

    const handleRealtimeEvent = (event) => {
      const { action } = event;
      if (['created', 'updated', 'deleted'].includes(action)) {
        console.log(`🔄 Refreshing by-level data for ${levelSlug}...`);
        fetchData();
      }
    };

    try {
      const channel = organizationService.subscribe(handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
      }
    } catch (error) {
      console.error('❌ Error setting up subscription:', error);
    }

    return () => {
      if (channelRef.current) {
        organizationService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, levelSlug, fetchData]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, isLoading, error, refetch };
};

// ============================================
// MUTATIONS - With Real-time Updates
// ============================================

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const result = await organizationService.create(data);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      // Don't invalidate - let real-time handle the update
      console.log('✅ Organization created, waiting for real-time update...');
    },
    onError: (error) => {
      console.error('❌ Create organization error:', error);
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await organizationService.update(id, data);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      // Don't invalidate - let real-time handle the update
      console.log('✅ Organization updated, waiting for real-time update...');
    },
    onError: (error) => {
      console.error('❌ Update organization error:', error);
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const result = await organizationService.delete(id);
      if (!result.success) {
        if (result.status === 404 || result.message?.includes('404')) {
          return { success: true, alreadyDeleted: true };
        }
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      // Don't invalidate - let real-time handle the update
      console.log('✅ Organization deleted, waiting for real-time update...');
    },
    onError: (error) => {
      console.error('❌ Delete organization error:', error);
    },
  });
};

// ============================================
// UTILITY HOOKS
// ============================================

export const useAutoRefreshOrganizations = () => {
  const refreshAll = useCallback(async () => {
    console.log('🔄 Manual refresh all triggered');
    // This is just a utility - actual refresh happens via real-time
  }, []);
  
  const refreshList = useCallback(async (params) => {
    console.log('🔄 Manual refresh list triggered');
    // This is just a utility - actual refresh happens via real-time
  }, []);
  
  return { refreshAll, refreshList };
};

export const usePrefetchOrganizations = () => {
  // No prefetch needed when using real-time
  const prefetchList = useCallback(() => Promise.resolve(), []);
  const prefetchDetail = useCallback(() => Promise.resolve(), []);
  return { prefetchList, prefetchDetail };
};

// Export for backward compatibility
export const useOrganizationLevelFilters = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useOrganizationHierarchy = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useOrganizationsByParent = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useOrganizationsByType = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useOrganizationsByLocation = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useRootOrganizations = () => {
  // Simplified - no cache
  return { data: [], isLoading: false, error: null };
};

export const useBulkDeleteOrganizations = () => {
  return useMutation({
    mutationFn: async (ids) => {
      const result = await organizationService.bulkDelete(ids);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      console.log('✅ Bulk delete completed, waiting for real-time updates...');
    },
  });
};

export const useToggleOrganizationActive = () => {
  return useMutation({
    mutationFn: async (id) => {
      const result = await organizationService.toggleActive(id);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      console.log('✅ Organization status toggled, waiting for real-time update...');
    },
  });
};

export default {
  organizationKeys,
  useOrganizations,
  useOrganization,
  useOrganizationStatistics,
  useOrganizationsByLevel,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useBulkDeleteOrganizations,
  useToggleOrganizationActive,
  useAutoRefreshOrganizations,
  usePrefetchOrganizations,
};