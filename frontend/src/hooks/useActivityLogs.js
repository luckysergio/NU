import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityLogService } from '../services/activityLog';

export const ACTIVITY_LOG_QUERY_KEY = 'activityLogs';

export const useActivityLogs = (filters = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ACTIVITY_LOG_QUERY_KEY, filters],
    queryFn: async () => {
      const result = await activityLogService.getAll(filters);
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

  const deleteMutation = useMutation({
    mutationFn: (id) => activityLogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOG_QUERY_KEY] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOG_QUERY_KEY] });
    },
  };
};

export default useActivityLogs;