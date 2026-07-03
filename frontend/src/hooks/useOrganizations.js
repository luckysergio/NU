// hooks/useOrganizations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { organizationService } from '../services/organization';
import echo from '../services/echo';

export const ORGANIZATIONS_QUERY_KEY = 'organizations';
export const ORGANIZATION_DETAIL_QUERY_KEY = 'organization';

export const useOrganizations = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);

  // Query untuk mendapatkan data dengan cache
  const query = useQuery({
    queryKey: [ORGANIZATIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await organizationService.getAll({
        ...filters,
        _t: Date.now(),
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });

  // Mutation Create
  const createMutation = useMutation({
    mutationFn: (data) => organizationService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
    },
  });

  // Mutation Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => organizationService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ 
        queryKey: [ORGANIZATION_DETAIL_QUERY_KEY, data.data?.id] 
      });
    },
  });

  // Mutation Delete
  const deleteMutation = useMutation({
    mutationFn: (id) => organizationService.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      queryClient.removeQueries({ 
        queryKey: [ORGANIZATION_DETAIL_QUERY_KEY, variables] 
      });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!isRealtimeEnabled) return;

    try {
      const channel = echo.channel('organizations');
      channelRef.current = channel;
      setConnectionStatus('connected');

      // Handle Organization Created
      channel.listen('.organization.created', (event) => {
        console.log('[Realtime] Organization created:', event);
        
        queryClient.setQueryData(
          [ORGANIZATIONS_QUERY_KEY, filters],
          (oldData) => {
            if (!oldData) return oldData;
            
            const exists = oldData.data?.some(item => item.id === event.id);
            if (exists) return oldData;
            
            return {
              ...oldData,
              data: [event.data, ...(oldData.data || [])],
              total: (oldData.total || 0) + 1,
            };
          }
        );
      });

      // Handle Organization Updated
      channel.listen('.organization.updated', (event) => {
        console.log('[Realtime] Organization updated:', event);
        
        queryClient.setQueryData(
          [ORGANIZATIONS_QUERY_KEY, filters],
          (oldData) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              data: (oldData.data || []).map((item) =>
                item.id === event.id ? event.data : item
              ),
            };
          }
        );

        queryClient.setQueryData(
          [ORGANIZATION_DETAIL_QUERY_KEY, event.id],
          event.data
        );
      });

      // Handle Organization Deleted
      channel.listen('.organization.deleted', (event) => {
        console.log('[Realtime] Organization deleted:', event);
        
        queryClient.setQueryData(
          [ORGANIZATIONS_QUERY_KEY, filters],
          (oldData) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              data: (oldData.data || []).filter((item) => item.id !== event.id),
              total: (oldData.total || 0) - 1,
            };
          }
        );

        queryClient.removeQueries({
          queryKey: [ORGANIZATION_DETAIL_QUERY_KEY, event.id],
        });
      });

      // Connection handlers
      echo.connector.socket?.on('error', () => setConnectionStatus('error'));
      echo.connector.socket?.on('disconnect', () => setConnectionStatus('disconnected'));
      echo.connector.socket?.on('connect', () => setConnectionStatus('connected'));

    } catch (error) {
      console.error('[Realtime] Failed to connect:', error);
      setConnectionStatus('error');
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.organization.created');
          channelRef.current.stopListening('.organization.updated');
          channelRef.current.stopListening('.organization.deleted');
          echo.leaveChannel('organizations');
        } catch (error) {
          console.error('[Realtime] Cleanup error:', error);
        }
      }
    };
  }, [filters, queryClient, isRealtimeEnabled]);

  // Force refresh
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: [ORGANIZATIONS_QUERY_KEY, filters],
    });
  }, [queryClient, filters]);

  // Toggle realtime
  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled((prev) => {
      const newState = !prev;
      if (!newState && channelRef.current) {
        try {
          channelRef.current.stopListening('.organization.created');
          channelRef.current.stopListening('.organization.updated');
          channelRef.current.stopListening('.organization.deleted');
          echo.leaveChannel('organizations');
        } catch (error) {
          console.error('[Realtime] Toggle cleanup error:', error);
        }
      }
      return newState;
    });
  }, []);

  return {
    // Query
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  };
};