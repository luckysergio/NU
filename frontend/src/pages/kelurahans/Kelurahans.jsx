import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { kelurahanService } from "../../services/kelurahan";
import { kotaService } from "../../services/kota";
import { kecamatanService } from "../../services/kecamatan";
import MainLayout from "../../components/layout/MainLayout";
import {
  MapPinned,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  X,
  Loader2,
} from "lucide-react";

const Kelurahans = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const [kelurahans, setKelurahans] = useState([]);
  const [kotas, setKotas] = useState([]);
  const [allKecamatans, setAllKecamatans] = useState([]);
  const [kecamatansByKota, setKecamatansByKota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingKelurahan, setEditingKelurahan] = useState(null);
  const [formData, setFormData] = useState({
    kecamatan_id: "",
    nama: "",
    kode: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formKecamatans, setFormKecamatans] = useState([]);
  
  const searchTimeoutRef = React.useRef(null);

  const fetchKelurahans = async (page = 1) => {
    setLoading(true);
    const params = {
      page,
      per_page: pagination.per_page,
    };
    
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterKota) params.kota_id = filterKota;
    if (filterKecamatan) params.kecamatan_id = filterKecamatan;

    const result = await kelurahanService.getAll(params);

    if (result.success) {
      setKelurahans(result.data.data);
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
  };

  const fetchKotas = async () => {
    const result = await kotaService.getAll({ per_page: 100 });
    if (result.success && result.data?.data) {
      setKotas(Array.isArray(result.data.data) ? result.data.data : []);
    } else {
      setKotas([]);
    }
  };

  const fetchAllKecamatans = async () => {
    const result = await kecamatanService.getAll({ per_page: 1000 });
    if (result.success && result.data?.data) {
      setAllKecamatans(Array.isArray(result.data.data) ? result.data.data : []);
    } else {
      setAllKecamatans([]);
    }
  };

  const fetchKecamatansByKotaId = async (kotaId) => {
    if (!kotaId) {
      setKecamatansByKota([]);
      return;
    }
    const result = await kecamatanService.getByKota(kotaId);
    if (result.success && result.data) {
      let data = result.data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          setKecamatansByKota(data);
        } else if (data.data && Array.isArray(data.data)) {
          setKecamatansByKota(data.data);
        } else {
          setKecamatansByKota([]);
        }
      } else {
        setKecamatansByKota([]);
      }
    } else {
      setKecamatansByKota([]);
    }
  };

  const fetchFormKecamatans = async () => {
    const result = await kecamatanService.getAll({ per_page: 1000 });
    if (result.success && result.data?.data) {
      setFormKecamatans(Array.isArray(result.data.data) ? result.data.data : []);
    } else {
      setFormKecamatans([]);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, current_page: 1 }));
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Fetch when filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchKelurahans(1);
    }
  }, [debouncedSearch, filterKota, filterKecamatan, initialLoading]);

  // Update kecamatan dropdown ketika filter kota berubah
  useEffect(() => {
    if (filterKota) {
      fetchKecamatansByKotaId(filterKota);
      setFilterKecamatan("");
    } else {
      setKecamatansByKota([]);
      setFilterKecamatan("");
    }
  }, [filterKota]);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchKotas(),
        fetchAllKecamatans(),
        fetchFormKecamatans(),
      ]);
      await fetchKelurahans(1);
      setInitialLoading(false);
    };
    loadData();
  }, []);

  const handleSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterKotaChange = (e) => {
    const value = e.target.value;
    setFilterKota(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterKecamatanChange = (e) => {
    const value = e.target.value;
    setFilterKecamatan(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterKota("");
    setFilterKecamatan("");
    setKecamatansByKota([]);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleDelete = (kelurahan) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kelurahan "${kelurahan.nama}"?`,
      async () => {
        const result = await kelurahanService.delete(kelurahan.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchKelurahans(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const openCreateForm = () => {
    setEditingKelurahan(null);
    setFormData({ kecamatan_id: "", nama: "", kode: "", is_active: true });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (kelurahan) => {
    setEditingKelurahan(kelurahan);
    setFormData({
      kecamatan_id: kelurahan.kecamatan_id,
      nama: kelurahan.nama,
      kode: kelurahan.kode || "",
      is_active: kelurahan.is_active,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKelurahan(null);
    setFormData({ kecamatan_id: "", nama: "", kode: "", is_active: true });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kecamatan_id) {
      errors.kecamatan_id = "Kecamatan wajib dipilih";
    }
    if (!formData.nama.trim()) {
      errors.nama = "Nama kelurahan wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let result;

    if (editingKelurahan) {
      result = await kelurahanService.update(editingKelurahan.id, formData);
    } else {
      result = await kelurahanService.create(formData);
    }

    if (result.success) {
      success("Berhasil", result.message);
      closeForm();
      fetchKelurahans(pagination.current_page);
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

  const getKecamatanName = (id) => {
    const kecamatan = allKecamatans.find((k) => k.id == id);
    return kecamatan?.nama || "-";
  };

  const hasActiveFilters = search || filterKota || filterKecamatan;

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchKelurahans(newPage);
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
                <MapPinned className="w-8 h-8 text-emerald-600" />
                Manajemen Kelurahan
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data kelurahan/desa untuk keperluan alamat organisasi
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelurahan
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
                  placeholder="Cari kelurahan..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    KECAMATAN
                  </label>
                  <select
                    value={filterKecamatan}
                    onChange={handleFilterKecamatanChange}
                    disabled={!filterKota}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Semua Kecamatan</option>
                    {Array.isArray(kecamatansByKota) && kecamatansByKota.map((kecamatan) => (
                      <option key={kecamatan.id} value={kecamatan.id}>
                        {kecamatan.nama}
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
                  <p className="text-gray-500">Memuat数据...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Kelurahan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kecamatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kota/Kabupaten</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kelurahans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <MapPinned className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data kelurahan</p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Kelurahan Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      kelurahans.map((kelurahan, index) => (
                        <tr key={kelurahan.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="inline-flex px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-mono text-sm font-semibold">
                              {kelurahan.kode || "-"}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{kelurahan.nama}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                ID: #{kelurahan.id}
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {kelurahan.kecamatan?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {kelurahan.kecamatan?.kota?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(kelurahan.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(kelurahan)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(kelurahan)}
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
              {pagination.last_page > 1 && !loading && kelurahans.length > 0 && (
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
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingKelurahan ? "Edit Kelurahan" : "Tambah Kelurahan Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingKelurahan
                      ? "Ubah data kelurahan/desa"
                      : "Isi form berikut untuk menambahkan kelurahan/desa baru"}
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

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Pilih Kecamatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="kecamatan_id"
                    value={formData.kecamatan_id}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.kecamatan_id ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {formKecamatans.map((kecamatan) => (
                      <option key={kecamatan.id} value={kecamatan.id}>
                        {kecamatan.nama} ({kecamatan.kota?.nama || "-"})
                      </option>
                    ))}
                  </select>
                  {formErrors.kecamatan_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.kecamatan_id}</p>
                  )}
                </div>

                {/* Nama Kelurahan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Kelurahan <span className="text-red-500">*</span>
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
                  {formErrors.nama && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
                  )}
                </div>

                {/* Kode Kelurahan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kode Kelurahan
                  </label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 3671011001"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Kode unik untuk kelurahan/desa (opsional)
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
                    Jika tidak aktif, kelurahan ini tidak akan muncul di pilihan
                  </p>
                </div>

                {/* Preview Data */}
                {formData.nama && formData.kecamatan_id && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview:</p>
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-700">{formData.nama}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        (Kec. {getKecamatanName(formData.kecamatan_id)})
                      </span>
                    </div>
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
                        <li>• Nama kelurahan harus unik dalam satu kecamatan</li>
                        <li>• Kelurahan yang sudah digunakan oleh organisasi Ranting tidak dapat dihapus</li>
                        <li>• Kode kelurahan bersifat opsional</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </div>

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

export default Kelurahans;