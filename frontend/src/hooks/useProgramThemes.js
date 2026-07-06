// src/hooks/useProgramThemes.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import programThemeService from '../services/programThemeService';

export const PROGRAM_THEME_QUERY_KEY = 'program-themes';

export const useProgramThemes = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PROGRAM_THEME_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await programThemeService.getProgramThemes(filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data tema program');
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
    mutationFn: (data) => programThemeService.createProgramTheme(data),
    
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_THEME_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([PROGRAM_THEME_QUERY_KEY, filters]);
      const tempId = `temp-${Date.now()}`;
      
      queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...newData,
              id: tempId,
              is_active: true,
              created_at: new Date().toISOString(),
              statistics: {
                total_work_programs: 0,
                total_activities: 0,
                organizations_status: [],
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
        queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create error:', err);
    },
    
    onSuccess: (response, newData, context) => {
      queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.tempId ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [PROGRAM_THEME_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => programThemeService.updateProgramTheme(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_THEME_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([PROGRAM_THEME_QUERY_KEY, filters]);
      
      queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === id ? { ...item, ...data } : item
          ),
        };
      });
      
      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update error:', err);
    },
    
    onSuccess: (response, variables) => {
      queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === variables.id ? response.data : item
          ),
        };
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [PROGRAM_THEME_QUERY_KEY], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ DELETE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const deleteMutation = useMutation({
    mutationFn: (id) => programThemeService.deleteProgramTheme(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_THEME_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([PROGRAM_THEME_QUERY_KEY, filters]);
      
      queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([PROGRAM_THEME_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete error:', err);
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [PROGRAM_THEME_QUERY_KEY], 
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
        queryKey: [PROGRAM_THEME_QUERY_KEY], 
        exact: false 
      });
    },
  };
};

export default useProgramThemes;