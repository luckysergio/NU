import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programTargetService } from '../services/programTargetService';

export const PROGRAM_TARGET_QUERY_KEY = 'program-targets';

export const useProgramTarget = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PROGRAM_TARGET_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await programTargetService.getAll(filters);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  const createMutation = useMutation({
    mutationFn: (data) => programTargetService.create(data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_TARGET_QUERY_KEY] });

      const previousData = queryClient.getQueryData([
        PROGRAM_TARGET_QUERY_KEY,
        filters,
      ]);
      const tempId = `temp-${Date.now()}`;

      queryClient.setQueryData([PROGRAM_TARGET_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...data,
              id: tempId,
              is_active: data.is_active ?? true,
              created_at: new Date().toISOString(),
            },
            ...old.data,
          ],
          total: (old.total || 0) + 1,
        };
      });

      return { previousData, tempId };
    },

    onError: (err, data, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [PROGRAM_TARGET_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Create error:', err);
    },

    onSuccess: (response, data, context) => {
      queryClient.setQueryData([PROGRAM_TARGET_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === context.tempId ? response.data : item,
          ),
        };
      });

      queryClient.invalidateQueries({
        queryKey: [PROGRAM_TARGET_QUERY_KEY],
        exact: false,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => programTargetService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_TARGET_QUERY_KEY] });

      const previousData = queryClient.getQueryData([
        PROGRAM_TARGET_QUERY_KEY,
        filters,
      ]);

      queryClient.setQueryData([PROGRAM_TARGET_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        };
      });

      return { previousData };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [PROGRAM_TARGET_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Update error:', err);
    },

    onSuccess: (response, variables) => {
      queryClient.setQueryData([PROGRAM_TARGET_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === variables.id ? response.data : item,
          ),
        };
      });

      queryClient.invalidateQueries({
        queryKey: [PROGRAM_TARGET_QUERY_KEY],
        exact: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => programTargetService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [PROGRAM_TARGET_QUERY_KEY] });

      const previousData = queryClient.getQueryData([
        PROGRAM_TARGET_QUERY_KEY,
        filters,
      ]);

      queryClient.setQueryData([PROGRAM_TARGET_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.filter((item) => item.id !== id),
          total: Math.max(0, (old.total || 0) - 1),
        };
      });

      return { previousData };
    },

    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [PROGRAM_TARGET_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Delete error:', err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PROGRAM_TARGET_QUERY_KEY],
        exact: false,
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
        queryKey: [PROGRAM_TARGET_QUERY_KEY],
        exact: false,
      });
    },
  };
};

export default useProgramTarget;