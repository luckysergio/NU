import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user';

export const USER_QUERY_KEY = 'users';

export const useUsers = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [USER_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await userService.getAll(filters);
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
    mutationFn: async (data) => {
      const result = await userService.create(data);
      if (!result.success) {
        throw new Error(result.message || 'Gagal membuat user');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
      
      // Prefetch detail data
      if (data?.data?.id) {
        queryClient.prefetchQuery({
          queryKey: [USER_QUERY_KEY, 'detail', data.data.id],
          queryFn: () => userService.getById(data.data.id),
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await userService.update(id, data);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengupdate user');
      }
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
      
      // Update detail cache
      if (data?.data) {
        queryClient.setQueryData(
          [USER_QUERY_KEY, 'detail', variables.id],
          data.data
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const result = await userService.delete(id);
      if (!result.success) {
        throw new Error(result.message || 'Gagal menghapus user');
      }
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
      queryClient.removeQueries({
        queryKey: [USER_QUERY_KEY, 'detail', variables],
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id) => {
      const result = await userService.toggleStatus(id);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengubah status user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async (id) => {
      const result = await userService.toggleBlock(id);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengubah status blokir user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
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
    createResult: createMutation.data,
    createError: createMutation.error,

    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateResult: updateMutation.data,
    updateError: updateMutation.error,

    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteResult: deleteMutation.data,
    deleteError: deleteMutation.error,

    toggleStatus: toggleStatusMutation.mutate,
    isTogglingStatus: toggleStatusMutation.isPending,
    toggleBlock: toggleBlockMutation.mutate,
    isTogglingBlock: toggleBlockMutation.isPending,

    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
    prefetch: async (id) => {
      await queryClient.prefetchQuery({
        queryKey: [USER_QUERY_KEY, 'detail', id],
        queryFn: () => userService.getById(id),
      });
    },
    getDetail: (id) => {
      return queryClient.getQueryData([USER_QUERY_KEY, 'detail', id]);
    },
  };
};

export default useUsers;