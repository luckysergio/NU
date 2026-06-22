import { useAuth } from "./useAuth";

export const usePermissions = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role?.slug === 'super-admin';
  const isAdmin = user?.role?.slug === 'admin';
  const isOperator = user?.role?.slug === 'operator';
  const isAnggotaRole = user?.role?.slug === 'anggota';
  
  const organizationLevel = user?.organization?.level?.slug;
  const isPC = organizationLevel === 'pc';
  const isMWC = organizationLevel === 'mwc';
  const isRanting = organizationLevel === 'ranting';
  const isLembaga = organizationLevel === 'lembaga';
  const isBanom = organizationLevel === 'banom';

  // User's organization ID
  const userOrganizationId = user?.organization?.id;

  return {
    user,
    userOrganizationId,
    
    // Role checks
    isSuperAdmin,
    isAdmin,
    isOperator,
    isAnggotaRole,
    
    // Organization level checks
    organizationLevel,
    isPC,
    isMWC,
    isRanting,
    isLembaga,
    isBanom,
    
    // Permission checks for actions
    canViewAll: isSuperAdmin, // ONLY Super Admin can view all
    canCreate: isSuperAdmin || isAdmin || isOperator,
    canEdit: isSuperAdmin || isAdmin,
    canDelete: isSuperAdmin || isAdmin,
    canManageUsers: isSuperAdmin || isAdmin,
    canViewLogs: isSuperAdmin,
    
    // Organization access scope
    organizationScope: {
      canSeeAll: isSuperAdmin, // ONLY Super Admin
      canSeeDescendants: isPC, // PC can see descendants
      canSeeOwnOnly: isAdmin || isOperator || isMWC || isRanting || isLembaga || isBanom,
    }
  };
};