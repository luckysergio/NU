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

  const query = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
    queryFn: async () => {
      const result = await dashboardService.getStatistics();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
  });

  useEffect(() => {
    if (!isRealtimeEnabled) return;

    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        if (!echoRef.current) {
          const echoModule = await import('../services/echo');
          echoRef.current = echoModule.default;
        }

        const echoInstance = echoRef.current;
        
        const channel = echoInstance.channel('dashboard');
        channelRef.current = channel;
        
        if (isSubscribed) {
          setConnectionStatus('connected');
        }

        channel.listen('.dashboard.organization.count.updated', (event) => {
          if (!isSubscribed) return;

          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) {
                return {
                  total_organizations: event.total_organizations,
                  statistics: event.statistics,
                  totals: event.totals || {},
                };
              }
              
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
                total_organizations: event.total_organizations || 0,
                statistics: transformedStatistics,
                totals: event.totals || {},
              };
            }
          );
        });

        channel.listen('.dashboard.member.count.updated', (event) => {
          if (!isSubscribed) return;

          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) return oldData;
              
              const memberStatistics = {};
              if (event.statistics) {
                Object.keys(event.statistics).forEach((key) => {
                  memberStatistics[key] = {
                    count: event.statistics[key].count || 0,
                    label: event.statistics[key].label || key.toUpperCase(),
                    slug: key,
                    color: event.statistics[key].color || 'gray',
                  };
                });
              }

              return {
                ...oldData,
                total_members: event.total_members || 0,
                member_statistics: memberStatistics,
              };
            }
          );
        });

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

      } catch {
        if (isSubscribed) {
          setConnectionStatus('error');
        }
      }
    };

    setupRealtime();

    return () => {
      isSubscribed = false;
      
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.dashboard.organization.count.updated');
          channelRef.current.stopListening('.dashboard.member.count.updated');
          if (echoRef.current) {
            echoRef.current.leaveChannel('dashboard');
          }
        } catch {
          // Silent cleanup
        }
      }
    };
  }, [queryClient, isRealtimeEnabled]);

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

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
    });
  }, [queryClient]);

  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled((prev) => {
      const newState = !prev;
      
      if (!newState && channelRef.current) {
        try {
          channelRef.current.stopListening('.dashboard.organization.count.updated');
          channelRef.current.stopListening('.dashboard.member.count.updated');
          if (echoRef.current) {
            echoRef.current.leaveChannel('dashboard');
          }
          setConnectionStatus('disconnected');
        } catch {
          // Silent cleanup
        }
      }
      
      return newState;
    });
  }, []);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  };
};

export default useDashboard;