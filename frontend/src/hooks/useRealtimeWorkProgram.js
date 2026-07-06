import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WORK_PROGRAM_QUERY_KEY } from './useWorkProgram';
import echo from '../services/echo';

export const useRealtimeWorkProgram = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!echo) {
      console.warn('⚠️ Laravel Echo tidak ditemukan. Realtime work program tidak aktif.');
      return;
    }

    console.log('✅ Realtime Work Program listener initialized');

    const channel = echo.channel('work-programs');
    channelRef.current = channel;

    const syncData = (eventName, eventData) => {
      console.log(`🔔 Realtime Work Program: ${eventName}`, eventData);
      
      queryClient.invalidateQueries({ 
        queryKey: [WORK_PROGRAM_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.work-program.created', (event) => 
      syncData('work-program.created', event)
    );
    channel.listen('.work-program.updated', (event) => 
      syncData('work-program.updated', event)
    );
    channel.listen('.work-program.deleted', (event) => 
      syncData('work-program.deleted', event)
    );

    return () => {
      console.log('🧹 Cleaning up realtime work program listener');
      try {
        if (channelRef.current) {
          channelRef.current.stopListening('.work-program.created');
          channelRef.current.stopListening('.work-program.updated');
          channelRef.current.stopListening('.work-program.deleted');
          echo.leaveChannel('work-programs');
        }
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    };
  }, [queryClient]);
};

export default useRealtimeWorkProgram;