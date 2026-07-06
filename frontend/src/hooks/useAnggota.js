// src/hooks/useAnggota.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anggotaService } from '../services/anggota';

export const ANGGOTA_QUERY_KEY = 'anggotas';

// Helper untuk mengubah FormData menjadi Object biasa agar UI state tidak kosong saat OnMutate
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
    // PERBAIKAN: Set staleTime ke 0 agar selalu refetch saat komponen mount
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  // =========================================================================
  // CREATE MUTATION
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
    
    onSuccess: (result, formData, context) => {
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.tempId ? result.data : item
          ),
        };
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
    }
  });

  // =========================================================================
  // UPDATE MUTATION
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
    
    onSuccess: (result, variables) => {
      queryClient.setQueryData([ANGGOTA_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? result.data : item
          ),
        };
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
    }
  });

  // =========================================================================
  // DELETE MUTATION
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
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [ANGGOTA_QUERY_KEY] });
    },
  };
};

export default useAnggota;