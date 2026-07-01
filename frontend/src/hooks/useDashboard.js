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
      console.log('📡 Fetching dashboard data...');
      const result = await dashboardService.getDashboard();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 0, // Selalu fresh untuk real-time
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Function to handle real-time events
  const handleRealtimeEvent = useCallback((event) => {
    if (!mountedRef.current) return;
    
    console.log('📊 Dashboard real-time event received:', event);
    setEventCount(prev => prev + 1);
    setLastEventTime(new Date());
    setIsConnected(true);

    // Update cache with new data
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

  // Setup real-time subscription
  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !query.data) {
      console.log('⏳ Waiting for authentication and data...');
      return;
    }

    console.log('🔄 Setting up dashboard real-time subscription...');

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const channel = dashboardService.subscribeDashboard(handleRealtimeEvent);
      if (channel) {
        channelRef.current = channel;
        setIsConnected(true);
        console.log('✅ Dashboard real-time subscription active');
      } else {
        console.warn('⚠️ Failed to subscribe to dashboard channel');
        setIsConnected(false);
        
        // Try to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('🔄 Attempting to reconnect dashboard...');
            queryClient.invalidateQueries({ queryKey: dashboardKeys.details() });
          }
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error setting up dashboard subscription:', error);
      setIsConnected(false);
    }

    return () => {
      mountedRef.current = false;
      console.log('🔌 Cleaning up dashboard subscription...');
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

  // Health check - every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const healthCheckInterval = setInterval(() => {
      if (mountedRef.current && isConnected && lastEventTime) {
        const timeSinceLastEvent = Date.now() - lastEventTime.getTime();
        // If no event for 45 seconds, consider disconnected
        if (timeSinceLastEvent > 45000) {
          console.warn('⚠️ No real-time events for 45 seconds, checking connection...');
          setIsConnected(false);
          
          // Try to reconnect
          if (channelRef.current) {
            dashboardService.unsubscribe(channelRef.current);
            channelRef.current = null;
          }
          
          // Re-subscribe
          try {
            const channel = dashboardService.subscribeDashboard(handleRealtimeEvent);
            if (channel) {
              channelRef.current = channel;
              setIsConnected(true);
              console.log('✅ Dashboard reconnected');
            }
          } catch (error) {
            console.error('❌ Reconnection failed:', error);
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
      console.log('🔄 Refreshing dashboard...');
      const result = await dashboardService.refreshDashboard();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data) => {
      if (queryClient) {
        queryClient.setQueryData(dashboardKeys.details(), data);
        console.log('✅ Dashboard refreshed successfully');
      }
    },
    onError: (error) => {
      console.error('❌ Refresh dashboard error:', error);
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
      console.log(`📡 Fetching theme chart data for theme ${themeId}...`);
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

  // Setup real-time subscription for theme chart
  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !themeId || !query.data) {
      return;
    }

    console.log(`🔄 Setting up theme chart ${themeId} real-time subscription...`);

    const handleRealtimeEvent = (event) => {
      if (!mountedRef.current) return;
      
      console.log(`📈 Theme chart ${themeId} real-time update:`, event);
      
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
        console.log(`✅ Theme chart ${themeId} real-time subscription active`);
      }
    } catch (error) {
      console.error(`❌ Error setting up theme chart ${themeId} subscription:`, error);
      setIsConnected(false);
    }

    return () => {
      mountedRef.current = false;
      console.log(`🔌 Cleaning up theme chart ${themeId} subscription...`);
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
      console.log(`🔄 Refreshing theme chart ${themeId}...`);
      const result = await dashboardService.refreshThemeChart(themeId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data, themeId) => {
      if (queryClient) {
        queryClient.setQueryData(dashboardKeys.themeChart(themeId), data);
        console.log(`✅ Theme chart ${themeId} refreshed successfully`);
      }
    },
    onError: (error) => {
      console.error('❌ Refresh theme chart error:', error);
    },
  });
};

export const useThemeStatistics = (themeId) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: dashboardKeys.themeStatistics(themeId),
    queryFn: async () => {
      if (!themeId) return null;
      console.log(`📡 Fetching theme statistics for theme ${themeId}...`);
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