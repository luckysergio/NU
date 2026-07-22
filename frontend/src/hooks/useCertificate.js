import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificateService } from '../services/certificate';

export const CERTIFICATE_QUERY_KEY = 'certificates';
export const CERTIFICATE_CATEGORY_QUERY_KEY = 'certificate-categories';

export const useCertificates = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CERTIFICATE_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await certificateService.getAll(filters);
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
    mutationFn: (data) => certificateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => certificateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => certificateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_QUERY_KEY] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id) => certificateService.download(id),
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

    download: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,

    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_QUERY_KEY] });
    },
  };
};

export const useCertificateDetail = (id) => {
  return useQuery({
    queryKey: [CERTIFICATE_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      const result = await certificateService.getById(id);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCertificatesByBiodata = (biodataId) => {
  return useQuery({
    queryKey: [CERTIFICATE_QUERY_KEY, 'biodata', biodataId],
    queryFn: async () => {
      const result = await certificateService.getByBiodata(biodataId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    enabled: !!biodataId,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useCertificateCategories = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CERTIFICATE_CATEGORY_QUERY_KEY],
    queryFn: async () => {
      const result = await certificateService.getCategories();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => certificateService.createCategory(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_CATEGORY_QUERY_KEY] });
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORY_QUERY_KEY],
        (oldData) => {
          if (!oldData) return [data.data];
          return [...oldData, data.data];
        }
      );
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => certificateService.updateCategory(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_CATEGORY_QUERY_KEY] });
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORY_QUERY_KEY],
        (oldData) => {
          if (!oldData) return oldData;
          const index = oldData.findIndex(item => item.id === variables.id);
          if (index !== -1) {
            const newData = [...oldData];
            newData[index] = data.data;
            return newData;
          }
          return oldData;
        }
      );
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => certificateService.deleteCategory(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_CATEGORY_QUERY_KEY] });
      queryClient.setQueryData(
        [CERTIFICATE_CATEGORY_QUERY_KEY],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter(item => item.id !== variables);
        }
      );
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    createCategory: createCategoryMutation.mutate,
    isCreatingCategory: createCategoryMutation.isPending,
    createCategoryResult: createCategoryMutation.data,
    createCategoryError: createCategoryMutation.error,

    updateCategory: updateCategoryMutation.mutate,
    isUpdatingCategory: updateCategoryMutation.isPending,
    updateCategoryResult: updateCategoryMutation.data,
    updateCategoryError: updateCategoryMutation.error,

    deleteCategory: deleteCategoryMutation.mutate,
    isDeletingCategory: deleteCategoryMutation.isPending,
    deleteCategoryResult: deleteCategoryMutation.data,
    deleteCategoryError: deleteCategoryMutation.error,

    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [CERTIFICATE_CATEGORY_QUERY_KEY] });
    },
  };
};

export default useCertificates;