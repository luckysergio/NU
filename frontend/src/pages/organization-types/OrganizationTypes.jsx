import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { organizationTypeService } from "../../services/organizationType";
import { organizationLevelService } from "../../services/organizationLevel";
import MainLayout from "../../components/layout/MainLayout";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Filter,
  X,
  Loader2,
} from "lucide-react";

const OrganizationTypes = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const [types, setTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    organization_level_id: "",
    nama: "",
    deskripsi: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const searchTimeoutRef = React.useRef(null);

  // Hanya level Lembaga (id: 4) dan Banom (id: 5)
  const levelOptions = [
    { id: 5, name: "LEMBAGA", slug: "lembaga", display: "LEMBAGA" },
    { id: 6, name: "BANOM", slug: "banom", display: "BANOM" },
  ];

  const fetchTypes = useCallback(async (page = 1) => {
    setLoading(true);
    const params = {
      page,
      per_page: pagination.per_page,
    };
    
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (filterLevel) {
      params.organization_level_id = parseInt(filterLevel);
    }

    const result = await organizationTypeService.getAll(params);

    if (result.success) {
      setTypes(result.data.data);
      setPagination({
        current_page: result.data.current_page,
        last_page: result.data.last_page,
        per_page: result.data.per_page,
        total: result.data.total,
      });
    } else {
      error("Gagal", result.message);
    }
    setLoading(false);
  }, [pagination.per_page, error, search, filterLevel]);

  const fetchLevels = async () => {
    const result = await organizationLevelService.getAll({ per_page: 100 });
    if (result.success) {
      // Filter hanya level Lembaga dan Banom
      const filteredLevels = result.data.data.filter(level => 
        level.slug === "lembaga" || level.slug === "banom"
      );
      setLevels(filteredLevels);
    }
    setInitialLoading(false);
  };

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchTypes(1);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Handle filter level change - langsung fetch tanpa delay
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchTypes(1);
  }, [filterLevel]);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      await fetchLevels();
      await fetchTypes(1);
    };
    loadData();
  }, []);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchTypes(1);
    }
  };

  const handleFilterLevelChange = (e) => {
    const value = e.target.value;
    setFilterLevel(value);
  };

  const handleReset = () => {
    setSearch("");
    setFilterLevel("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchTypes(1);
  };

  const handleDelete = (type) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus tipe organisasi "${type.nama}"?`,
      async () => {
        const result = await organizationTypeService.delete(type.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchTypes(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const openCreateForm = () => {
    setEditingType(null);
    setFormData({
      organization_level_id: "",
      nama: "",
      deskripsi: "",
      is_active: true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (type) => {
    setEditingType(type);
    setFormData({
      organization_level_id: type.organization_level_id?.toString() || "",
      nama: type.nama || "",
      deskripsi: type.deskripsi || "",
      is_active: type.is_active ?? true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData({
      organization_level_id: "",
      nama: "",
      deskripsi: "",
      is_active: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.organization_level_id) {
      errors.organization_level_id = "Level organisasi wajib dipilih";
    }
    if (!formData.nama.trim()) {
      errors.nama = "Nama tipe organisasi wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let result;

    const submitData = {
      organization_level_id: parseInt(formData.organization_level_id),
      nama: formData.nama,
      deskripsi: formData.deskripsi || null,
      is_active: formData.is_active,
    };

    if (editingType) {
      result = await organizationTypeService.update(editingType.id, submitData);
    } else {
      result = await organizationTypeService.create(submitData);
    }

    if (result.success) {
      success("Berhasil", result.message);
      closeForm();
      fetchTypes(pagination.current_page);
    } else {
      if (result.errors) {
        setFormErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
      } else {
        error("Gagal", result.message);
      }
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
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Tidak Aktif
      </span>
    );
  };

  const getLevelName = (id) => {
    const level = levelOptions.find((l) => l.id === id);
    return level?.display || "-";
  };

  const getLevelBadgeColor = (levelName) => {
    if (levelName === "LEMBAGA") return "bg-orange-100 text-orange-700";
    if (levelName === "BANOM") return "bg-pink-100 text-pink-700";
    return "bg-gray-100 text-gray-700";
  };

  const hasActiveFilters = search || filterLevel;

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchTypes(newPage);
  };

  if (initialLoading) {
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Tag className="w-8 h-8 text-emerald-600" />
                Manajemen Tipe Organisasi
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola tipe organisasi untuk Lembaga dan Banom
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Tipe
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
                  placeholder="Cari tipe organisasi..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <option key={level.id} value={level.id}>
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
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Tipe</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {types.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Tag className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data tipe organisasi</p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Tipe Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      types.map((type, index) => (
                        <tr key={type.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{type.nama}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                ID: #{type.id}
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-mono text-sm">
                              {type.slug}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(getLevelName(type.organization_level_id))}`}>
                              {getLevelName(type.organization_level_id)}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {type.deskripsi || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(type.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(type)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(type)}
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
              {pagination.last_page > 1 && !loading && types.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
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
                    {editingType ? "Edit Tipe Organisasi" : "Tambah Tipe Organisasi Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingType
                      ? "Ubah data tipe organisasi"
                      : "Isi form berikut untuk menambahkan tipe organisasi baru"}
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
                {/* Pilih Level Organisasi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Level Organisasi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="organization_level_id"
                      value={formData.organization_level_id}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.organization_level_id ? "border-red-500" : "border-gray-200"
                      }`}
                    >
                      <option value="">Pilih Level Organisasi</option>
                      {levelOptions.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.display}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formErrors.organization_level_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.organization_level_id}</p>
                  )}
                </div>

                {/* Nama Tipe */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Tipe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.nama ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Contoh: Lembaga Pendidikan, Banom, Lembaga Sosial"
                      autoFocus
                    />
                  </div>
                  {formErrors.nama && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
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
                    placeholder="Deskripsi singkat tentang tipe organisasi ini"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Deskripsi opsional, menjelaskan tentang tipe organisasi ini
                  </p>
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
                    Jika tidak aktif, tipe ini tidak akan muncul di pilihan saat membuat organisasi
                  </p>
                </div>

                {/* Preview Slug */}
                {formData.nama && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Preview Slug
                    </p>
                    <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full text-center block">
                      {formData.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                    </code>
                  </div>
                )}
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
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {submitting ? (
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

export default OrganizationTypes;