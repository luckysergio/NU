import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACTIVITY_QUERY_KEY } from './useActivity';
import { THEME_CHART_QUERY_KEY } from './useThemeChart';
import echo from '../services/echo';

export const useRealtimeActivity = () => {
  const queryClient = useQueryClient();
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!echo) {
      console.warn('⚠️ Laravel Echo tidak ditemukan. Realtime activity tidak aktif.');
      return;
    }

    console.log('✅ Realtime Activity listener initialized');

    const activityChannel = echo.channel('activities');
    channelsRef.current.push({ channel: activityChannel, name: 'activities' });

    const refreshActivityData = (eventName, eventData) => {
      console.log(`🔔 Realtime Activity: ${eventName}`, eventData);
      
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY],
        exact: false,
      });
    };

    activityChannel.listen('.activity.created', (event) => 
      refreshActivityData('activity.created', event)
    );
    activityChannel.listen('.activity.updated', (event) => 
      refreshActivityData('activity.updated', event)
    );
    activityChannel.listen('.activity.deleted', (event) => 
      refreshActivityData('activity.deleted', event)
    );

    const workProgramChannel = echo.channel('work-programs');
    channelsRef.current.push({ channel: workProgramChannel, name: 'work-programs' });

    const refreshOnWorkProgramChange = (eventName, eventData) => {
      console.log(`🔔 Realtime Activity: ${eventName} - Refreshing activity data`);
      
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY],
        exact: false,
      });
    };

    workProgramChannel.listen('.work-program.created', (event) => 
      refreshOnWorkProgramChange('work-program.created', event)
    );
    workProgramChannel.listen('.work-program.updated', (event) => 
      refreshOnWorkProgramChange('work-program.updated', event)
    );
    workProgramChannel.listen('.work-program.deleted', (event) => 
      refreshOnWorkProgramChange('work-program.deleted', event)
    );

    return () => {
      console.log('🧹 Cleaning up realtime activity listener');
      
      channelsRef.current.forEach(({ channel, name }) => {
        try {
          if (name === 'activities') {
            channel.stopListening('.activity.created');
            channel.stopListening('.activity.updated');
            channel.stopListening('.activity.deleted');
          } else if (name === 'work-programs') {
            channel.stopListening('.work-program.created');
            channel.stopListening('.work-program.updated');
            channel.stopListening('.work-program.deleted');
          }
          
          echo.leaveChannel(name);
        } catch (e) {
          console.warn(`Cleanup error for ${name}:`, e);
        }
      });
      
      channelsRef.current = [];
    };
  }, [queryClient]);
};

export default useRealtimeActivity;