// src/pages/users/components/UserStats.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../services/user';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const UserStats = () => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="mt-3 h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Gagal memuat statistik: {error?.message || 'Unknown error'}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total User',
      value: stats.total || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'User Aktif',
      value: stats.active || 0,
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'User Diblokir',
      value: stats.blocked || 0,
      icon: UserX,
      color: 'bg-red-50 text-red-600',
      border: 'border-red-100',
    },
    {
      label: 'Dapat Login',
      value: stats.can_login || 0,
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white rounded-2xl shadow-lg p-6 border ${card.border} hover:shadow-xl transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-3">
              {card.value.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default UserStats;