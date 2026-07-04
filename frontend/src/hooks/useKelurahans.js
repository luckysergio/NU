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
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal mengambil data kelurahan');
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await kelurahanService.create(data);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal membuat kelurahan');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await kelurahanService.update(id, data);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal mengupdate kelurahan');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KELURAHAN_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const result = await kelurahanService.delete(id);
      if (!result || !result.success) {
        throw new Error(result?.message || 'Gagal menghapus kelurahan');
      }
      return result;
    },
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