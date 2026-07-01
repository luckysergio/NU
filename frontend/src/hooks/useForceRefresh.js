// src/hooks/useForceRefresh.js
import { useQueryClient } from '@tanstack/react-query';
import { organizationKeys } from './useOrganization';

export const useForceRefresh = () => {
  const queryClient = useQueryClient();

  const forceRefreshOrganizations = async () => {
    console.log('🔄 Force refreshing all organization data...');
    
    // 1. Remove all cached data
    queryClient.removeQueries({ 
      queryKey: organizationKeys.all,
      exact: false,
    });
    
    // 2. Refetch all active queries
    await queryClient.refetchQueries({
      queryKey: organizationKeys.all,
      exact: false,
      type: 'active',
    });
    
    // 3. Invalidate and refetch
    await queryClient.invalidateQueries({
      queryKey: organizationKeys.all,
      exact: false,
      refetchType: 'active',
    });
  };

  const forceRefreshList = async (params) => {
    console.log('🔄 Force refreshing organization list...');
    
    // 1. Remove specific list cache
    queryClient.removeQueries({ 
      queryKey: organizationKeys.list(params),
      exact: false,
    });
    
    // 2. Refetch
    await queryClient.refetchQueries({
      queryKey: organizationKeys.list(params),
      exact: false,
      type: 'active',
    });
  };

  return {
    forceRefreshOrganizations,
    forceRefreshList,
  };
};