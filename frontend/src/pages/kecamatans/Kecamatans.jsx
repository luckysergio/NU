// src/pages/kecamatans/Kecamatans.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useKecamatans } from "../../hooks/useKecamatans";
import { kotaService } from "../../services/kota";
import MainLayout from "../../components/layout/MainLayout";
import {
  Map,
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

const Kecamatans = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [kotas, setKotas] = useState([]);
  const [loadingKotas, setLoadingKotas] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingKecamatan, setEditingKecamatan] = useState(null);
  const [formData, setFormData] = useState({
    kota_id: "",
    nama: "",
    kode: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);

  const filters = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    kota_id: filterKota || undefined,
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
    delete: deleteKecamatan,
    isDeleting,
  } = useKecamatans(filters);

  const kecamatans = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // Fetch Kota - gunakan per_page maksimal 100
  useEffect(() => {
    const fetchKotas = async () => {
      setLoadingKotas(true);
      try {
        const result = await kotaService.getAll({ per_page: 100, page: 1 });
        if (result.success) {
          setKotas(result.data?.data || []);
        } else {
          console.error("Failed to fetch kotas:", result?.message);
          setKotas([]);
        }
      } catch (err) {
        console.error("Error fetching kotas:", err);
        setKotas([]);
      } finally {
        setLoadingKotas(false);
      }
    };
    fetchKotas();
  }, []);

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

  const handleFilterKotaChange = (e) => {
    setFilterKota(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterKota("");
    setPage(1);
  };

  const handleDelete = (kecamatan) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kecamatan "${kecamatan.nama}"?`,
      async () => {
        try {
          const result = await deleteKecamatan(kecamatan.id);

          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus kecamatan");
            return;
          }

          success("Berhasil", result?.message || "Kecamatan berhasil dihapus");
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus kecamatan");
        }
      }
    );
  };

  const openCreateForm = () => {
    setEditingKecamatan(null);
    setFormData({ kota_id: "", nama: "", kode: "", is_active: true });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (kecamatan) => {
    setEditingKecamatan(kecamatan);
    setFormData({
      kota_id: kecamatan.kota_id,
      nama: kecamatan.nama,
      kode: kecamatan.kode || "",
      is_active: kecamatan.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKecamatan(null);
    setFormData({ kota_id: "", nama: "", kode: "", is_active: true });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kota_id) {
      errors.kota_id = "Kota/Kabupaten wajib dipilih";
    }
    if (!formData.nama.trim()) {
      errors.nama = "Nama kecamatan wajib diisi";
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
      if (editingKecamatan) {
        result = await update({ id: editingKecamatan.id, data: formData });
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
        const successMessage = editingKecamatan ? "Kecamatan berhasil diupdate" : "Kecamatan berhasil dibuat";
        success("Berhasil", result?.message || successMessage);
        closeForm();
      } else {
        // Fallback: jika tidak ada error dan tidak ada data, anggap sukses
        const successMessage = editingKecamatan ? "Kecamatan berhasil diupdate" : "Kecamatan berhasil dibuat";
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Tidak Aktif
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  // Loading state
  if (isLoading || loadingKotas) {
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
                <Map className="w-8 h-8 text-emerald-600" />
                Manajemen Kecamatan
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data kecamatan untuk keperluan alamat organisasi
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Kecamatan
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    CARI
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      placeholder="Cari kecamatan..."
                      className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    KOTA/KABUPATEN
                  </label>
                  <select
                    value={filterKota}
                    onChange={handleFilterKotaChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Kota</option>
                    {kotas.map((kota) => (
                      <option key={kota.id} value={kota.id}>
                        {kota.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {(search || filterKota) && (
                  <div className="flex items-end">
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Filter
                    </button>
                  </div>
                )}
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
                        Kode
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Kecamatan
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kota/Kabupaten
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Jumlah Kelurahan
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kecamatans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Map className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data kecamatan</p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Kecamatan Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      kecamatans.map((kecamatan, index) => (
                        <tr key={kecamatan.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-mono text-sm font-semibold">
                              {kecamatan.kode || "-"}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">{kecamatan.nama}</div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{kecamatan.kota?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              {kecamatan.kelurahans_count || 0} Kelurahan
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(kecamatan.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(kecamatan)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(kecamatan)}
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
              {pagination.last_page > 1 && !isFetching && kecamatans.length > 0 && (
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
                    {editingKecamatan ? "Edit Kecamatan" : "Tambah Kecamatan Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingKecamatan ? "Ubah data kecamatan" : "Isi form berikut untuk menambahkan kecamatan baru"}
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
                {/* Pilih Kota */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kota/Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="kota_id"
                    value={formData.kota_id}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.kota_id ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Pilih Kota/Kabupaten</option>
                    {kotas.map((kota) => (
                      <option key={kota.id} value={kota.id}>
                        {kota.nama}
                      </option>
                    ))}
                  </select>
                  {formErrors.kota_id && <p className="mt-1 text-xs text-red-500">{formErrors.kota_id}</p>}
                </div>

                {/* Nama Kecamatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.nama ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Contoh: Cipondoh, Ciledug, dll"
                    autoFocus
                  />
                  {formErrors.nama && <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>}
                </div>

                {/* Kode Kecamatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kode Kecamatan
                  </label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 367101, 320101"
                  />
                  <p className="mt-1 text-xs text-gray-500">Kode unik untuk kecamatan (opsional)</p>
                </div>

                {/* Status Aktif */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Jika tidak aktif, kecamatan ini tidak akan muncul di pilihan
                  </p>
                </div>

                {/* Informasi */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700">
                      <p className="font-semibold mb-1">Informasi:</p>
                      <ul className="space-y-1">
                        <li>• Nama kecamatan harus unik dalam satu kota</li>
                        <li>• Kecamatan yang sudah digunakan oleh organisasi MWC tidak dapat dihapus</li>
                        <li>• Kecamatan yang sudah memiliki kelurahan tidak dapat dihapus</li>
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

export default Kecamatans;