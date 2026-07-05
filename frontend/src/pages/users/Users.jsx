// src/pages/users/UsersPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import { useRoles } from '../../hooks/useRoles';
import { userService } from '../../services/user';
import { organizationService } from '../../services/organization';
import {
  filterOrganizationsByAccess,
  canManageUsers,
  canEditUser,
  canDeleteUser,
} from '../../utils/accessControl';
import MainLayout from '../../components/layout/MainLayout';
import UserFormModal from './components/UserFormModal';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import { Loader2, Users, Plus } from 'lucide-react';

const UsersPage = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    role_id: '',
    organization_id: '',
    level_slug: '',
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Organizations for filters
  const [organizations, setOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

  const canManage = canManageUsers(currentUser);

  // Use React Query hooks
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    create,
    isCreating,
    update,
    isUpdating,
    delete: deleteUser,
    isDeleting,
  } = useUsers({
    page,
    per_page: perPage,
    ...filters,
  });

  const { data: rolesData } = useRoles({ per_page: 100 });

  const users = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };
  const roles = rolesData?.data || [];

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (fetchingOrgs) return;
      
      setFetchingOrgs(true);
      try {
        const result = await organizationService.getAll({ per_page: 1000, page: 1 });
        
        if (!result.success) {
          console.error('Failed to fetch organizations:', result.message);
          return;
        }
        
        let allOrgs = result.data.data || [];
        const lastPage = result.data.last_page || 1;
        
        if (lastPage > 1) {
          const promises = [];
          for (let page = 2; page <= lastPage; page++) {
            promises.push(organizationService.getAll({ per_page: 1000, page }));
          }
          
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res.success && res.data.data) {
              allOrgs = [...allOrgs, ...res.data.data];
            }
          });
        }
        
        setAllOrganizations(allOrgs);
        const accessibleOrgs = filterOrganizationsByAccess(allOrgs, currentUser);
        setOrganizations(accessibleOrgs);
      } catch (err) {
        console.error('Error fetching organizations:', err);
      } finally {
        setFetchingOrgs(false);
      }
    };

    if (currentUser) {
      fetchOrganizations();
    }
  }, [currentUser]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ search: '', role_id: '', organization_id: '', level_slug: '' });
    setPage(1);
  }, []);

  // Handle delete
  const handleDelete = useCallback((user) => {
    if (!canDeleteUser(currentUser, user)) {
      error('Akses Ditolak', 'Anda tidak memiliki izin untuk menghapus user ini');
      return;
    }

    warning(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      async () => {
        try {
          const result = await deleteUser(user.id);
          
          if (result?.success === false) {
            error('Gagal', result?.message || 'Gagal menghapus user');
            return;
          }
          
          success('Berhasil', result?.message || 'User berhasil dihapus');
        } catch (err) {
          console.error('Delete error:', err);
          error('Gagal', err?.response?.data?.message || err.message || 'Gagal menghapus user');
        }
      }
    );
  }, [currentUser, deleteUser, error, success, warning]);

  // Handle edit
  const handleEdit = useCallback((user) => {
    if (!canEditUser(currentUser, user)) {
      error('Akses Ditolak', 'Anda tidak memiliki izin untuk mengedit user ini');
      return;
    }
    setEditingUser(user);
    setShowForm(true);
  }, [currentUser, error]);

  // Handle create
  const handleCreate = useCallback(() => {
    if (!canManage) {
      error('Akses Ditolak', 'Anda tidak memiliki izin untuk menambah user');
      return;
    }
    setEditingUser(null);
    setShowForm(true);
  }, [canManage, error]);

  // Handle form submit - PERBAIKAN UTAMA
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let result;
      
      if (editingUser) {
        result = await update({ id: editingUser.id, data: formData });
      } else {
        result = await create(formData);
      }

      // Cek apakah ada error validasi dari backend
      if (result?.errors) {
        return result.errors;
      }

      // Cek apakah ada error message
      if (result?.success === false) {
        error('Gagal', result?.message || 'Terjadi kesalahan');
        return null;
      }

      // Jika berhasil (ada data atau success true)
      if (result?.data || result?.success === true) {
        const successMessage = editingUser 
          ? 'User berhasil diupdate' 
          : 'User berhasil dibuat';
        success('Berhasil', result?.message || successMessage);
        setShowForm(false);
        setEditingUser(null);
        return null;
      }

      // Fallback: jika tidak ada error dan tidak ada data, anggap sukses
      const successMessage = editingUser 
        ? 'User berhasil diupdate' 
        : 'User berhasil dibuat';
      success('Berhasil', successMessage);
      setShowForm(false);
      setEditingUser(null);
      return null;

    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
      error('Error', errorMessage);
      return null;
    }
  }, [create, update, editingUser, error, success]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingUser(null);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page]);

  // Memoize filtered organizations based on level
  const filteredOrganizations = useMemo(() => {
    if (!filters.level_slug) return organizations;
    return organizations.filter(org => {
      const levelSlug = typeof org.level === 'object' ? org.level?.slug : org.level;
      return levelSlug === filters.level_slug;
    });
  }, [organizations, filters.level_slug]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message || 'Silakan coba lagi'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="w-8 h-8 text-emerald-600" />
                Manajemen User
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data pengguna, role, dan akses sistem
              </p>
            </div>
            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah User
              </button>
            )}
          </div>

          {/* Filters */}
          <UserFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            roles={roles}
            organizations={organizations}
            filteredOrganizations={filteredOrganizations}
            isLoading={fetchingOrgs}
          />

          {/* Table */}
          <UserTable
            users={users}
            pagination={pagination}
            isLoading={isLoading}
            isFetching={isFetching}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUser={currentUser}
            canManage={canManage}
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserFormModal
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editingUser={editingUser}
          roles={roles}
          organizations={organizations}
          filteredOrganizations={filteredOrganizations}
          isSubmitting={isCreating || isUpdating}
          currentUser={currentUser}
        />
      )}
    </MainLayout>
  );
};

export default UsersPage;