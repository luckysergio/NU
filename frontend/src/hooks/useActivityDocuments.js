// src/hooks/useActivityDocuments.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityDocumentService } from '../services/activityDocument';

export const ACTIVITY_DOCUMENTS_QUERY_KEY = 'activity-documents';

/**
 * Hook untuk manage activity documents dengan React Query
 * @param {number} activityId - Activity ID
 * @param {Object} filters - Filter parameters
 * @param {Object} options - React Query options
 */
export const useActivityDocuments = (activityId, filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  // =========================================================================
  // ✅ MAIN QUERY - List documents
  // =========================================================================
  const query = useQuery({
    queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
    queryFn: async () => {
      if (!activityId) return null;
      const result = await activityDocumentService.getAll(activityId, filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data dokumen');
      }
      return result.data;
    },
    enabled: !!activityId,
    staleTime: 1000 * 60 * 5, // Cache 5 menit
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true, // ✅ Auto refresh saat user kembali ke tab
    placeholderData: (previousData) => previousData,
    ...options,
  });

  // =========================================================================
  // ✅ STATISTICS QUERY
  // =========================================================================
  const statisticsQuery = useQuery({
    queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, 'statistics'],
    queryFn: async () => {
      if (!activityId) return null;
      const result = await activityDocumentService.getStatistics(activityId);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil statistik');
      }
      return result.data;
    },
    enabled: !!activityId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  });

  // =========================================================================
  // ✅ OPTIONS QUERY (cached 24 jam)
  // =========================================================================
  const optionsQuery = useQuery({
    queryKey: ['activity-document-options'],
    queryFn: async () => {
      const result = await activityDocumentService.getOptions();
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil opsi upload');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache 24 jam
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // =========================================================================
  // ✅ UPLOAD MUTATION - Optimistic Update
  // =========================================================================
  const uploadMutation = useMutation({
    mutationFn: (formData) => activityDocumentService.upload(activityId, formData),
    
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId] 
      });
      
      const previousData = queryClient.getQueryData([
        ACTIVITY_DOCUMENTS_QUERY_KEY, 
        activityId, 
        filters
      ]);
      
      // ✅ Buat temp documents dari files yang akan diupload
      const files = formData.getAll('documents[]') || formData.getAll('documents');
      const tempDocuments = files.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        activity_id: activityId,
        file_name: file.name,
        file_type: file.name.split('.').pop().toLowerCase(),
        file_size: file.size,
        category: formData.get('category') || 'lainnya',
        description: formData.get('description') || '',
        uploaded_at: new Date().toISOString(),
        is_temp: true,
      }));
      
      queryClient.setQueryData(
        [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: [...tempDocuments, ...old.data],
            total: (old.total || 0) + tempDocuments.length,
          };
        }
      );
      
      return { previousData, tempDocuments };
    },
    
    onError: (err, formData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
          context.previousData
        );
      }
      console.error('Upload documents error:', err);
    },
    
    onSuccess: (response, formData, context) => {
      // ✅ Replace temp documents dengan real documents
      if (response.success && response.data?.documents) {
        queryClient.setQueryData(
          [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
          (old) => {
            if (!old || !old.data) return old;
            
            // Remove temp documents
            const nonTempDocs = old.data.filter(doc => !doc.is_temp);
            
            // Add real documents
            const realDocs = response.data.documents;
            
            return {
              ...old,
              data: [...realDocs, ...nonTempDocs],
              total: nonTempDocs.length + realDocs.length,
            };
          }
        );
      }
      
      // ✅ Invalidate untuk sync dengan filter lain
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId], 
        exact: false 
      });
      
      // ✅ Refresh statistics
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, 'statistics'] 
      });
    },
  });

  // =========================================================================
  // ✅ UPDATE MUTATION - Optimistic Update
  // =========================================================================
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => activityDocumentService.update(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId] 
      });
      
      const previousData = queryClient.getQueryData([
        ACTIVITY_DOCUMENTS_QUERY_KEY, 
        activityId, 
        filters
      ]);
      
      queryClient.setQueryData(
        [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map(item => 
              item.id === id ? { ...item, ...data } : item
            ),
          };
        }
      );
      
      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
          context.previousData
        );
      }
      console.error('Update document error:', err);
    },
    
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        queryClient.setQueryData(
          [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
          (old) => {
            if (!old || !old.data) return old;
            return {
              ...old,
              data: old.data.map(item => 
                item.id === variables.id ? response.data : item
              ),
            };
          }
        );
      }
      
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId], 
        exact: false 
      });
    },
  });

  // =========================================================================
  // ✅ DELETE MUTATION - Optimistic Update
  // =========================================================================
  const deleteMutation = useMutation({
    mutationFn: (id) => activityDocumentService.delete(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId] 
      });
      
      const previousData = queryClient.getQueryData([
        ACTIVITY_DOCUMENTS_QUERY_KEY, 
        activityId, 
        filters
      ]);
      
      queryClient.setQueryData(
        [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
        (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter(item => item.id !== id),
            total: Math.max(0, (old.total || 0) - 1),
          };
        }
      );
      
      return { previousData };
    },
    
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, filters],
          context.previousData
        );
      }
      console.error('Delete document error:', err);
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId], 
        exact: false 
      });
      
      // ✅ Refresh statistics
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId, 'statistics'] 
      });
    },
  });

  // =========================================================================
  // ✅ RETURN VALUES
  // =========================================================================
  return {
    // Main data
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Statistics
    statistics: statisticsQuery.data,
    isLoadingStatistics: statisticsQuery.isLoading,
    refetchStatistics: statisticsQuery.refetch,

    // Options
    options: optionsQuery.data,
    isLoadingOptions: optionsQuery.isLoading,

    // Upload
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,

    // Update
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Invalidate
    invalidate: () => {
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_DOCUMENTS_QUERY_KEY, activityId], 
        exact: false 
      });
    },
  };
};

export default useActivityDocuments;