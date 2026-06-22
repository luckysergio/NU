/**
 * Cek apakah user memiliki akses ke route tertentu
 * @param {Object} user - User object from auth
 * @param {Object} routeConfig - Route configuration
 * @returns {boolean}
 */
export const hasRouteAccess = (user, routeConfig) => {
  if (!user) return false;
  
  const userRole = user?.role?.slug;
  const userLevel = user?.organization?.level?.slug;
  
  const { allowedRoles = [], allowedLevels = [] } = routeConfig;
  
  const hasAllowedRole = allowedRoles.length === 0 || allowedRoles.includes(userRole);
  const hasAllowedLevel = allowedLevels.length === 0 || allowedLevels.includes(userLevel);
  
  return hasAllowedRole && hasAllowedLevel;
};

/**
 * Dapatkan daftar route yang dapat diakses user
 * @param {Object} user - User object from auth
 * @param {Array} routes - List of all routes
 * @returns {Array}
 */
export const getAccessibleRoutes = (user, routes) => {
  return routes.filter(route => hasRouteAccess(user, route));
};