// src/hooks/useRealtimeAnggota.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ANGGOTA_QUERY_KEY } from './useAnggota';
import echo from '../services/echo';

export const useRealtimeAnggota = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) {
      console.warn('⚠️ Laravel Echo tidak ditemukan.');
      return;
    }

    const channel = echo.channel('anggota');

    const syncData = (eventName, eventData) => {
      console.log(`🔔 Realtime Anggota: ${eventName}`, eventData);
      
      queryClient.invalidateQueries({ 
        queryKey: [ANGGOTA_QUERY_KEY],
        exact: false,
      });
    };

    channel.listen('.anggota.created', (event) => syncData('anggota.created', event));
    channel.listen('.anggota.updated', (event) => syncData('anggota.updated', event));
    channel.listen('.anggota.deleted', (event) => syncData('anggota.deleted', event));

    return () => {
      try {
        channel.stopListening('.anggota.created');
        channel.stopListening('.anggota.updated');
        channel.stopListening('.anggota.deleted');
        echo.leave('anggota');
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    };
  }, [queryClient]);
};

export default useRealtimeAnggota;