import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState, useCallback } from 'react';
import dashboardService from '../services/dashboard';
import { useAuth } from '../contexts/AuthContext';

export const dashboardKeys = {
  all: ['dashboard'],
  details: () => [...dashboardKeys.all, 'detail'],
  themeChart: (themeId) => [...dashboardKeys.all, 'theme-chart', themeId],
  themeStatistics: (themeId) => [...dashboardKeys.all, 'theme-statistics', themeId],
};

export const useDashboard = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const query = useQuery({
    queryKey: dashboardKeys.details(),
    queryFn: async () => {
      const result = await dashboardService.getDashboard();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });

  const handleRealtimeEvent = useCallback((event) => {
    if (!mountedRef.current) return;
    
    setEventCount(prev => prev + 1);
    setLastEventTime(new Date());
    setIsConnected(true);

    queryClient.setQueryData(dashboardKeys.details(), (oldData) => {
      if (!oldData) {
        return {
          organizations: event.organizations || {},
          members: event.members || {},
          programs: event.programs || [],
        };
      }
      
      return {
        ...oldData,
        organizations: event.organizations || oldData.organizations,
        members: event.members || oldData.members,
        programs: event.programs || oldData.programs,
      };
    });
  }, [queryClient]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !query.data) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const channel = dashboardService.subscribeDashboard(handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
        setIsConnected(true);
      } else {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.details() });
          }
        }, 5000);
      }
    } catch (error) {
      setIsConnected(false);
    }

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        dashboardService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, query.data, queryClient, handleRealtimeEvent]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const healthCheckInterval = setInterval(() => {
      if (mountedRef.current && isConnected && lastEventTime) {
        const timeSinceLastEvent = Date.now() - lastEventTime.getTime();
        if (timeSinceLastEvent > 45000) {
          setIsConnected(false);
          
          if (channelRef.current) {
            dashboardService.unsubscribe(channelRef.current);
            channelRef.current = null;
          }
          
          try {
            const channel = dashboardService.subscribeDashboard(handleRealtimeEvent);
            if (channel) {
              channelRef.current = channel;
              setIsConnected(true);
            }
          } catch (error) {
            // ignore
          }
        }
      }
    }, 30000);

    return () => clearInterval(healthCheckInterval);
  }, [isAuthenticated, isConnected, lastEventTime, handleRealtimeEvent]);

  return {
    ...query,
    isConnected,
    eventCount,
    lastEventTime,
  };
};

export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const result = await dashboardService.refreshDashboard();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data) => {
      if (queryClient) {
        queryClient.setQueryData(dashboardKeys.details(), data);
      }
    },
  });
};

export const useThemeChart = (themeId) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);

  const query = useQuery({
    queryKey: dashboardKeys.themeChart(themeId),
    queryFn: async () => {
      if (!themeId) return null;
      const result = await dashboardService.getThemeChartData(themeId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isAuthenticated && !!themeId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !themeId || !query.data) return;

    const handleRealtimeEvent = (event) => {
      if (!mountedRef.current) return;
      
      if (event.theme_id === themeId) {
        queryClient.setQueryData(dashboardKeys.themeChart(themeId), event.data);
        setIsConnected(true);
      }
    };

    try {
      const channel = dashboardService.subscribeThemeChart(themeId, handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
        setIsConnected(true);
      }
    } catch (error) {
      setIsConnected(false);
    }

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        dashboardService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, themeId, query.data, queryClient]);

  return {
    ...query,
    isConnected,
  };
};

export const useRefreshThemeChart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (themeId) => {
      const result = await dashboardService.refreshThemeChart(themeId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data, themeId) => {
      if (queryClient) {
        queryClient.setQueryData(dashboardKeys.themeChart(themeId), data);
      }
    },
  });
};

export const useThemeStatistics = (themeId) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: dashboardKeys.themeStatistics(themeId),
    queryFn: async () => {
      if (!themeId) return null;
      const result = await dashboardService.getThemeStatistics(themeId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isAuthenticated && !!themeId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
};

export default {
  useDashboard,
  useRefreshDashboard,
  useThemeChart,
  useRefreshThemeChart,
  useThemeStatistics,
  dashboardKeys,
};