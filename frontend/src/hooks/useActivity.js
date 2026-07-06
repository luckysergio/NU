// src/hooks/useActivity.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../services/activityService';

export const ACTIVITY_QUERY_KEY = 'activities';

/**
 * Helper untuk parse FormData ke object biasa (untuk optimistic update)
 * Karena FormData tidak bisa langsung di-cache, kita convert ke plain object
 */
const parseFormData = (formData) => {
  if (!(formData instanceof FormData)) return formData;
  const object = {};
  formData.forEach((value, key) => {
    // Untuk file, simpan preview URL
    if (value instanceof File) {
      object[key] = URL.createObjectURL(value);
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const useActivity = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  // =========================================================================
  // ✅ MAIN QUERY
  // =========================================================================
  const query = useQuery({
    queryKey: [ACTIVITY_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await activityService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data kegiatan');
      }
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
    mutationFn: (formData) => activityService.create(formData),
    
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: [ACTIVITY_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ACTIVITY_QUERY_KEY, filters]);
      const tempId = `temp-${Date.now()}`;
      const plainData = parseFormData(formData);
      
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...plainData,
              id: tempId,
              status: plainData.status || 'draft',
              created_at: new Date().toISOString(),
              photos: [],
              expense_photos: [],
              attendances: [],
              participant_organizations: [],
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
        queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create activity error:', err);
    },
    
    onSuccess: (response, formData, context) => {
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.tempId ? response.data : item
          ),
        };
      });
      
      // ✅ Invalidate untuk sync dengan filter lain
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => activityService.update(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [ACTIVITY_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ACTIVITY_QUERY_KEY, filters]);
      const plainData = parseFormData(data);
      
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update activity error:', err);
    },
    
    onSuccess: (response, variables) => {
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ DELETE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const deleteMutation = useMutation({
    mutationFn: (id) => activityService.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ACTIVITY_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ACTIVITY_QUERY_KEY, filters]);
      
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete activity error:', err);
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE STATUS MUTATION
  // =========================================================================
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => activityService.updateStatus(id, status),
    
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: [ACTIVITY_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ACTIVITY_QUERY_KEY, filters]);
      
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === id ? { ...item, status } : item
          ),
        };
      });
      
      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update status error:', err);
    },
    
    onSuccess: (response, variables) => {
      queryClient.setQueryData([ACTIVITY_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ RETURN VALUES
  // =========================================================================
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

    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateStatusError: updateStatusMutation.error,

    invalidate: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY], 
        exact: false 
      });
    },
  };
};

export default useActivity;