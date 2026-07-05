// src/pages/roles/Roles.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useRoles } from "../../hooks/useRoles";
import MainLayout from "../../components/layout/MainLayout";
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

const Roles = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);

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
    delete: deleteRole,
    isDeleting,
  } = useRoles(filters);

  const roles = response?.data || [];
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

  const handleDelete = (role) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus role "${role.nama}"?`,
      async () => {
        try {
          const result = await deleteRole(role.id);

          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus role");
            return;
          }

          success("Berhasil", result?.message || "Role berhasil dihapus");
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus role");
        }
      }
    );
  };

  const openCreateForm = () => {
    setEditingRole(null);
    setFormData({ nama: "" });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (role) => {
    setEditingRole(role);
    setFormData({
      nama: role.nama,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRole(null);
    setFormData({ nama: "" });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama role wajib diisi";
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

      if (editingRole) {
        result = await update({ id: editingRole.id, data: formData });
      } else {
        result = await create(formData);
      }

      // Cek apakah ada error validasi
      if (result?.errors) {
        setFormErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
        setSubmitting(false);
        return;
      }

      // Cek apakah ada error message
      if (result?.success === false) {
        error("Gagal", result?.message || "Terjadi kesalahan");
        setSubmitting(false);
        return;
      }

      // Jika berhasil (ada data atau success true)
      if (result?.data || result?.success === true) {
        const successMessage = editingRole ? "Role berhasil diupdate" : "Role berhasil dibuat";
        success("Berhasil", result?.message || successMessage);
        closeForm();
      } else {
        // Fallback: jika tidak ada error dan tidak ada data, anggap sukses
        const successMessage = editingRole ? "Role berhasil diupdate" : "Role berhasil dibuat";
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

  const getRoleBadgeColor = (roleName) => {
    const roleLower = roleName?.toLowerCase();
    const colors = {
      "super-admin": "bg-gradient-to-r from-red-500 to-red-600 text-white",
      admin: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      operator: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      anggota: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    };
    return colors[roleLower] || "bg-gray-500 text-white";
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
                <Shield className="w-8 h-8 text-emerald-600" />
                Manajemen Role
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola role/hak akses pengguna dalam sistem
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Role
            </button>
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
                  placeholder="Cari role berdasarkan nama..."
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
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
                        Role
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Shield className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data role</p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Role Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      roles.map((role, index) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold ${getRoleBadgeColor(
                                  role.nama
                                )}`}
                              >
                                {role.nama}
                              </span>
                              <span className="text-xs text-gray-400 mt-1">ID: #{role.id}</span>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-mono text-sm">
                              {role.slug}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(role)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(role)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && !isFetching && roles.length > 0 && (
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
                    {editingRole ? "Edit Role" : "Tambah Role Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingRole ? "Ubah data role/hak akses" : "Isi form berikut untuk menambahkan role baru"}
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
                {/* Nama Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.nama ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Contoh: Super Admin, Admin, Operator, Anggota"
                      autoFocus
                    />
                  </div>
                  {formErrors.nama && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.nama}
                    </p>
                  )}
                </div>

                {/* Preview Slug */}
                {formData.nama && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Preview Slug
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full text-center">
                        {formData.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      </code>
                    </div>
                  </div>
                )}

                {/* Informasi */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Informasi:</p>
                      <ul className="space-y-1">
                        <li>• Slug akan dibuat otomatis dari nama role</li>
                        <li>• Nama role harus unik dalam sistem</li>
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

export default Roles;