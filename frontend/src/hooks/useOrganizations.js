// src/hooks/useOrganizations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organization';

export const ORGANIZATIONS_QUERY_KEY = 'organizations';

export const useOrganizations = (filters = {}) => {
  const queryClient = useQueryClient();

  // 1. QUERY MANAGEMENT
  const query = useQuery({
    queryKey: [ORGANIZATIONS_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await organizationService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal fetching data');
      }
      return result.data;
    },
    staleTime: 0, // Data langsung dianggap usang
    gcTime: 5 * 60 * 1000, // Simpan di cache sampah selama 5 menit
    refetchOnWindowFocus: true, // Auto-sync saat user kembali ke tab
    placeholderData: (previousData) => previousData, // UI mulus saat ganti filter
  });

  // 2. MUTATION: CREATE DATA
  const createMutation = useMutation({
    mutationFn: (data) => organizationService.create(data),
    
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      
      const previousData = queryClient.getQueryData([ORGANIZATIONS_QUERY_KEY, filters]);
      const generatedTempId = `temp-${Date.now()}`;
      
      queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...newData,
              id: generatedTempId,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            ...old.data,
          ],
          total: (old.total || 0) + 1,
        };
      });
      
      return { previousData, generatedTempId };
    },
    
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], context.previousData);
      }
      console.error('Create error:', err);
    },
    
    onSuccess: (response, variables, context) => {
      queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => 
            item.id === context.generatedTempId ? response.data.data : item
          ),
        };
      });
      
      // ✅ Auto invalidate semua query organisasi
      queryClient.invalidateQueries({ 
        queryKey: [ORGANIZATIONS_QUERY_KEY],
        exact: false
      });
    },
  });

  // 3. MUTATION: UPDATE DATA
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => organizationService.update(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      const previousData = queryClient.getQueryData([ORGANIZATIONS_QUERY_KEY, filters]);
      
      queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], (old) => {
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
        queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], context.previousData);
      }
      console.error('Update error:', err);
    },
    
    onSuccess: () => {
      // ✅ Auto invalidate semua query organisasi
      queryClient.invalidateQueries({ 
        queryKey: [ORGANIZATIONS_QUERY_KEY],
        exact: false
      });
    },
  });

  // 4. MUTATION: DELETE DATA
  const deleteMutation = useMutation({
    mutationFn: (id) => organizationService.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      const previousData = queryClient.getQueryData([ORGANIZATIONS_QUERY_KEY, filters]);
      
      queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter(item => item.id !== id),
          total: (old.total || 1) - 1,
        };
      });
      
      return { previousData };
    },
    
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([ORGANIZATIONS_QUERY_KEY, filters], context.previousData);
      }
      console.error('Delete error:', err);
    },
    
    onSuccess: () => {
      // ✅ Auto invalidate semua query organisasi
      queryClient.invalidateQueries({ 
        queryKey: [ORGANIZATIONS_QUERY_KEY],
        exact: false
      });
    },
  });

  return {
    // State Query
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Aksi Mutasi & State
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Fungsi invalidate manual
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY], exact: false });
    },
  };
};

export default useOrganizations;