// src/hooks/useAnggota.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anggotaService } from '../services/anggota';

export const ANGGOTA_QUERY_KEY = 'anggotas';

// Helper untuk parse FormData ke object biasa (untuk optimistic update)
const parseFormData = (formData) => {
  if (!(formData instanceof FormData)) return formData;
  const object = {};
  formData.forEach((value, key) => {
    if (value instanceof File) {
      object[key] = URL.createObjectURL(value);
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const useAnggota = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ANGGOTA_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await anggotaService.getAll(filters);
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // ✅ Cache 5 menit
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  // =========================================================================
  // ✅ CREATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const createMutation = useMutation({
    mutationFn: (formData) => anggotaService.createWithFile(formData),
    
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      const tempId = `temp-${Date.now()}`;
      const plainData = parseFormData(formData);
      
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...plainData,
              id: tempId,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            ...old.data,
          ],
          total: (old.total || 0) + 1,
        };
      });
      
      return { previousData, tempId };
    },
    
    onError: (err, formData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create error:', err);
    },
    
    onSuccess: (response, formData, context) => {
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.tempId ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => anggotaService.updateWithFile(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      const plainData = parseFormData(data);
      
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === id ? { ...item, ...plainData } : item
          ),
        };
      });
      
      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update error:', err);
    },
    
    onSuccess: (response, variables) => {
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ DELETE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const deleteMutation = useMutation({
    mutationFn: (id) => anggotaService.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ANGGOTA_QUERY_KEY, filters]);
      
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter(item => item.id !== id),
          total: Math.max(0, (old.total || 0) - 1),
        };
      });
      
      return { previousData };
    },
    
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete error:', err);
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY], 
        exact: false 
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
        exact: false 
      });
    },
  };
};

export default useAnggota;