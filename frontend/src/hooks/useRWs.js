// src/hooks/useRWs.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rwService } from '../services/rw';

export const RW_QUERY_KEY = 'rws';

export const useRWs = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [RW_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await rwService.getAll(filters);
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
    mutationFn: (data) => rwService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RW_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rwService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RW_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rwService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RW_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [RW_QUERY_KEY] });
    },
  };
};

export default useRWs;