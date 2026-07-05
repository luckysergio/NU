// src/pages/users/components/RoleDistribution.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../services/user';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

const RoleDistribution = () => {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['user-statistics'],
    queryFn: async () => {
      const result = await userService.getStatistics();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const roles = stats.by_role || [];

  if (roles.length === 0) {
    return null;
  }

  const getBadgeColor = (slug) => {
    const colors = {
      'super-admin': 'bg-red-500',
      admin: 'bg-purple-500',
      operator: 'bg-blue-500',
      anggota: 'bg-emerald-500',
    };
    return colors[slug] || 'bg-gray-500';
  };

  const maxCount = Math.max(...roles.map((r) => r.users_count || 0), 1);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-800">Distribusi Role</h3>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const count = role.users_count || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const color = getBadgeColor(role.slug);

          return (
            <div key={role.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${color}`}></span>
                  <span className="text-gray-700">{role.nama}</span>
                </div>
                <span className="font-medium text-gray-600">{count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleDistribution;