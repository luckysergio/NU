import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ORGANIZATIONS_QUERY_KEY } from './useOrganizations';
import echo from '../services/echo';

export const useRealtimeOrganizations = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) {
      console.warn('Laravel Echo tidak ditemukan. Realtime update tidak aktif.');
      return;
    }

    const channel = echo.channel('organizations');

    const syncData = () => {
      console.log('🔔 Realtime: Data organization berubah, syncing...');
      queryClient.invalidateQueries({ 
        queryKey: [ORGANIZATIONS_QUERY_KEY], 
        exact: false 
      });
    };

    channel.listen('.organization.created', syncData);
    channel.listen('.organization.updated', syncData);
    channel.listen('.organization.deleted', syncData);

    return () => {
      channel.stopListening('.organization.created');
      channel.stopListening('.organization.updated');
      channel.stopListening('.organization.deleted');
      echo.leave('organizations');
    };
  }, [queryClient]);
};

export default useRealtimeOrganizations;