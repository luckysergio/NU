// src/hooks/useDashboard.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { dashboardService } from '../services/dashboard';

export const DASHBOARD_QUERY_KEY = 'dashboard';

export const useDashboard = () => {
  const queryClient = useQueryClient();
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const channelRef = useRef(null);
  const activityChannelRef = useRef(null);
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
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      if (!isRealtimeEnabled || connectionStatus !== 'connected') {
        return 1000 * 30;
      }
      return false;
    },
    retry: 2,
  });

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

  useEffect(() => {
    if (!isRealtimeEnabled) {
      setConnectionStatus('disconnected');
      return;
    }

    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        if (!echoRef.current) {
          const echoModule = await import('../services/echo');
          echoRef.current = echoModule.default;
        }

        const echoInstance = echoRef.current;
        if (!echoInstance) {
          if (isSubscribed) setConnectionStatus('error');
          return;
        }

        const dashboardChannel = echoInstance.channel('dashboard');
        channelRef.current = dashboardChannel;

        if (isSubscribed) setConnectionStatus('connected');

        dashboardChannel.listen('.dashboard.organization.count.updated', (event) => {
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

        dashboardChannel.listen('.dashboard.member.count.updated', (event) => {
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

        dashboardChannel.listen('.dashboard.program.count.updated', (event) => {
          if (!isSubscribed) return;

          const programs = (event.active_themes || []).map(theme => ({
            theme_id: theme.id,
            theme: theme.nama,
            organization_id: theme.organization_id,
            organization_name: theme.organization_name,
            tanggal_mulai: theme.tanggal_mulai,
            tanggal_selesai: theme.tanggal_selesai,
            total_kegiatan: 0,
          }));

          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) {
                return {
                  total_themes: event.total_themes || 0,
                  programs: programs,
                  program_statistics: event.statistics || {},
                };
              }

              return {
                ...oldData,
                total_themes: event.total_themes || 0,
                programs: programs,
                program_statistics: event.statistics || {},
              };
            }
          );

          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
            cancelRefetch: true,
          });
        });

        const anggotaChannel = echoInstance.channel('anggota');

        anggotaChannel.listen('.anggota.created', () => {
          if (!isSubscribed) return;

          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                total_members: (oldData.total_members || 0) + 1,
              };
            }
          );
        });

        anggotaChannel.listen('.anggota.deleted', () => {
          if (!isSubscribed) return;

          queryClient.setQueryData(
            [DASHBOARD_QUERY_KEY, 'statistics'],
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                total_members: Math.max(0, (oldData.total_members || 0) - 1),
              };
            }
          );
        });

        anggotaChannel.listen('.anggota.updated', () => {
          if (!isSubscribed) return;
          
          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
          });
        });

        const activityChannel = echoInstance.channel('activities');
        activityChannelRef.current = activityChannel;

        activityChannel.listen('.activity.created', () => {
          if (!isSubscribed) return;
          
          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
          });
        });

        activityChannel.listen('.activity.updated', () => {
          if (!isSubscribed) return;
          
          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
          });
        });

        activityChannel.listen('.activity.deleted', () => {
          if (!isSubscribed) return;
          
          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
          });
        });

        if (echoInstance.connector?.socket) {
          const socket = echoInstance.connector.socket;

          socket.on('connect', () => {
            if (isSubscribed) setConnectionStatus('connected');
          });

          socket.on('disconnect', () => {
            if (isSubscribed) setConnectionStatus('disconnected');
          });

          socket.on('connect_error', () => {
            if (isSubscribed) setConnectionStatus('error');
          });

          socket.on('reconnect', () => {
            if (isSubscribed) setConnectionStatus('connected');
          });

          socket.on('reconnecting', () => {
            if (isSubscribed) setConnectionStatus('connecting');
          });
        }

      } catch (err) {
        if (isSubscribed) setConnectionStatus('error');
      }
    };

    setupRealtime();

    return () => {
      isSubscribed = false;

      try {
        if (channelRef.current) {
          channelRef.current.stopListening('.dashboard.organization.count.updated');
          channelRef.current.stopListening('.dashboard.member.count.updated');
          channelRef.current.stopListening('.dashboard.program.count.updated');
        }
        
        if (activityChannelRef.current) {
          activityChannelRef.current.stopListening('.activity.created');
          activityChannelRef.current.stopListening('.activity.updated');
          activityChannelRef.current.stopListening('.activity.deleted');
        }
        
        if (echoRef.current) {
          echoRef.current.leaveChannel('dashboard');
          echoRef.current.leaveChannel('anggota');
          echoRef.current.leaveChannel('activities');
        }
      } catch {
        // Silent cleanup
      }
    };
  }, [queryClient, isRealtimeEnabled]);

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
          channelRef.current.stopListening('.dashboard.program.count.updated');
          
          if (activityChannelRef.current) {
            activityChannelRef.current.stopListening('.activity.created');
            activityChannelRef.current.stopListening('.activity.updated');
            activityChannelRef.current.stopListening('.activity.deleted');
          }
          
          if (echoRef.current) {
            echoRef.current.leaveChannel('dashboard');
            echoRef.current.leaveChannel('anggota');
            echoRef.current.leaveChannel('activities');
          }
          setConnectionStatus('disconnected');
        } catch {
          // Silent cleanup
        }
      } else if (newState) {
        setConnectionStatus('connecting');
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