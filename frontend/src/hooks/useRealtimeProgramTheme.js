import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PROGRAM_THEME_QUERY_KEY } from './useProgramThemes';
import echo from '../services/echo';

export const useRealtimeProgramTheme = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) return;

    const channel = echo.channel('program-themes');

    const syncData = () => {
      queryClient.invalidateQueries({ 
        queryKey: [PROGRAM_THEME_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.program-theme.created', syncData);
    channel.listen('.program-theme.updated', syncData);
    channel.listen('.program-theme.deleted', syncData);

    return () => {
      try {
        channel.stopListening('.program-theme.created');
        channel.stopListening('.program-theme.updated');
        channel.stopListening('.program-theme.deleted');
        echo.leave('program-themes');
      } catch (e) {
      }
    };
  }, [queryClient]);
};

export default useRealtimeProgramTheme;