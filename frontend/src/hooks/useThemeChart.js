// src/hooks/useThemeChart.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import dashboardService from '../services/dashboard';
import echo from '../services/echo';

export const THEME_CHART_QUERY_KEY = 'theme-chart';

export const useThemeChart = (themeId) => {
  const queryClient = useQueryClient();
  const channelsRef = useRef([]);
  const themeIdRef = useRef(themeId); // ✅ Simpan themeId di ref

  // ✅ Update ref saat themeId berubah
  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  // ✅ Fetch data dengan React Query
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

  // ✅ Realtime Listener - FIXED
  useEffect(() => {
    if (!themeId || !echo) {
      console.warn('⚠️ ThemeChart: themeId atau Echo tidak tersedia');
      return;
    }

    console.log(`✅ ThemeChart: Setting up realtime listener for theme ${themeId}`);

    // Fungsi untuk refresh data chart
    const refreshChart = (eventName, eventData) => {
      const currentThemeId = themeIdRef.current;
      console.log(`🔔 ThemeChart: ${eventName}`, eventData);
      
      // Hanya refresh jika event terkait dengan theme ini
      if (eventData && eventData.theme_id && eventData.theme_id !== currentThemeId) {
        console.log(`⏭️ ThemeChart: Skip event (different theme: ${eventData.theme_id})`);
        return;
      }
      
      console.log(`🔄 ThemeChart: Invalidating query for theme ${currentThemeId}`);
      queryClient.invalidateQueries({
        queryKey: [THEME_CHART_QUERY_KEY, currentThemeId],
      });
    };

    // ✅ Channel: work-programs
    const workProgramChannel = echo.channel('work-programs');
    channelsRef.current.push({ channel: workProgramChannel, name: 'work-programs' });

    workProgramChannel.listen('.work-program.created', (event) => 
      refreshChart('work-program.created', event)
    );
    workProgramChannel.listen('.work-program.updated', (event) => 
      refreshChart('work-program.updated', event)
    );
    workProgramChannel.listen('.work-program.deleted', (event) => 
      refreshChart('work-program.deleted', event)
    );

    // ✅ Channel: activities
    const activityChannel = echo.channel('activities');
    channelsRef.current.push({ channel: activityChannel, name: 'activities' });

    activityChannel.listen('.activity.created', (event) => 
      refreshChart('activity.created', event)
    );
    activityChannel.listen('.activity.updated', (event) => 
      refreshChart('activity.updated', event)
    );
    activityChannel.listen('.activity.deleted', (event) => 
      refreshChart('activity.deleted', event)
    );

    // ✅ Channel: program-themes
    const programThemeChannel = echo.channel('program-themes');
    channelsRef.current.push({ channel: programThemeChannel, name: 'program-themes' });

    programThemeChannel.listen('.program-theme.updated', (event) => {
      if (event.id === themeIdRef.current || event.data?.id === themeIdRef.current) {
        refreshChart('program-theme.updated', event);
      }
    });

    // ✅ Cleanup function
    return () => {
      console.log(`🧹 ThemeChart: Cleaning up listeners for theme ${themeIdRef.current}`);
      
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
          console.warn(`Cleanup error for ${name}:`, e);
        }
      });
      
      channelsRef.current = [];
    };
  }, [themeId]);

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