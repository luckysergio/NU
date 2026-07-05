// src/hooks/useJabatans.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jabatanService } from '../services/jabatan';

export const JABATAN_QUERY_KEY = 'jabatans';

export const useJabatans = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [JABATAN_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await jabatanService.getAll(filters);
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
    mutationFn: (data) => jabatanService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JABATAN_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => jabatanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JABATAN_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jabatanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JABATAN_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [JABATAN_QUERY_KEY] });
    },
  };
};

export default useJabatans;