import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import dashboardService from '../services/dashboard';
import echo from '../services/echo';

export const THEME_CHART_QUERY_KEY = 'theme-chart';

export const useThemeChart = (themeId) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  const query = useQuery({
    queryKey: [THEME_CHART_QUERY_KEY, themeId],
    queryFn: async () => {
      if (!themeId) return null;
      const result = await dashboardService.getThemeChartData(themeId);
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil data chart');
      }
      return result.data;
    },
    enabled: !!themeId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  useEffect(() => {
    if (!themeId || !echo) return;

    const setupRealtime = () => {
      const workProgramChannel = echo.channel('work-programs');
      channelRef.current = workProgramChannel;

      const activityChannel = echo.channel('activities');

      const refreshChart = (eventName) => {
        console.log(`🔔 ThemeChart: ${eventName} - Refreshing chart for theme ${themeId}`);
        queryClient.invalidateQueries({
          queryKey: [THEME_CHART_QUERY_KEY, themeId],
        });
      };

      workProgramChannel.listen('.work-program.created', () => refreshChart('work-program.created'));
      workProgramChannel.listen('.work-program.updated', () => refreshChart('work-program.updated'));
      workProgramChannel.listen('.work-program.deleted', () => refreshChart('work-program.deleted'));

      activityChannel.listen('.activity.created', () => refreshChart('activity.created'));
      activityChannel.listen('.activity.updated', () => refreshChart('activity.updated'));
      activityChannel.listen('.activity.deleted', () => refreshChart('activity.deleted'));

      const programThemeChannel = echo.channel('program-themes');
      programThemeChannel.listen('.program-theme.updated', (event) => {
        if (event.id === themeId) {
          refreshChart('program-theme.updated');
        }
      });
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.work-program.created');
          channelRef.current.stopListening('.work-program.updated');
          channelRef.current.stopListening('.work-program.deleted');
          echo.leaveChannel('work-programs');
          echo.leaveChannel('activities');
          echo.leaveChannel('program-themes');
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [themeId, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useThemeChart;