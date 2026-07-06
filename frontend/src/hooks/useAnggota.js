import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anggotaService } from '../services/anggota';

export const ANGGOTA_QUERY_KEY = 'anggotas';

export const useAnggota = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ANGGOTA_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await anggotaService.getAll(filters);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  const createMutation = useMutation({
    mutationFn: (formData) => anggotaService.createWithFile(formData),
    
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY], 
        exact: false 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => anggotaService.updateWithFile(id, data),
    
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY], 
        exact: false 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => anggotaService.delete(id),
    
    onSettled: () => {
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