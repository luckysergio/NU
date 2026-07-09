import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/role';

export const ROLE_QUERY_KEY = 'roles';

// Helper untuk generate slug dari nama (untuk optimistic preview)
const generateSlug = (nama) => {
  if (!nama) return '';
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const useRoles = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ROLE_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await roleService.getAll(filters);
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  // =========================================================================
  // ✅ CREATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const createMutation = useMutation({
    mutationFn: (data) => roleService.create(data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: [ROLE_QUERY_KEY] });

      const previousData = queryClient.getQueryData([ROLE_QUERY_KEY, filters]);
      const tempId = `temp-${Date.now()}`;

      queryClient.setQueryData([ROLE_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: [
            {
              ...data,
              id: tempId,
              slug: generateSlug(data.nama),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
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
          [ROLE_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Create error:', err);
    },

    onSuccess: (response, data, context) => {
      queryClient.setQueryData([ROLE_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === context.tempId ? response.data : item,
          ),
        };
      });

      queryClient.invalidateQueries({
        queryKey: [ROLE_QUERY_KEY],
        exact: false,
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [ROLE_QUERY_KEY] });

      const previousData = queryClient.getQueryData([ROLE_QUERY_KEY, filters]);

      queryClient.setQueryData([ROLE_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...data,
                  slug: data.nama ? generateSlug(data.nama) : item.slug,
                }
              : item,
          ),
        };
      });

      return { previousData };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [ROLE_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Update error:', err);
    },

    onSuccess: (response, variables) => {
      queryClient.setQueryData([ROLE_QUERY_KEY, filters], (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === variables.id ? response.data : item,
          ),
        };
      });

      queryClient.invalidateQueries({
        queryKey: [ROLE_QUERY_KEY],
        exact: false,
      });
    },
  });

  // =========================================================================
  // ✅ DELETE MUTATION - OPTIMISTIC UPDATE
  // =========================================================================
  const deleteMutation = useMutation({
    mutationFn: (id) => roleService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ROLE_QUERY_KEY] });

      const previousData = queryClient.getQueryData([ROLE_QUERY_KEY, filters]);

      queryClient.setQueryData([ROLE_QUERY_KEY, filters], (old) => {
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
          [ROLE_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Delete error:', err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ROLE_QUERY_KEY],
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
        queryKey: [ROLE_QUERY_KEY],
        exact: false,
      });
    },
  };
};

export default useRoles;