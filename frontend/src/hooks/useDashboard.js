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
  const echoRef = useRef(null);

  // ============================================
  // 1. MAIN QUERY
  // ============================================
  const query = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
    queryFn: async () => {
      const result = await dashboardService.getStatistics();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => {
      if (!isRealtimeEnabled || connectionStatus !== 'connected') {
        return 1000 * 30;
      }
      return false;
    },
    retry: 2,
  });

  // ============================================
  // 2. REALTIME LISTENERS
  // ============================================
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

        // ============================================
        // ✅ CHANNEL: DASHBOARD
        // ============================================
        const dashboardChannel = echoInstance.channel('dashboard');
        channelRef.current = dashboardChannel;

        if (isSubscribed) setConnectionStatus('connected');

        // Event: Organization Count Updated
        dashboardChannel.listen('.dashboard.organization.count.updated', (event) => {
          if (!isSubscribed) return;
          console.log('🔔 Dashboard: Organization Count Updated');

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

        // Event: Member Count Updated
        dashboardChannel.listen('.dashboard.member.count.updated', (event) => {
          if (!isSubscribed) return;
          console.log('🔔 Dashboard: Member Count Updated');

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

        // ============================================
        // ✅ CHANNEL: ANGGOTA (untuk trigger refresh dashboard stats)
        // Karena event anggota juga masuk ke channel dashboard,
        // kita bisa langsung update total_members tanpa refetch
        // ============================================
        const anggotaChannel = echoInstance.channel('anggota');

        // Saat anggota dibuat → increment total_members
        anggotaChannel.listen('.anggota.created', (event) => {
          if (!isSubscribed) return;
          console.log('🔔 Dashboard: Anggota Created (auto update total)');

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

        // Saat anggota dihapus → decrement total_members
        anggotaChannel.listen('.anggota.deleted', (event) => {
          if (!isSubscribed) return;
          console.log('🔔 Dashboard: Anggota Deleted (auto update total)');

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

        // Saat anggota diupdate → trigger full refresh untuk statistik per level
        anggotaChannel.listen('.anggota.updated', () => {
          if (!isSubscribed) return;
          console.log('🔔 Dashboard: Anggota Updated (refresh stats)');
          
          queryClient.invalidateQueries({
            queryKey: [DASHBOARD_QUERY_KEY, 'statistics'],
          });
        });

        // ============================================
        // ✅ MONITOR SOCKET CONNECTION
        // ============================================
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
        console.error('❌ Realtime setup error:', err);
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
        }
        
        if (echoRef.current) {
          echoRef.current.leaveChannel('dashboard');
          echoRef.current.leaveChannel('anggota');
        }
      } catch {
        // Silent cleanup
      }
    };
  }, [queryClient, isRealtimeEnabled]);

  // ============================================
  // HELPERS
  // ============================================
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
            echoRef.current.leaveChannel('anggota');
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