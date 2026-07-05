// src/hooks/useRoles.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/role';

export const ROLE_QUERY_KEY = 'roles';

export const useRoles = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ROLE_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await roleService.getAll(filters);
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
    mutationFn: (data) => roleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
      
      if (data?.data) {
        queryClient.setQueryData(
          [ROLE_QUERY_KEY, 'detail', variables.id],
          data.data
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
    },
    prefetch: async (id) => {
      await queryClient.prefetchQuery({
        queryKey: [ROLE_QUERY_KEY, 'detail', id],
        queryFn: () => roleService.getById(id),
      });
    },
    getDetail: (id) => {
      return queryClient.getQueryData([ROLE_QUERY_KEY, 'detail', id]);
    },
  };
};

export default useRoles;