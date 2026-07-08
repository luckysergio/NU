import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import dashboardService from '../services/dashboard';
import echo from '../services/echo';

export const THEME_CHART_QUERY_KEY = 'theme-chart';

export const useThemeChart = (themeId) => {
  const queryClient = useQueryClient();
  const channelsRef = useRef([]);
  const themeIdRef = useRef(themeId);

  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

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

    const refreshChart = (eventData) => {
      const currentThemeId = themeIdRef.current;
      
      if (eventData?.theme_id && eventData.theme_id !== currentThemeId) {
        return;
      }
      
      queryClient.invalidateQueries({
        queryKey: [THEME_CHART_QUERY_KEY, currentThemeId],
      });
    };

    const workProgramChannel = echo.channel('work-programs');
    channelsRef.current.push({ channel: workProgramChannel, name: 'work-programs' });

    workProgramChannel.listen('.work-program.created', refreshChart);
    workProgramChannel.listen('.work-program.updated', refreshChart);
    workProgramChannel.listen('.work-program.deleted', refreshChart);

    const activityChannel = echo.channel('activities');
    channelsRef.current.push({ channel: activityChannel, name: 'activities' });

    activityChannel.listen('.activity.created', refreshChart);
    activityChannel.listen('.activity.updated', refreshChart);
    activityChannel.listen('.activity.deleted', refreshChart);

    const programThemeChannel = echo.channel('program-themes');
    channelsRef.current.push({ channel: programThemeChannel, name: 'program-themes' });

    programThemeChannel.listen('.program-theme.updated', (event) => {
      if (event.id === themeIdRef.current || event.data?.id === themeIdRef.current) {
        refreshChart(event);
      }
    });

    return () => {
      channelsRef.current.forEach(({ channel, name }) => {
        try {
          if (name === 'work-programs') {
            channel.stopListening('.work-program.created');
            channel.stopListening('.work-program.updated');
            channel.stopListening('.work-program.deleted');
          } else if (name === 'activities') {
            channel.stopListening('.activity.created');
            channel.stopListening('.activity.updated');
            channel.stopListening('.activity.deleted');
          } else if (name === 'program-themes') {
            channel.stopListening('.program-theme.updated');
          }
          
          echo.leaveChannel(name);
        } catch (e) {
        }
      });
      
      channelsRef.current = [];
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