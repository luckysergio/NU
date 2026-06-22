import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  allowedLevels = [],
  fallbackPath = "/dashboard" 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.slug;
  
  // Handle both cases: level bisa berupa object dengan slug, atau langsung string
  let userLevel = null;
  if (user?.organization?.level) {
    if (typeof user?.organization?.level === 'object') {
      userLevel = user?.organization?.level?.slug;
    } else {
      userLevel = user?.organization?.level;
    }
  }

  // Super Admin selalu memiliki akses ke semua route
  if (userRole === 'super-admin') {
    return children;
  }

  // Untuk non-super-admin, cek role
  const hasAllowedRole = allowedRoles.length === 0 || allowedRoles.includes(userRole);
  
  // Jika allowedLevels ditentukan, cek juga level organisasi
  const hasAllowedLevel = allowedLevels.length === 0 || allowedLevels.includes(userLevel);

  if (!hasAllowedRole || !hasAllowedLevel) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;