// src/pages/certificate-categories/CertificateCategories.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useCertificateCategories } from "../../hooks/useCertificateCategories";
import MainLayout from "../../components/layout/MainLayout";
import {
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import CertificateCategoryModal from "./CertificateCategoryModal";

// ============================================
// SKELETON LOADING
// ============================================
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              {[...Array(5)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================
// STATUS OPTIONS
// ============================================
const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
];

// ============================================
// MAIN COMPONENT
// ============================================
const CertificateCategories = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // ============================================
  // STATE
  // ============================================
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [forceRefetch, setForceRefetch] = useState(0);

  const searchTimeoutRef = useRef(null);

  // ============================================
  // USER PERMISSIONS
  // ============================================
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdmin = userRole === "admin";
  const isPCLevel = userOrgLevel === "pc";

  const canManage = isSuperAdmin || (isAdmin && isPCLevel);
  const canCreate = canManage;

  // ============================================
  // FILTERS
  // ============================================
  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
      is_active: filterStatus || undefined,
      _t: forceRefetch,
    }),
    [page, perPage, debouncedSearch, filterStatus, forceRefetch]
  );

  // ============================================
  // REACT QUERY
  // ============================================
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteCategory,
    isDeleting,
    toggleStatus,
    isToggling,
  } = useCertificateCategories(filters);

  const categories = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // ============================================
  // EFFECTS
  // ============================================
  // PERBAIKAN: Refetch saat komponen mount
  useEffect(() => {
    refetch();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setForceRefetch(prev => prev + 1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPage(1);
    setForceRefetch(prev => prev + 1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterStatus("");
    setPage(1);
    setForceRefetch((prev) => prev + 1);
  };

  const handleDelete = (category) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus kategori sertifikat");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kategori "${category.nama}"?`,
      async () => {
        setActionLoading((prev) => ({ ...prev, [category.id]: true }));
        try {
          const result = await deleteCategory(category.id);
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus kategori");
            return;
          }
          success("Berhasil", result?.message || "Kategori berhasil dihapus");
          setTimeout(() => {
            setForceRefetch((prev) => prev + 1);
            refetch();
          }, 100);
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus kategori");
        } finally {
          setActionLoading((prev) => ({ ...prev, [category.id]: false }));
        }
      }
    );
  };

  const handleToggleStatus = async (category) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengubah status");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`toggle_${category.id}`]: true }));
    try {
      const result = await toggleStatus(category.id);
      if (result?.success === false) {
        error("Gagal", result?.message || "Gagal mengubah status");
        return;
      }
      success("Berhasil", result?.message || "Status berhasil diubah");
      setTimeout(() => {
        setForceRefetch((prev) => prev + 1);
        refetch();
      }, 100);
    } catch (err) {
      console.error("Toggle status error:", err);
      error("Gagal", err?.response?.data?.message || err.message || "Gagal mengubah status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`toggle_${category.id}`]: false }));
    }
  };

  const openCreateForm = () => {
    if (!canCreate) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah kategori");
      return;
    }
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditForm = (category) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit kategori");
      return;
    }
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
    setForceRefetch((prev) => prev + 1);
  };

  const handleModalSuccess = () => {
    setTimeout(() => {
      setForceRefetch((prev) => prev + 1);
      refetch();
    }, 300);
  };

  const handleManualRefetch = () => {
    setForceRefetch((prev) => prev + 1);
    refetch();
    success("Berhasil", "Data berhasil diperbarui");
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3 mr-1" />
        Tidak Aktif
      </span>
    );
  };

  const hasActiveFilters = search || filterStatus;

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (isLoading) {
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

  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message || "Silakan coba lagi"}</p>
            <button
              onClick={() => {
                setForceRefetch((prev) => prev + 1);
                refetch();
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Award className="w-8 h-8 text-emerald-600" />
                Kategori Sertifikat
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola kategori sertifikat untuk anggota
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefetch}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {canCreate && (
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Kategori
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Cari kategori berdasarkan nama atau slug..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Status</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Memperbarui data...</p>
                </div>
              </div>
            )}

            <div
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${
                isFetching ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        No
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Jumlah Sertifikat
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      {canManage && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Aksi
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManage ? 6 : 5}
                          className="px-6 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Award className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data kategori sertifikat</p>
                            {canCreate && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Kategori Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      categories.map((category, index) => (
                        <tr
                          key={category.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">
                              {category.nama}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                              {category.slug}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              {category.total_certificates || 0} Sertifikat
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(category.is_active)}
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleStatus(category)}
                                  disabled={actionLoading[`toggle_${category.id}`] || isToggling}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title={category.is_active ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  {actionLoading[`toggle_${category.id}`] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : category.is_active ? (
                                    <XCircle className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openEditForm(category)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(category)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                  disabled={actionLoading[category.id] || isDeleting}
                                >
                                  {actionLoading[category.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && !isFetching && categories.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(page - 1) * perPage + 1} -{" "}
                    {Math.min(page * perPage, pagination.total)} dari {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.last_page) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.last_page - 2) {
                            pageNum = pagination.last_page - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                                page === pageNum
                                  ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                  : "border border-gray-300 hover:bg-white"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pagination.last_page}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CertificateCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingCategory={editingCategory}
        onSuccess={handleModalSuccess}
      />
    </MainLayout>
  );
};

export default CertificateCategories;