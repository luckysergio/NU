// src/hooks/useKelurahans.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kelurahanService } from '../services/kelurahan';

export const KELURAHAN_QUERY_KEY = 'kelurahans';

export const useKelurahans = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [KELURAHAN_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await kelurahanService.getAll(filters);
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
  });

  const createMutation = useMutation({
    mutationFn: (data) => kelurahanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => kelurahanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => kelurahanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
    },
  };
};

export default useKelurahans;