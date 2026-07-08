import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityAttendanceService } from '../services/activityAttendanceService';

export const QUERY_KEYS = {
  activities: (filters) => ['attendance', 'activities', filters],
  attendanceDetail: (id) => ['attendance', 'detail', id],
  availableOrganizations: (id) => ['attendance', 'available-orgs', id],
  allOrganizations: () => ['attendance', 'all-organizations'],
  organizationsUnderPC: () => ['attendance', 'organizations-under-pc'],
};

export const useActivityAttendance = (filters = {}, options = {}) => {
  const queryClient = useQueryClient();

  const activitiesQuery = useQuery({
    queryKey: QUERY_KEYS.activities(filters),
    queryFn: async () => {
      const result = await activityAttendanceService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data kegiatan');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    ...options,
  });

  const allOrganizationsQuery = useQuery({
    queryKey: QUERY_KEYS.allOrganizations(),
    queryFn: async () => {
      const result = await activityAttendanceService.getAllOrganizations();
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data organisasi');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache 24 jam
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    enabled: false, // Hanya aktif saat dibutuhkan
  });

  const organizationsUnderPCQuery = useQuery({
    queryKey: QUERY_KEYS.organizationsUnderPC(),
    queryFn: async () => {
      const result = await activityAttendanceService.getAllOrganizationsUnderPC();
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data organisasi');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache 24 jam
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: ({ activityId, anggotaIds }) =>
      activityAttendanceService.saveAttendance(activityId, anggotaIds),
    
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendanceDetail(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.activities(filters),
      });
    },
  });

  const addParticipantsMutation = useMutation({
    mutationFn: ({ activityId, organizationIds }) =>
      activityAttendanceService.addParticipants(activityId, organizationIds),
    
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendanceDetail(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.availableOrganizations(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.allOrganizations(),
      });
    },
  });

  const removeParticipantsMutation = useMutation({
    mutationFn: ({ activityId, organizationIds }) =>
      activityAttendanceService.removeParticipants(activityId, organizationIds),
    
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendanceDetail(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.availableOrganizations(variables.activityId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.allOrganizations(),
      });
    },
  });

  return {
    activities: activitiesQuery.data,
    isLoadingActivities: activitiesQuery.isLoading,
    isFetchingActivities: activitiesQuery.isFetching,
    isErrorActivities: activitiesQuery.isError,
    errorActivities: activitiesQuery.error,
    refetchActivities: activitiesQuery.refetch,

    allOrganizations: allOrganizationsQuery.data,
    isLoadingAllOrganizations: allOrganizationsQuery.isLoading,
    fetchAllOrganizations: allOrganizationsQuery.refetch,

    organizationsUnderPC: organizationsUnderPCQuery.data,
    isLoadingOrganizationsUnderPC: organizationsUnderPCQuery.isLoading,

    saveAttendance: saveAttendanceMutation.mutate,
    saveAttendanceAsync: saveAttendanceMutation.mutateAsync,
    isSavingAttendance: saveAttendanceMutation.isPending,
    saveAttendanceError: saveAttendanceMutation.error,

    addParticipants: addParticipantsMutation.mutate,
    addParticipantsAsync: addParticipantsMutation.mutateAsync,
    isAddingParticipants: addParticipantsMutation.isPending,
    addParticipantsError: addParticipantsMutation.error,

    removeParticipants: removeParticipantsMutation.mutate,
    removeParticipantsAsync: removeParticipantsMutation.mutateAsync,
    isRemovingParticipants: removeParticipantsMutation.isPending,
    removeParticipantsError: removeParticipantsMutation.error,

    invalidate: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
      });
    },
  };
};

export default useActivityAttendance;