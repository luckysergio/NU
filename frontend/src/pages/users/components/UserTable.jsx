// src/pages/users/components/UserTable.jsx
import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Users,
} from 'lucide-react';
import { canEditUser, canDeleteUser } from '../../../utils/accessControl';

const UserTable = ({
  users,
  pagination,
  isLoading,
  isFetching,
  onPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleBlock,
  isTogglingStatus,
  isTogglingBlock,
  currentUser,
  canManage,
}) => {
  const getStatusBadge = (isActive, isBlocked, canLogin) => {
    if (!isActive) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Tidak Aktif
        </span>
      );
    }
    if (isBlocked) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
          Diblokir
        </span>
      );
    }
    if (!canLogin) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
          Tidak Bisa Login
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
        Aktif
      </span>
    );
  };

  const getRoleBadge = (roleName, roleSlug) => {
    const colors = {
      'super-admin': 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      admin: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      operator: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      anggota: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
    };
    const color = colors[roleSlug] || 'bg-gray-500 text-white';
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {roleName || '-'}
      </span>
    );
  };

  const getLevelBadge = (level) => {
    if (!level) return null;
    const colors = {
      pc: 'bg-purple-100 text-purple-700',
      mwc: 'bg-blue-100 text-blue-700',
      ranting: 'bg-green-100 text-green-700',
      lembaga: 'bg-orange-100 text-orange-700',
      banom: 'bg-pink-100 text-pink-700',
    };
    const slug = typeof level === 'object' ? level.slug : level;
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[slug] || 'bg-gray-100 text-gray-700'}`}>
        {typeof level === 'object' ? level.display_name || level.nama : level}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage === pagination.current_page) return;
    onPageChange(newPage);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat data user...</p>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-16 text-center">
          <div className="flex flex-col items-center gap-2">
            <Users className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500">Tidak ada data user</p>
            <p className="text-sm text-gray-400">Coba ubah filter atau tambahkan user baru</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isFetching && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Memperbarui data...</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                  <td className="text-center px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800">{user.name}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400 mt-0.5">{user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex justify-center">
                      {getRoleBadge(user.role?.nama, user.role?.slug)}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm text-gray-600">{user.organization?.nama || '-'}</span>
                      {user.organization?.level && (
                        <div>{getLevelBadge(user.organization.level)}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex justify-center">
                      {getStatusBadge(user.is_active, user.is_blocked, user.can_login)}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    {canManage && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title="Edit"
                          disabled={!canEditUser(currentUser, user)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Hapus"
                          disabled={!canDeleteUser(currentUser, user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      disabled={!canEditUser(currentUser, user)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      disabled={!canDeleteUser(currentUser, user)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <div className="mt-1">{getRoleBadge(user.role?.nama, user.role?.slug)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(user.is_active, user.is_blocked, user.can_login)}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Organisasi</p>
                  <p className="text-gray-700 mt-1">
                    {user.organization?.nama || '-'}
                    {user.organization?.level && (
                      <span className="ml-1">{getLevelBadge(user.organization.level)}</span>
                    )}
                  </p>
                </div>
                {user.phone && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Telepon</p>
                    <p className="text-gray-700 mt-1">{user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Menampilkan{' '}
              {(pagination.current_page - 1) * pagination.per_page + 1} -{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}{' '}
              dari {pagination.total} data
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.current_page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = pagination.current_page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                        pagination.current_page === pageNum
                          ? 'bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : 'border border-gray-300 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTable;