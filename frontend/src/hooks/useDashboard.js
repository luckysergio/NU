// hooks/useDashboard.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { dashboardService } from '../services/dashboard';
import echo from '../services/echo';

export const DASHBOARD_QUERY_KEY = 'dashboard';

export const useDashboard = () => {
  const queryClient = useQueryClient();
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);
  const echoRef = useRef(null);

  // Query untuk mendapatkan data dashboard dengan cache
  const query = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
    queryFn: async () => {
      const result = await dashboardService.getStatistics();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 10 * 60 * 1000, // 10 menit
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
  });

  // Setup real-time subscription
  useEffect(() => {
    if (!isRealtimeEnabled) return;

    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        // Import echo dynamically jika belum ada
        if (!echoRef.current) {
          const echoModule = await import('../services/echo');
          echoRef.current = echoModule.default;
        }

        const echoInstance = echoRef.current;
        
        // Subscribe ke channel dashboard
        const channel = echoInstance.channel('dashboard');
        channelRef.current = channel;
        
        if (isSubscribed) {
          setConnectionStatus('connected');
        }

        // Listen untuk dashboard updates
        channel.listen('.dashboard.organization.count.updated', (event) => {
          console.log('[Dashboard Realtime] Organization count updated:', event);
          
          if (!isSubscribed) return;

          // Update cache dengan data terbaru
          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) {
                return {
                  total_organizations: event.total_organizations,
                  statistics: event.statistics,
                };
              }
              
              // Transform statistics ke format yang sesuai
              const transformedStatistics = {};
              if (event.statistics) {
                Object.keys(event.statistics).forEach((key) => {
                  transformedStatistics[key] = {
                    count: event.statistics[key].count || 0,
                    label: event.statistics[key].display || event.statistics[key].name || key.toUpperCase(),
                    slug: key,
                    color: getLevelColor(key),
                  };
                });
              }
              
              return {
                ...oldData,
                total_organizations: event.total_organizations,
                statistics: transformedStatistics,
              };
            }
          );
        });

        // Connection event handlers
        if (echoInstance.connector?.socket) {
          const socket = echoInstance.connector.socket;
          
          socket.on('error', () => {
            if (isSubscribed) setConnectionStatus('error');
          });
          
          socket.on('disconnect', () => {
            if (isSubscribed) setConnectionStatus('disconnected');
          });
          
          socket.on('connect', () => {
            if (isSubscribed) setConnectionStatus('connected');
          });
        }

      } catch (error) {
        console.error('[Dashboard Realtime] Failed to connect:', error);
        if (isSubscribed) {
          setConnectionStatus('error');
        }
      }
    };

    setupRealtime();

    // Cleanup function
    return () => {
      isSubscribed = false;
      
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.dashboard.organization.count.updated');
          if (echoRef.current) {
            echoRef.current.leaveChannel('dashboard');
          }
        } catch (error) {
          console.error('[Dashboard Realtime] Cleanup error:', error);
        }
      }
    };
  }, [queryClient, isRealtimeEnabled]);

  // Helper function untuk mendapatkan warna berdasarkan level
  const getLevelColor = (slug) => {
    const colors = {
      pc: 'purple',
      mwc: 'blue',
      ranting: 'green',
      'anak-ranting': 'teal',
      lembaga: 'orange',
      banom: 'pink',
    };
    return colors[slug] || 'gray';
  };

  // Force refresh data
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
    });
  }, [queryClient]);

  // Toggle realtime
  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled((prev) => {
      const newState = !prev;
      
      // Jika dimatikan, cleanup channel
      if (!newState && channelRef.current) {
        try {
          channelRef.current.stopListening('.dashboard.organization.count.updated');
          if (echoRef.current) {
            echoRef.current.leaveChannel('dashboard');
          }
          setConnectionStatus('disconnected');
        } catch (error) {
          console.error('[Dashboard Realtime] Toggle cleanup error:', error);
        }
      }
      
      return newState;
    });
  }, []);

  return {
    // Query data
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    
    // Utilities
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  };
};

export default useDashboard;