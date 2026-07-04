import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kotaService } from '../services/kota';

export const KOTA_QUERY_KEY = 'kotas';

export const useKotas = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [KOTA_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await kotaService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => kotaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KOTA_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => kotaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KOTA_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => kotaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KOTA_QUERY_KEY] });
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
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [KOTA_QUERY_KEY] });
    },
  };
};

export default useKotas;