import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ACTIVITY_QUERY_KEY } from './useActivity';
import echo from '../services/echo';

export const useRealtimeActivity = () => {
  const queryClient = useQueryClient();
  const channelsRef = useRef([]);

  useEffect(() => {
    if (!echo) return;

    const activityChannel = echo.channel('activities');
    channelsRef.current.push({ channel: activityChannel, name: 'activities' });

    const refreshActivityData = () => {
      queryClient.invalidateQueries({ 
        queryKey: [ACTIVITY_QUERY_KEY],
        exact: false,
      });
    };

    activityChannel.listen('.activity.created', refreshActivityData);
    activityChannel.listen('.activity.updated', refreshActivityData);
    activityChannel.listen('.activity.deleted', refreshActivityData);

    const workProgramChannel = echo.channel('work-programs');
    channelsRef.current.push({ channel: workProgramChannel, name: 'work-programs' });

    workProgramChannel.listen('.work-program.created', refreshActivityData);
    workProgramChannel.listen('.work-program.updated', refreshActivityData);
    workProgramChannel.listen('.work-program.deleted', refreshActivityData);

    return () => {
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
        }
      });
      
      channelsRef.current = [];
    };
  }, [queryClient]);
};

export default useRealtimeActivity;