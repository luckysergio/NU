// src/hooks/useAnggota.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anggotaService } from '../services/anggota';

export const ANGGOTA_QUERY_KEY = 'anggotas';

export const useAnggota = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ANGGOTA_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await anggotaService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  // CREATE MUTATION
  const createMutation = useMutation({
    mutationFn: (data) => anggotaService.createWithFile(data),
    
    // Optimistic Update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      
      // Optimistically update
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [
            {
              ...newData,
              id: `temp-${Date.now()}`,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            ...old.data,
          ],
          total: old.total + 1,
        };
      });
      
      return { previousData };
    },
    
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create error:', err);
    },
    
    onSuccess: (result, variables) => {
      // Replace temp data with real data
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}`;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === tempId ? result.data : item
          ),
        };
      });
      
      // Invalidate all queries to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  // UPDATE MUTATION
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => anggotaService.updateWithFile(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      
      // Optimistically update
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === id ? { ...item, ...data, is_active: data.is_active !== undefined ? data.is_active : item.is_active } : item
          ),
        };
      });
      
      return { previousData };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update error:', err);
    },
    
    onSuccess: (result, variables) => {
      // Update with real data
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? result.data : item
          ),
        };
      });
      
      // Invalidate all queries
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  // DELETE MUTATION
  const deleteMutation = useMutation({
    mutationFn: (id) => anggotaService.delete(id),
    
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      
      // Optimistically remove
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter(item => item.id !== id),
          total: old.total - 1,
        };
      });
      
      return { previousData };
    },
    
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete error:', err);
    },
    
    onSuccess: (result, id) => {
      // Invalidate all queries
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    invalidate: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        refetchType: 'all'
      });
    },
  };
};

export default useAnggota;