// src/hooks/useAnggota.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { anggotaService } from '../services/anggota';
import echo from '../services/echo';

export const ANGGOTA_QUERY_KEY = 'anggota';
export const ANGGOTA_DETAIL_QUERY_KEY = 'anggota_detail';

export const useAnggota = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);

  // Memoize filters untuk menghindari re-render berlebihan
  const memoizedFilters = useMemo(() => filters, [
    filters.search,
    filters.organization_id,
    filters.organization_type_id,
    filters.jabatan_id,
    filters.is_active,
    filters.level_slug,
    filters.page,
    filters.per_page,
  ]);

  const query = useQuery({
    queryKey: [ANGGOTA_QUERY_KEY, memoizedFilters],
    queryFn: async () => {
      const result = await anggotaService.getAll({
        ...memoizedFilters,
        _t: Date.now(),
      });
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 10 * 60 * 1000, // 10 menit
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });

  const createMutation = useMutation({
    mutationFn: (data) => anggotaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => anggotaService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ANGGOTA_DETAIL_QUERY_KEY, data.data?.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => anggotaService.delete(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      queryClient.removeQueries({
        queryKey: [ANGGOTA_DETAIL_QUERY_KEY, variables],
      });
    },
  });

  useEffect(() => {
    if (!isRealtimeEnabled) return;

    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        const channel = echo.channel('anggota');
        channelRef.current = channel;

        if (isSubscribed) {
          setConnectionStatus('connected');
        }

        channel.listen('.anggota.created', (event) => {
          console.log('[Anggota Realtime] Created:', event);
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
        });

        channel.listen('.anggota.updated', (event) => {
          console.log('[Anggota Realtime] Updated:', event);
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
          queryClient.setQueryData(
            [ANGGOTA_DETAIL_QUERY_KEY, event.id],
            event.data
          );
        });

        channel.listen('.anggota.deleted', (event) => {
          console.log('[Anggota Realtime] Deleted:', event);
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
          queryClient.removeQueries({
            queryKey: [ANGGOTA_DETAIL_QUERY_KEY, event.id],
          });
        });

        if (echo.connector?.socket) {
          const socket = echo.connector.socket;
          socket.on('error', () => isSubscribed && setConnectionStatus('error'));
          socket.on('disconnect', () => isSubscribed && setConnectionStatus('disconnected'));
          socket.on('connect', () => isSubscribed && setConnectionStatus('connected'));
        }

      } catch (error) {
        console.error('[Anggota Realtime] Failed to connect:', error);
        if (isSubscribed) setConnectionStatus('error');
      }
    };

    setupRealtime();

    return () => {
      isSubscribed = false;
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.anggota.created');
          channelRef.current.stopListening('.anggota.updated');
          channelRef.current.stopListening('.anggota.deleted');
          echo.leaveChannel('anggota');
        } catch (error) {
          console.error('[Anggota Realtime] Cleanup error:', error);
        }
      }
    };
  }, [queryClient, isRealtimeEnabled]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [ANGGOTA_QUERY_KEY, memoizedFilters],
    });
  }, [queryClient, memoizedFilters]);

  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled((prev) => {
      const newState = !prev;
      if (!newState && channelRef.current) {
        try {
          channelRef.current.stopListening('.anggota.created');
          channelRef.current.stopListening('.anggota.updated');
          channelRef.current.stopListening('.anggota.deleted');
          echo.leaveChannel('anggota');
          setConnectionStatus('disconnected');
        } catch (error) {
          console.error('[Anggota Realtime] Toggle cleanup error:', error);
        }
      }
      return newState;
    });
  }, []);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  };
};