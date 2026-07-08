import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ANGGOTA_QUERY_KEY } from './useAnggota';
import echo from '../services/echo';

export const useRealtimeAnggota = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) return;

    const channel = echo.channel('anggota');

    const syncData = () => {
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.anggota.created', syncData);
    channel.listen('.anggota.updated', syncData);
    channel.listen('.anggota.deleted', syncData);

    return () => {
      try {
        channel.stopListening('.anggota.created');
        channel.stopListening('.anggota.updated');
        channel.stopListening('.anggota.deleted');
        echo.leave('anggota');
      } catch (e) {
      }
    };
  }, [queryClient]);
};

export default useRealtimeAnggota;