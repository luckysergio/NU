// src/hooks/useCertificateCategories.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificateCategoryService } from '../services/certificateCategory';

export const CERTIFICATE_CATEGORIES_QUERY_KEY = 'certificate-categories';

export const useCertificateCategories = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await certificateCategoryService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 0, // PERBAIKAN: Set ke 0 agar selalu refetch
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // PERBAIKAN: Refetch saat window fokus
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (data) => certificateCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => certificateCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => certificateCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        refetchType: 'all'
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => certificateCategoryService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        refetchType: 'all'
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

    invalidate: () => {
      queryClient.invalidateQueries({ 
        queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: [CERTIFICATE_CATEGORIES_QUERY_KEY] });
    },
  };
};

export default useCertificateCategories;