import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WORK_PROGRAM_QUERY_KEY } from './useWorkProgram';
import echo from '../services/echo';

export const useRealtimeWorkProgram = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!echo) return;

    const channel = echo.channel('work-programs');
    channelRef.current = channel;

    const syncData = () => {
      queryClient.invalidateQueries({ 
        queryKey: [WORK_PROGRAM_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.work-program.created', syncData);
    channel.listen('.work-program.updated', syncData);
    channel.listen('.work-program.deleted', syncData);

    return () => {
      try {
        if (channelRef.current) {
          channelRef.current.stopListening('.work-program.created');
          channelRef.current.stopListening('.work-program.updated');
          channelRef.current.stopListening('.work-program.deleted');
          echo.leaveChannel('work-programs');
        }
      } catch (e) {
      }
    };
  }, [queryClient]);
};

export default useRealtimeWorkProgram;