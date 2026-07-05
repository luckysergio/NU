// src/pages/users/components/UserFilters.jsx
import React from 'react';
import { Search, Filter, X, RefreshCw, AlertCircle } from 'lucide-react';

const UserFilters = ({
  filters,
  onFilterChange,
  onReset,
  roles,
  organizations,
  filteredOrganizations,
  isLoading,
}) => {
  const hasActiveFilters = filters.search || filters.role_id || filters.organization_id;

  // Level options
  const levelOptions = [
    { id: 1, name: 'PC', slug: 'pc', display: 'PCNU' },
    { id: 2, name: 'MWC', slug: 'mwc', display: 'MWCNU' },
    { id: 3, name: 'Ranting', slug: 'ranting', display: 'RANTING' },
    { id: 4, name: 'Lembaga', slug: 'lembaga', display: 'LEMBAGA' },
    { id: 5, name: 'Banom', slug: 'banom', display: 'BANOM' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-5 sm:p-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Cari user berdasarkan nama, email, atau telepon..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filter Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filter</span>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Level Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Level Organisasi
              </label>
              <select
                value={filters.level_slug || ''}
                onChange={(e) => onFilterChange('level_slug', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">Semua Level</option>
                {levelOptions.map((level) => (
                  <option key={level.id} value={level.slug}>
                    {level.display}
                  </option>
                ))}
              </select>
            </div>

            {/* Organization Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Organisasi
              </label>
              <select
                value={filters.organization_id || ''}
                onChange={(e) => onFilterChange('organization_id', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                disabled={!filters.level_slug || isLoading}
              >
                <option value="">
                  {isLoading ? 'Memuat...' : filters.level_slug ? 'Pilih Organisasi' : 'Pilih Level Terlebih Dahulu'}
                </option>
                {filteredOrganizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                  </option>
                ))}
              </select>
              {filters.level_slug && filteredOrganizations.length === 0 && !isLoading && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Tidak ada organisasi untuk level yang dipilih
                </p>
              )}
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Role
              </label>
              <select
                value={filters.role_id || ''}
                onChange={(e) => onFilterChange('role_id', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="">Semua Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;