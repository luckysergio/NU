import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificateCategoryService } from '../services/certificateCategory';

export const CERTIFICATE_CATEGORIES_QUERY_KEY = 'certificate-categories';

const generateSlug = (nama) => {
  if (!nama) return '';
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const useCertificateCategories = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await certificateCategoryService.getAll(filters);
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // ✅ Cache 5 menit
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  const createMutation = useMutation({
    mutationFn: (data) => certificateCategoryService.create(data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
      });

      const previousData = queryClient.getQueryData([
        CERTIFICATE_CATEGORIES_QUERY_KEY,
        filters,
      ]);
      const tempId = `temp-${Date.now()}`;

      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: [
              {
                ...data,
                id: tempId,
                slug: generateSlug(data.nama),
                is_active: data.is_active ?? true,
                total_certificates: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              ...old.data,
            ],
            total: (old.total || 0) + 1,
          };
        },
      );

      return { previousData, tempId };
    },

    onError: (err, data, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Create error:', err);
    },

    onSuccess: (response, data, context) => {
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === context.tempId ? response.data : item,
            ),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        exact: false,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => certificateCategoryService.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
      });

      const previousData = queryClient.getQueryData([
        CERTIFICATE_CATEGORIES_QUERY_KEY,
        filters,
      ]);

      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
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
        },
      );

      return { previousData };
    },

    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Update error:', err);
    },

    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === variables.id ? response.data : item,
            ),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        exact: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => certificateCategoryService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
      });

      const previousData = queryClient.getQueryData([
        CERTIFICATE_CATEGORIES_QUERY_KEY,
        filters,
      ]);

      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((item) => item.id !== id),
            total: Math.max(0, (old.total || 0) - 1),
          };
        },
      );

      return { previousData };
    },

    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Delete error:', err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        exact: false,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => certificateCategoryService.toggleStatus(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
      });

      const previousData = queryClient.getQueryData([
        CERTIFICATE_CATEGORIES_QUERY_KEY,
        filters,
      ]);

      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id ? { ...item, is_active: !item.is_active } : item,
            ),
          };
        },
      );

      return { previousData };
    },

    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
          context.previousData,
        );
      }
      console.error('Toggle status error:', err);
    },

    onSuccess: (response, id) => {
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === id ? response.data : item,
            ),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
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

    toggleStatus: toggleStatusMutation.mutate,
    isToggling: toggleStatusMutation.isPending,
    toggleError: toggleStatusMutation.error,

    invalidate: () => {
      queryClient.invalidateQueries({
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        exact: false,
      });
    },
  };
};

export default useCertificateCategories;