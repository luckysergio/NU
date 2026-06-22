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

export default {
  filterOrganizationsByAccess,
  getAccessibleOrganizationIds,
  getDefaultOrganizationId,
  canAccessOrganization,
  getUserAccessInfo,
  getOrganizationsWithLevelInfo,
  canManageData,
  getUserOrganizationLevel,
};