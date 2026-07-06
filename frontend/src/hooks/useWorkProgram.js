// src/hooks/useWorkProgram.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ PERBAIKAN: Import dari file baru
import { workProgramService } from '../services/workProgramService';

export const WORK_PROGRAM_QUERY_KEY = 'work-programs';

const parseFormData = (formData) => {
  if (!(formData instanceof FormData)) return formData;
  const object = {};
  formData.forEach((value, key) => {
    object[key] = value;
  });
  return object;
};

export const useWorkProgram = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [WORK_PROGRAM_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await workProgramService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data program kerja');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  const createMutation = useMutation({
    mutationFn: (data) => workProgramService.create(data),
    
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [WORK_PROGRAM_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([WORK_PROGRAM_QUERY_KEY, filters]);
      const tempId = `temp-${Date.now()}`;
      const plainData = parseFormData(newData);
      
      queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...plainData,
              id: tempId,
              status: plainData.status || 'draft',
              created_at: new Date().toISOString(),
              statistics: {
                total_activities: 0,
                mwc_activities_count: 0,
                ranting_status: [],
              },
            },
            ...old.data,
          ],
          total: (old.total || 0) + 1,
        };
      });
      
      return { previousData, tempId };
    },
    
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create work program error:', err);
    },
    
    onSuccess: (response, newData, context) => {
      queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.tempId ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [WORK_PROGRAM_QUERY_KEY], 
        exact: false 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => workProgramService.update(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [WORK_PROGRAM_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([WORK_PROGRAM_QUERY_KEY, filters]);
      const plainData = parseFormData(data);
      
      queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update work program error:', err);
    },
    
    onSuccess: (response, variables) => {
      queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [WORK_PROGRAM_QUERY_KEY], 
        exact: false 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => workProgramService.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [WORK_PROGRAM_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([WORK_PROGRAM_QUERY_KEY, filters]);
      
      queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([WORK_PROGRAM_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete work program error:', err);
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [WORK_PROGRAM_QUERY_KEY], 
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
        queryKey: [WORK_PROGRAM_QUERY_KEY], 
        exact: false 
      });
    },
  };
};

export default useWorkProgram;