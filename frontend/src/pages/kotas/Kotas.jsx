import React, { useState, useMemo, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useKotas } from "../../hooks/useKotas";
import MainLayout from "../../components/layout/MainLayout";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import KotaModal from "./KotaModal";

const Kotas = () => {
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // ✅ Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKota, setEditingKota] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const userRole = currentUser?.role?.slug;
  const userOrgLevel =
    currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdminPC = userRole === "admin" && userOrgLevel === "pc";
  const canManage = isSuperAdmin || isAdminPC;

  // ✅ Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ Memoize filters
  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
    }),
    [page, perPage, debouncedSearch],
  );

  // ✅ Gunakan hook dengan optimistic update
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteKota,
    isDeleting,
  } = useKotas(filters);

  const kotaList = response?.data || [];
  const pagination = response || {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleDelete = (kota) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus data");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kota "${kota.nama}"?`,
      async () => {
        setActionLoading((prev) => ({ ...prev, [kota.id]: true }));
        try {
          await deleteKota(kota.id);
          success("Berhasil", "Kota berhasil dihapus");

          if (kotaList.length === 1 && page > 1) {
            setPage(page - 1);
          }
        } catch (err) {
          console.error("Delete error:", err);
          error(
            "Gagal",
            err?.response?.data?.message ||
              err.message ||
              "Gagal menghapus kota",
          );
        } finally {
          setActionLoading((prev) => ({ ...prev, [kota.id]: false }));
        }
      },
    );
  };

  const openCreateForm = () => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah data");
      return;
    }
    setEditingKota(null);
    setModalOpen(true);
  };

  const openEditForm = (kota) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit data");
      return;
    }
    setEditingKota(kota);
    setModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  const handleModalSuccess = () => {
    setPage(1);
  };

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

  const hasActiveFilters = debouncedSearch;

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
            <p className="text-sm text-gray-500 mt-1">
              {queryError?.message || "Silakan coba lagi"}
            </p>
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
                <MapPin className="w-8 h-8 text-emerald-600" />
                Manajemen Kota
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data kota/kabupaten untuk keperluan alamat organisasi
              </p>
            </div>
            {canManage && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah Kota
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-5 sm:p-6">
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                CARI KOTA
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama atau kode kota..."
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
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
                        Kode
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Kota
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Jumlah Kecamatan
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
                    {kotaList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManage ? 6 : 5}
                          className="px-6 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <MapPin className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data kota</p>
                            {hasActiveFilters && (
                              <button
                                onClick={handleReset}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                              >
                                Reset Filter
                              </button>
                            )}
                            {canManage && !hasActiveFilters && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Kota Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      kotaList.map((kota, index) => (
                        <tr
                          key={kota.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-mono text-sm font-semibold">
                              {kota.kode}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">
                              {kota.nama}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              {kota.kecamatans_count || 0} Kecamatan
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(kota.is_active)}
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditForm(kota)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(kota)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                  disabled={
                                    actionLoading[kota.id] || isDeleting
                                  }
                                >
                                  {actionLoading[kota.id] ? (
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

              {pagination.last_page > 1 &&
                !isFetching &&
                kotaList.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-sm text-gray-500 order-2 sm:order-1">
                      Menampilkan {(page - 1) * perPage + 1} -{" "}
                      {Math.min(page * perPage, pagination.total)} dari{" "}
                      {pagination.total} data
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
                          },
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

      <KotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingKota={editingKota}
        onSuccess={handleModalSuccess}
        canManage={canManage}
      />
    </MainLayout>
  );
};

export default Kotas;