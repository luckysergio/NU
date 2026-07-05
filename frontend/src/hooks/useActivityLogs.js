// src/hooks/useActivityLogs.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityLogService } from '../services/activityLog';
import { useEffect } from 'react';

export const ACTIVITY_LOG_QUERY_KEY = 'activityLogs';

export const useActivityLogs = (filters = {}) => {
  const queryClient = useQueryClient();

  // Query utama untuk data logs
  const query = useQuery({
    queryKey: [ACTIVITY_LOG_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await activityLogService.getAll(filters);
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal mengambil data activity log');
      }
      
      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 menit - lebih cepat untuk data logs
    gcTime: 5 * 60 * 1000, // 5 menit
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    // Auto refresh setiap 30 detik jika ada aktivitas baru
    refetchInterval: 30000, // 30 detik
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const result = await activityLogService.delete(id);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal menghapus activity log');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate query agar data refresh otomatis
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOG_QUERY_KEY] });
    },
  });

  // Prefetch modules dengan cache yang lebih lama
  const prefetchModules = useQuery({
    queryKey: ['activityLogsModules'],
    queryFn: async () => {
      try {
        const result = await activityLogService.getModules();
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Error fetching modules:', error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 jam
    gcTime: 2 * 60 * 60 * 1000, // 2 jam
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Prefetch actions dengan cache yang lebih lama
  const prefetchActions = useQuery({
    queryKey: ['activityLogsActions'],
    queryFn: async () => {
      try {
        const result = await activityLogService.getActions();
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Error fetching actions:', error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Prefetch users dengan error handling
  const prefetchUsers = useQuery({
    queryKey: ['activityLogsUsers'],
    queryFn: async () => {
      try {
        const result = await activityLogService.getUsers();
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Auto refresh menggunakan interval
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch hanya jika tidak ada error
      if (!query.isError && !query.isLoading) {
        query.refetch();
      }
    }, 30000); // 30 detik

    return () => clearInterval(interval);
  }, [query]);

  return {
    // Data
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Delete
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    // Master data
    modules: prefetchModules.data || [],
    isLoadingModules: prefetchModules.isLoading,
    actions: prefetchActions.data || [],
    isLoadingActions: prefetchActions.isLoading,
    users: prefetchUsers.data || [],
    isLoadingUsers: prefetchUsers.isLoading,

    // Invalidate
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOG_QUERY_KEY] });
    },
  };
};

export default useActivityLogs;