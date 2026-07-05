// src/pages/organization-levels/OrganizationLevels.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useOrganizationLevels } from "../../hooks/useOrganizationLevels";
import MainLayout from "../../components/layout/MainLayout";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";

const OrganizationLevels = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    urutan: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);

  // ============================================
  // CHECK USER PERMISSIONS
  // ============================================
  
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  
  const isSuperAdmin = userRole === 'super-admin';
  const isAdminPC = userRole === 'admin' && userOrgLevel === 'pc';
  const canManage = isSuperAdmin || isAdminPC;

  // Filters
  const filters = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  };

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
    delete: deleteLevel,
    isDeleting,
  } = useOrganizationLevels(filters);

  const levels = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const handleSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleDelete = (level) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus data");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus level organisasi "${level.nama}"?`,
      async () => {
        try {
          const result = await deleteLevel(level.id);
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus level organisasi");
            return;
          }
          success("Berhasil", result?.message || "Level organisasi berhasil dihapus");
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus level organisasi");
        }
      }
    );
  };

  const openCreateForm = () => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah data");
      return;
    }
    setEditingLevel(null);
    setFormData({ nama: "", urutan: "" });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (level) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit data");
      return;
    }
    setEditingLevel(level);
    setFormData({
      nama: level.nama,
      urutan: level.urutan,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingLevel(null);
    setFormData({ nama: "", urutan: "" });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama level organisasi wajib diisi";
    }
    if (!formData.urutan) {
      errors.urutan = "Urutan wajib diisi";
    } else if (parseInt(formData.urutan) < 1) {
      errors.urutan = "Urutan minimal 1";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let result;
      const submitData = {
        nama: formData.nama,
        urutan: parseInt(formData.urutan),
      };

      if (editingLevel) {
        result = await update({ id: editingLevel.id, data: submitData });
      } else {
        result = await create(submitData);
      }

      if (result?.errors) {
        setFormErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
        setSubmitting(false);
        return;
      }

      if (result?.success === false) {
        error("Gagal", result?.message || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      if (result?.data || result?.success === true) {
        const successMessage = editingLevel ? "Level organisasi berhasil diupdate" : "Level organisasi berhasil dibuat";
        success("Berhasil", result?.message || successMessage);
        closeForm();
      } else {
        const successMessage = editingLevel ? "Level organisasi berhasil diupdate" : "Level organisasi berhasil dibuat";
        success("Berhasil", successMessage);
        closeForm();
      }
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Terjadi kesalahan";
      error("Error", errorMessage);
    }
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  // Loading state
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

  // Error state
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message || "Silakan coba lagi"}</p>
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
                <Layers className="w-8 h-8 text-emerald-600" />
                Manajemen Level Organisasi
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola level organisasi Nahdatul Ulama (PCNU, MWCNU, RANTING, dll)
              </p>
            </div>
            {canManage && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah Level
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Cari level organisasi..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
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

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Level</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Urutan</th>
                      {canManage && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {levels.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 5 : 4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Layers className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data level organisasi</p>
                            {canManage && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Level Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      levels.map((level, index) => (
                        <tr key={level.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{level.nama}</div>
                              {level.display_name && level.display_name !== level.nama && (
                                <div className="text-xs text-gray-400 mt-0.5">{level.display_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-mono text-sm">
                              {level.slug}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {level.urutan}
                            </span>
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditForm(level)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(level)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-4 h-4" />
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
              {pagination.last_page > 1 && !isFetching && levels.length > 0 && (
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
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
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
                      })}
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingLevel ? "Edit Level Organisasi" : "Tambah Level Organisasi Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingLevel ? "Ubah data level organisasi" : "Isi form berikut untuk menambahkan level organisasi baru"}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Nama Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Level <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.nama ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Contoh: PCNU, MWCNU, RANTING"
                      autoFocus
                    />
                  </div>
                  {formErrors.nama && <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>}
                </div>

                {/* Urutan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Urutan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="urutan"
                    value={formData.urutan}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.urutan ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Masukkan urutan (1, 2, 3, ...)"
                    min="1"
                  />
                  {formErrors.urutan && <p className="mt-1 text-xs text-red-500">{formErrors.urutan}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Urutan akan menentukan tampilan level organisasi (semakin kecil angka, semakin atas)
                  </p>
                </div>

                {/* Preview Slug */}
                {formData.nama && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview Slug</p>
                    <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full text-center block">
                      {formData.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                    </code>
                  </div>
                )}

                {/* Informasi */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Informasi:</p>
                      <ul className="space-y-1">
                        <li>• Slug akan dibuat otomatis dari nama level</li>
                        <li>• Nama level harus unik dalam sistem</li>
                        <li>• Urutan menentukan posisi tampilan level</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || isCreating || isUpdating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {submitting || isCreating || isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrganizationLevels;