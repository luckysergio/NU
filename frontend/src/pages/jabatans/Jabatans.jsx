// src/pages/jabatans/Jabatans.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useJabatans } from "../../hooks/useJabatans";
import { organizationLevelService } from "../../services/organizationLevel";
import MainLayout from "../../components/layout/MainLayout";
import {
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
  Layers,
  Check,
} from "lucide-react";

const Jabatans = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Level options
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    selectedLevels: [],
    is_active: true,
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

  // Level options for filter
  const levelOptions = [
    { slug: "pc", display: "PCNU", color: "purple" },
    { slug: "mwc", display: "MWCNU", color: "blue" },
    { slug: "ranting", display: "RANTING", color: "green" },
    { slug: "anak-ranting", display: "ANAK RANTING", color: "teal" },
    { slug: "lembaga", display: "LEMBAGA", color: "orange" },
    { slug: "banom", display: "BANOM", color: "pink" },
  ];

  // Filters
  const filters = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    level: filterLevel || undefined,
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
    delete: deleteJabatan,
    isDeleting,
  } = useJabatans(filters);

  const jabatans = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      setLoadingLevels(true);
      try {
        const result = await organizationLevelService.getAll({ per_page: 100 });
        if (result.success) {
          setLevels(result.data?.data || []);
        }
      } catch (err) {
        console.error("Error fetching levels:", err);
      } finally {
        setLoadingLevels(false);
      }
    };
    fetchLevels();
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

  const handleFilterLevelChange = (e) => {
    setFilterLevel(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterLevel("");
    setPage(1);
  };

  const handleDelete = (jabatan) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus data");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus jabatan "${jabatan.nama}"?`,
      async () => {
        try {
          const result = await deleteJabatan(jabatan.id);
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus jabatan");
            return;
          }
          success("Berhasil", result?.message || "Jabatan berhasil dihapus");
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus jabatan");
        }
      }
    );
  };

  const openCreateForm = () => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah data");
      return;
    }
    setEditingJabatan(null);
    setFormData({
      nama: "",
      deskripsi: "",
      selectedLevels: [],
      is_active: true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (jabatan) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit数据");
      return;
    }
    
    // Determine selected levels from existing data
    let selectedLevels = [];
    if (jabatan.level) {
      selectedLevels = [jabatan.level];
    } else if (jabatan.levels && Array.isArray(jabatan.levels)) {
      selectedLevels = jabatan.levels;
    }
    
    setEditingJabatan(jabatan);
    setFormData({
      nama: jabatan.nama,
      deskripsi: jabatan.deskripsi || "",
      selectedLevels: selectedLevels,
      is_active: jabatan.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingJabatan(null);
    setFormData({
      nama: "",
      deskripsi: "",
      selectedLevels: [],
      is_active: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama jabatan wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Process selected levels: if 1 level -> use 'level', if >1 -> use 'levels'
  const processLevels = (selectedLevels) => {
    if (!selectedLevels || selectedLevels.length === 0) {
      return { level: null, levels: null };
    }
    
    if (selectedLevels.length === 1) {
      return { level: selectedLevels[0], levels: null };
    }
    
    return { level: null, levels: selectedLevels };
  };

  // Toggle level selection
  const toggleLevel = (slug) => {
    setFormData(prev => {
      const current = prev.selectedLevels || [];
      if (current.includes(slug)) {
        return { ...prev, selectedLevels: current.filter(s => s !== slug) };
      } else {
        return { ...prev, selectedLevels: [...current, slug] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let result;
      
      // Process levels
      const { level, levels } = processLevels(formData.selectedLevels);
      
      const submitData = {
        nama: formData.nama,
        deskripsi: formData.deskripsi || null,
        level: level,
        levels: levels,
        is_active: formData.is_active,
      };

      if (editingJabatan) {
        result = await update({ id: editingJabatan.id, data: submitData });
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
        const successMessage = editingJabatan ? "Jabatan berhasil diupdate" : "Jabatan berhasil dibuat";
        success("Berhasil", result?.message || successMessage);
        closeForm();
      } else {
        const successMessage = editingJabatan ? "Jabatan berhasil diupdate" : "Jabatan berhasil dibuat";
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

  const getLevelBadge = (levelSlug) => {
    if (!levelSlug) return null;
    
    const level = levelOptions.find(l => l.slug === levelSlug);
    if (!level) return null;
    
    const colors = {
      pc: 'bg-purple-100 text-purple-700',
      mwc: 'bg-blue-100 text-blue-700',
      ranting: 'bg-green-100 text-green-700',
      'anak-ranting': 'bg-teal-100 text-teal-700',
      lembaga: 'bg-orange-100 text-orange-700',
      banom: 'bg-pink-100 text-pink-700',
    };
    
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[levelSlug] || 'bg-gray-100 text-gray-700'}`}>
        {level.display}
      </span>
    );
  };

  const getLevelsDisplay = (levels) => {
    if (!levels || !Array.isArray(levels) || levels.length === 0) {
      return <span className="text-xs text-gray-400">-</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {levels.map((slug) => {
          const level = levelOptions.find(l => l.slug === slug);
          return level ? getLevelBadge(slug) : null;
        })}
      </div>
    );
  };

  // Display level in table
  const renderLevelDisplay = (jabatan) => {
    if (jabatan.level) {
      return getLevelBadge(jabatan.level);
    }
    if (jabatan.levels && jabatan.levels.length > 0) {
      return getLevelsDisplay(jabatan.levels);
    }
    return <span className="text-xs text-gray-400">-</span>;
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  const hasActiveFilters = search || filterLevel;

  // Loading state
  if (isLoading || loadingLevels) {
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
                <Briefcase className="w-8 h-8 text-emerald-600" />
                Manajemen Jabatan
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data jabatan untuk keperluan organisasi
              </p>
            </div>
            {canManage && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah Jabatan
              </button>
            )}
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Cari jabatan berdasarkan nama..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    LEVEL ORGANISASI
                  </label>
                  <select
                    value={filterLevel}
                    onChange={handleFilterLevelChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Level</option>
                    {levelOptions.map((level) => (
                      <option key={level.slug} value={level.slug}>
                        {level.display}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      {canManage && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jabatans.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 7 : 6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Briefcase className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data jabatan</p>
                            {canManage && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Jabatan Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      jabatans.map((jabatan, index) => (
                        <tr key={jabatan.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{jabatan.nama}</div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-mono text-sm">
                              {jabatan.slug}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex flex-col items-center gap-1">
                              {renderLevelDisplay(jabatan)}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="text-sm text-gray-600 wrap-break-word max-w-xs">
                              {jabatan.deskripsi || "-"}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(jabatan.is_active)}
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditForm(jabatan)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(jabatan)}
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
              {pagination.last_page > 1 && !isFetching && jabatans.length > 0 && (
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
                    {editingJabatan ? "Edit Jabatan" : "Tambah Jabatan Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingJabatan ? "Ubah data jabatan" : "Isi form berikut untuk menambahkan jabatan baru"}
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
                {/* Nama Jabatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Jabatan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.nama ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Contoh: Ketua, Sekretaris, Bendahara"
                      autoFocus
                    />
                  </div>
                  {formErrors.nama && <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>}
                </div>

                {/* Level Organisasi - Checkbox List */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Level Organisasi
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      {levelOptions.map((level) => {
                        const isChecked = formData.selectedLevels?.includes(level.slug) || false;
                        return (
                          <label
                            key={level.slug}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isChecked
                                ? 'bg-emerald-50 border-2 border-emerald-400'
                                : 'bg-white border-2 border-gray-200 hover:border-emerald-300'
                            }`}
                            onClick={() => toggleLevel(level.slug)}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                {
                                  purple: 'bg-purple-500',
                                  blue: 'bg-blue-500',
                                  green: 'bg-green-500',
                                  teal: 'bg-teal-500',
                                  orange: 'bg-orange-500',
                                  pink: 'bg-pink-500'
                                }[level.color] || 'bg-gray-400'
                              }`} />
                              <span className="text-sm text-gray-700">{level.display}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">
                      💡 Pilih 1 level untuk level spesifik, atau pilih lebih dari 1 untuk multiple level
                    </span>
                  </div>
                  {formData.selectedLevels && formData.selectedLevels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-gray-500">Level dipilih:</span>
                      {formData.selectedLevels.map((slug) => {
                        const level = levelOptions.find(l => l.slug === slug);
                        return level ? (
                          <span key={slug} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            {level.display}
                          </span>
                        ) : null;
                      })}
                      <span className="text-xs text-gray-400 ml-1">
                        ({formData.selectedLevels.length} level)
                      </span>
                    </div>
                  )}
                  {formData.selectedLevels && formData.selectedLevels.length === 1 && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ Akan disimpan sebagai level tunggal
                    </p>
                  )}
                  {formData.selectedLevels && formData.selectedLevels.length > 1 && (
                    <p className="mt-1 text-xs text-blue-600">
                      ✓ Akan disimpan sebagai multiple level
                    </p>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Deskripsi singkat tentang jabatan ini"
                  />
                  <p className="mt-1 text-xs text-gray-500">Deskripsi opsional</p>
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
                    Jika tidak aktif, jabatan ini tidak akan muncul di pilihan
                  </p>
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

export default Jabatans;