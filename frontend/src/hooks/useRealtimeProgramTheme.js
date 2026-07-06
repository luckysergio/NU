// src/hooks/useRealtimeProgramTheme.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PROGRAM_THEME_QUERY_KEY } from './useProgramThemes';
import echo from '../services/echo';

export const useRealtimeProgramTheme = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) {
      console.warn('⚠️ Laravel Echo tidak ditemukan. Realtime program theme tidak aktif.');
      return;
    }

    console.log('✅ Realtime Program Theme listener initialized');

    const channel = echo.channel('program-themes');

    const syncData = (eventName, eventData) => {
      console.log(`🔔 Realtime Program Theme: ${eventName}`, eventData);
      
      // ✅ Invalidate semua query program theme
      queryClient.invalidateQueries({ 
        queryKey: [PROGRAM_THEME_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.program-theme.created', (event) => syncData('program-theme.created', event));
    channel.listen('.program-theme.updated', (event) => syncData('program-theme.updated', event));
    channel.listen('.program-theme.deleted', (event) => syncData('program-theme.deleted', event));

    return () => {
      console.log('🧹 Cleaning up realtime program theme listener');
      try {
        channel.stopListening('.program-theme.created');
        channel.stopListening('.program-theme.updated');
        channel.stopListening('.program-theme.deleted');
        echo.leave('program-themes');
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    };
  }, [queryClient]);
};

export default useRealtimeProgramTheme;