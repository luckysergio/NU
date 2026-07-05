// src/utils/accessControl.js

/**
 * Filter organizations based on user access level
 * @param {Array} organizations - List of all organizations
 * @param {Object} user - Current logged in user
 * @returns {Array} Filtered organizations
 */
export const filterOrganizationsByAccess = (organizations, user) => {
  if (!user) return [];
  if (!organizations || !Array.isArray(organizations)) return [];
  
  const roleSlug = user?.role?.slug;
  const userOrgId = user?.organization?.id;
  
  // Handle both cases: level bisa berupa object dengan slug, atau langsung string
  let userLevel = null;
  if (user?.organization?.level) {
    if (typeof user?.organization?.level === 'object') {
      userLevel = user?.organization?.level?.slug;
    } else {
      userLevel = user?.organization?.level;
    }
  }
  
  // ==========================================
  // SUPER ADMIN - Bisa melihat SEMUA organisasi
  // ==========================================
  if (roleSlug === 'super-admin') {
    return organizations;
  }
  
  // ==========================================
  // ADMIN - Bisa melihat SEMUA organisasi
  // (Sesuai dengan canEdit dan canCreate di backend)
  // ==========================================
  if (roleSlug === 'admin') {
    return organizations;
  }
  
  // ==========================================
  // OPERATOR - Hanya bisa melihat organisasinya sendiri
  // ==========================================
  if (roleSlug === 'operator') {
    return organizations.filter(org => org.id === userOrgId);
  }
  
  // ==========================================
  // PC (bukan admin) - Bisa melihat organisasi sendiri dan turunannya
  // ==========================================
  if (userLevel === 'pc') {
    return organizations.filter(org => 
      org.id === userOrgId || (org.ancestors && org.ancestors.includes(userOrgId))
    );
  }
  
  // ==========================================
  // MWC - Bisa melihat organisasi sendiri dan turunannya (ranting)
  // ==========================================
  if (userLevel === 'mwc') {
    return organizations.filter(org => 
      org.id === userOrgId || (org.ancestors && org.ancestors.includes(userOrgId))
    );
  }
  
  // ==========================================
  // RANTING, LEMBAGA, BANOM - Hanya bisa melihat organisasi sendiri
  // ==========================================
  return organizations.filter(org => org.id === userOrgId);
};

/**
 * Get accessible organization IDs for the current user
 * @param {Array} organizations - List of all organizations
 * @param {Object} user - Current logged in user
 * @returns {Array} Array of organization IDs that user can access
 */
export const getAccessibleOrganizationIds = (organizations, user) => {
  const accessibleOrgs = filterOrganizationsByAccess(organizations, user);
  return accessibleOrgs.map(org => org.id);
};

/**
 * Get default organization ID for forms
 * @param {Array} organizations - Filtered organizations
 * @param {Object} user - Current logged in user
 * @returns {string|null} Default organization ID
 */
export const getDefaultOrganizationId = (organizations, user) => {
  if (!organizations || !organizations.length) return null;
  
  const roleSlug = user?.role?.slug;
  const userOrgId = user?.organization?.id;
  
  // SUPER ADMIN - Tidak memiliki default organization (biarkan user memilih)
  if (roleSlug === 'super-admin') {
    return null;
  }
  
  // ADMIN - Tidak memiliki default organization (biarkan user memilih)
  if (roleSlug === 'admin') {
    return null;
  }
  
  // OPERATOR dan lainnya - Return organisasi mereka sendiri
  const userOrg = organizations.find(org => org.id === userOrgId);
  if (userOrg) {
    return userOrg.id.toString();
  }
  
  // Fallback ke organisasi pertama jika organisasi user tidak ditemukan
  return organizations[0]?.id?.toString() || null;
};

/**
 * Check if user can access a specific organization
 * @param {Object} user - Current logged in user
 * @param {number} organizationId - Organization ID to check
 * @param {Array} organizations - List of all organizations (optional, for hierarchy check)
 * @returns {boolean}
 */
export const canAccessOrganization = (user, organizationId, organizations = []) => {
  if (!user || !organizationId) return false;
  
  const roleSlug = user?.role?.slug;
  const userOrgId = user?.organization?.id;
  
  // Handle both cases for level
  let userLevel = null;
  if (user?.organization?.level) {
    if (typeof user?.organization?.level === 'object') {
      userLevel = user?.organization?.level?.slug;
    } else {
      userLevel = user?.organization?.level;
    }
  }
  
  // SUPER ADMIN - Bisa mengakses semua organisasi
  if (roleSlug === 'super-admin') {
    return true;
  }
  
  // ADMIN - Bisa mengakses semua organisasi
  if (roleSlug === 'admin') {
    return true;
  }
  
  // OPERATOR - Hanya bisa mengakses organisasinya sendiri
  if (roleSlug === 'operator') {
    return organizationId === userOrgId;
  }
  
  // PC - Bisa mengakses organisasi sendiri dan turunannya
  if (userLevel === 'pc') {
    if (organizationId === userOrgId) return true;
    const targetOrg = organizations.find(org => org.id === organizationId);
    return targetOrg?.ancestors?.includes(userOrgId) || false;
  }
  
  // MWC - Bisa mengakses organisasi sendiri dan turunannya
  if (userLevel === 'mwc') {
    if (organizationId === userOrgId) return true;
    const targetOrg = organizations.find(org => org.id === organizationId);
    return targetOrg?.ancestors?.includes(userOrgId) || false;
  }
  
  return organizationId === userOrgId;
};

/**
 * Get user role and level information for debugging
 * @param {Object} user - Current logged in user
 * @returns {Object} User role and level info
 */
export const getUserAccessInfo = (user) => {
  if (!user) return { role: null, level: null, canViewAll: false };
  
  const roleSlug = user?.role?.slug;
  let userLevel = null;
  
  if (user?.organization?.level) {
    if (typeof user?.organization?.level === 'object') {
      userLevel = user?.organization?.level?.slug;
    } else {
      userLevel = user?.organization?.level;
    }
  }
  
  // Super Admin dan Admin bisa melihat semua
  const canViewAll = roleSlug === 'super-admin' || roleSlug === 'admin';
  
  return {
    role: roleSlug,
    level: userLevel,
    canViewAll,
    organizationId: user?.organization?.id,
    organizationName: user?.organization?.nama
  };
};

/**
 * Get all organizations with their level information for debugging
 * @param {Array} organizations - List of organizations
 * @returns {Array} Organizations with level info
 */
export const getOrganizationsWithLevelInfo = (organizations) => {
  if (!organizations || !Array.isArray(organizations)) return [];
  
  return organizations.map(org => ({
    id: org.id,
    nama: org.nama,
    level: org.level?.nama || org.level || 'Unknown',
    level_slug: org.level?.slug || 'unknown',
    parent_id: org.parent_id,
    parent_nama: organizations.find(p => p.id === org.parent_id)?.nama || null
  }));
};

/**
 * Check if user can manage (create, edit, delete) data
 * @param {Object} user - Current logged in user
 * @returns {boolean}
 */
export const canManageData = (user) => {
  if (!user) return false;
  const roleSlug = user?.role?.slug;
  return roleSlug === 'super-admin' || roleSlug === 'admin';
};

/**
 * Check if user can manage users
 * @param {Object} user - Current logged in user
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  const roleSlug = user?.role?.slug;
  return roleSlug === 'super-admin' || roleSlug === 'admin' || roleSlug === 'operator';
};

/**
 * Check if user can edit a specific user
 * @param {Object} user - Current logged in user
 * @param {Object} targetUser - Target user to check
 * @returns {boolean}
 */
export const canEditUser = (user, targetUser) => {
  if (!user || !targetUser) return false;
  
  const userRole = user?.role?.slug;
  const targetRole = targetUser?.role?.slug;
  const userOrgId = user?.organization?.id;
  const targetOrgId = targetUser?.organization?.id;
  
  // Super admin can edit all users except other super admins (unless it's themselves)
  if (userRole === 'super-admin') {
    // Super admin cannot edit other super admins
    if (targetRole === 'super-admin' && user.id !== targetUser.id) {
      return false;
    }
    return true;
  }
  
  // Admin can edit users in their organization except super admin and admin
  if (userRole === 'admin') {
    // Admin cannot edit super admin or other admin
    if (targetRole === 'super-admin' || targetRole === 'admin') {
      return false;
    }
    // Admin can edit users in their own organization
    return userOrgId === targetOrgId;
  }
  
  // Operator can only edit anggota in their organization
  if (userRole === 'operator') {
    // Operator can only edit anggota
    if (targetRole !== 'anggota') {
      return false;
    }
    return userOrgId === targetOrgId;
  }
  
  // Anggota and others cannot edit anyone
  return false;
};

/**
 * Check if user can delete a specific user
 * @param {Object} user - Current logged in user
 * @param {Object} targetUser - Target user to check
 * @returns {boolean}
 */
export const canDeleteUser = (user, targetUser) => {
  if (!user || !targetUser) return false;
  
  // Cannot delete self
  if (user.id === targetUser.id) return false;
  
  const userRole = user?.role?.slug;
  const targetRole = targetUser?.role?.slug;
  const userOrgId = user?.organization?.id;
  const targetOrgId = targetUser?.organization?.id;
  
  // Super admin can delete all users except super admin
  if (userRole === 'super-admin') {
    return targetRole !== 'super-admin';
  }
  
  // Admin can delete users in their organization except admin and super admin
  if (userRole === 'admin') {
    if (targetRole === 'super-admin' || targetRole === 'admin') {
      return false;
    }
    return userOrgId === targetOrgId;
  }
  
  // Operator can only delete anggota in their organization
  if (userRole === 'operator') {
    if (targetRole !== 'anggota') {
      return false;
    }
    return userOrgId === targetOrgId;
  }
  
  // Others cannot delete anyone
  return false;
};

/**
 * Get the level of organization for the current user
 * @param {Object} user - Current logged in user
 * @returns {string|null}
 */
export const getUserOrganizationLevel = (user) => {
  if (!user?.organization?.level) return null;
  
  if (typeof user?.organization?.level === 'object') {
    return user?.organization?.level?.slug;
  }
  return user?.organization?.level;
};

/**
 * Check if user has a specific role
 * @param {Object} user - Current logged in user
 * @param {string|Array} roles - Role slug or array of role slugs
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
  if (!user) return false;
  const userRole = user?.role?.slug;
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
};

/**
 * Get user permissions based on role
 * @param {Object} user - Current logged in user
 * @returns {Object} User permissions
 */
export const getUserPermissions = (user) => {
  if (!user) {
    return {
      canViewAll: false,
      canManage: false,
      canManageUsers: false,
      canEdit: false,
      canDelete: false,
      canCreate: false,
    };
  }
  
  const roleSlug = user?.role?.slug;
  
  return {
    canViewAll: roleSlug === 'super-admin' || roleSlug === 'admin',
    canManage: roleSlug === 'super-admin' || roleSlug === 'admin',
    canManageUsers: roleSlug === 'super-admin' || roleSlug === 'admin' || roleSlug === 'operator',
    canEdit: roleSlug === 'super-admin' || roleSlug === 'admin',
    canDelete: roleSlug === 'super-admin' || roleSlug === 'admin',
    canCreate: roleSlug === 'super-admin' || roleSlug === 'admin',
    isSuperAdmin: roleSlug === 'super-admin',
    isAdmin: roleSlug === 'admin',
    isOperator: roleSlug === 'operator',
    isAnggota: roleSlug === 'anggota',
  };
};

export default {
  filterOrganizationsByAccess,
  getAccessibleOrganizationIds,
  getDefaultOrganizationId,
  canAccessOrganization,
  getUserAccessInfo,
  getOrganizationsWithLevelInfo,
  canManageData,
  canManageUsers,
  canEditUser,
  canDeleteUser,
  getUserOrganizationLevel,
  hasRole,
  getUserPermissions,
};