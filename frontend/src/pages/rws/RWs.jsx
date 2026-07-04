// src/pages/rws/RWs.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useRWs } from "../../hooks/useRWs";
import { kelurahanService } from "../../services/kelurahan";
import { kecamatanService } from "../../services/kecamatan";
import { kotaService } from "../../services/kota";
import MainLayout from "../../components/layout/MainLayout";
import {
  Home,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";

const RWs = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  
  // State untuk filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  
  // State untuk dropdown
  const [kotas, setKotas] = useState([]);
  const [kecamatans, setKecamatans] = useState([]);
  const [allKelurahans, setAllKelurahans] = useState([]);
  const [kecamatansByKota, setKecamatansByKota] = useState([]);
  const [kelurahansByKecamatan, setKelurahansByKecamatan] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  
  // State untuk form
  const [showForm, setShowForm] = useState(false);
  const [editingRw, setEditingRw] = useState(null);
  const [formData, setFormData] = useState({
    kelurahan_id: "",
    nomor: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states untuk modal
  const [modalFilterKota, setModalFilterKota] = useState("");
  const [modalFilterKecamatan, setModalFilterKecamatan] = useState("");
  const [modalFilteredKelurahans, setModalFilteredKelurahans] = useState([]);
  
  const searchTimeoutRef = useRef(null);

  // React Query untuk RW
  const filters = {
    search: debouncedSearch || undefined,
    kelurahan_id: filterKelurahan || undefined,
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
    delete: deleteRw,
    isDeleting,
  } = useRWs(filters);

  const rws = response?.data || [];

  // Fetch Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      
      try {
        // Fetch kota
        const kotaResult = await kotaService.getAll({ per_page: 100 });
        if (kotaResult && kotaResult.success) {
          setKotas(kotaResult.data?.data || []);
        }

        // Fetch kecamatan
        const kecamatanResult = await kecamatanService.getAll({ per_page: 100 });
        if (kecamatanResult && kecamatanResult.success) {
          setKecamatans(kecamatanResult.data?.data || []);
        }

        // Fetch kelurahan
        const kelurahanResult = await kelurahanService.getAll({ per_page: 100 });
        if (kelurahanResult && kelurahanResult.success) {
          setAllKelurahans(kelurahanResult.data?.data || []);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      } finally {
        setLoadingMaster(false);
      }
    };
    
    fetchMasterData();
  }, []);

  // Filter kecamatan berdasarkan kota
  useEffect(() => {
    if (!filterKota) {
      setKecamatansByKota([]);
      setFilterKecamatan("");
      return;
    }

    const filtered = kecamatans.filter(
      (k) => k.kota_id === parseInt(filterKota)
    );
    setKecamatansByKota(filtered);
    setFilterKecamatan("");
  }, [filterKota, kecamatans]);

  // Filter kelurahan berdasarkan kecamatan
  useEffect(() => {
    if (!filterKecamatan) {
      setKelurahansByKecamatan([]);
      setFilterKelurahan("");
      return;
    }

    const filtered = allKelurahans.filter(
      (k) => k.kecamatan_id === parseInt(filterKecamatan)
    );
    setKelurahansByKecamatan(filtered);
    setFilterKelurahan("");
  }, [filterKecamatan, allKelurahans]);

  // Filter kelurahan untuk modal
  useEffect(() => {
    let filtered = [...allKelurahans];
    
    if (modalFilterKota) {
      filtered = filtered.filter(
        kel => kel.kecamatan?.kota_id === parseInt(modalFilterKota)
      );
    }
    
    if (modalFilterKecamatan) {
      filtered = filtered.filter(
        kel => kel.kecamatan_id === parseInt(modalFilterKecamatan)
      );
    }
    
    setModalFilteredKelurahans(filtered);
  }, [modalFilterKota, modalFilterKecamatan, allKelurahans]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
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
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterKota = (e) => {
    const value = e.target.value;
    setFilterKota(value);
  };

  const handleFilterKecamatan = (e) => {
    const value = e.target.value;
    setFilterKecamatan(value);
  };

  const handleFilterKelurahan = (e) => {
    const value = e.target.value;
    setFilterKelurahan(value);
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterKota("");
    setFilterKecamatan("");
    setFilterKelurahan("");
    setKecamatansByKota([]);
    setKelurahansByKecamatan([]);
  };

  const handleDelete = (rw) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus RW ${rw.nomor}?`,
      async () => {
        try {
          const result = await deleteRw(rw.id);
          
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus RW");
            return;
          }
          
          success("Berhasil", result?.message || "RW berhasil dihapus");
        } catch (err) {
          console.error('Delete error:', err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus RW");
        }
      }
    );
  };

  const openCreateForm = () => {
    setEditingRw(null);
    setFormData({ kelurahan_id: "", nomor: "", is_active: true });
    setFormErrors({});
    setModalFilterKota("");
    setModalFilterKecamatan("");
    setModalFilteredKelurahans(allKelurahans);
    setShowForm(true);
  };

  const openEditForm = (rw) => {
    setEditingRw(rw);
    setFormData({
      kelurahan_id: rw.kelurahan_id,
      nomor: rw.nomor,
      is_active: rw.is_active,
    });
    setFormErrors({});
    
    if (rw.kelurahan) {
      if (rw.kelurahan.kecamatan?.kota_id) {
        setModalFilterKota(rw.kelurahan.kecamatan.kota_id.toString());
      }
      if (rw.kelurahan.kecamatan_id) {
        setModalFilterKecamatan(rw.kelurahan.kecamatan_id.toString());
      }
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRw(null);
    setFormData({ kelurahan_id: "", nomor: "", is_active: true });
    setFormErrors({});
    setModalFilterKota("");
    setModalFilterKecamatan("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.kelurahan_id) {
      errors.kelurahan_id = "Kelurahan wajib dipilih";
    }
    if (!formData.nomor.trim()) {
      errors.nomor = "Nomor RW wajib diisi";
    } else if (formData.nomor.length > 10) {
      errors.nomor = "Nomor RW maksimal 10 karakter";
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
      if (editingRw) {
        result = await update({ id: editingRw.id, data: formData });
      } else {
        result = await create(formData);
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
        const successMessage = editingRw 
          ? "RW berhasil diupdate" 
          : "RW berhasil dibuat";
        success("Berhasil", result?.message || successMessage);
        closeForm();
      } else {
        const successMessage = editingRw 
          ? "RW berhasil diupdate" 
          : "RW berhasil dibuat";
        success("Berhasil", successMessage);
        closeForm();
      }
    } catch (err) {
      console.error('Submit error:', err);
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

  const hasActiveFilters = search || filterKota || filterKecamatan || filterKelurahan;

  // Loading state
  if (isLoading || loadingMaster) {
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
                <Home className="w-8 h-8 text-emerald-600" />
                Manajemen RW
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data Rukun Warga (RW) untuk keperluan organisasi
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah RW
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
                  placeholder="Cari nomor RW..."
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
                    onChange={handleFilterKota}
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
                    onChange={handleFilterKecamatan}
                    disabled={!filterKota}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Semua Kecamatan</option>
                    {kecamatansByKota.map((kecamatan) => (
                      <option key={kecamatan.id} value={kecamatan.id}>
                        {kecamatan.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    KELURAHAN
                  </label>
                  <select
                    value={filterKelurahan}
                    onChange={handleFilterKelurahan}
                    disabled={!filterKecamatan}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Semua Kelurahan</option>
                    {kelurahansByKecamatan.map((kelurahan) => (
                      <option key={kelurahan.id} value={kelurahan.id}>
                        {kelurahan.nama}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">RW</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelurahan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kecamatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kota</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rws.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Home className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data RW</p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah RW Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rws.map((rw, index) => (
                        <tr key={rw.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">
                                RW {rw.nomor}
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {rw.kelurahan?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {rw.kelurahan?.kecamatan?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {rw.kelurahan?.kecamatan?.kota?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(rw.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(rw)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(rw)}
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
                    {editingRw ? "Edit RW" : "Tambah RW Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingRw
                      ? "Ubah data RW"
                      : "Isi form berikut untuk menambahkan RW baru"}
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
                {/* Filter Kota */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Filter Kota
                  </label>
                  <select
                    value={modalFilterKota}
                    onChange={(e) => setModalFilterKota(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Semua Kota</option>
                    {kotas.map((kota) => (
                      <option key={kota.id} value={kota.id}>
                        {kota.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Kecamatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Filter Kecamatan
                  </label>
                  <select
                    value={modalFilterKecamatan}
                    onChange={(e) => setModalFilterKecamatan(e.target.value)}
                    disabled={!modalFilterKota}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Semua Kecamatan</option>
                    {kecamatans
                      .filter(kec => !modalFilterKota || kec.kota_id === parseInt(modalFilterKota))
                      .map((kecamatan) => (
                        <option key={kecamatan.id} value={kecamatan.id}>
                          {kecamatan.nama}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Pilih Kelurahan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kelurahan/Desa <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="kelurahan_id"
                    value={formData.kelurahan_id}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.kelurahan_id ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Pilih Kelurahan/Desa</option>
                    {modalFilteredKelurahans.map((kelurahan) => (
                      <option key={kelurahan.id} value={kelurahan.id}>
                        {kelurahan.nama}
                        {kelurahan.kecamatan && (
                          <span className="text-gray-400 text-xs ml-1">
                            ({kelurahan.kecamatan.nama})
                          </span>
                        )}
                      </option>
                    ))}
                  </select>
                  {formErrors.kelurahan_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.kelurahan_id}</p>
                  )}
                </div>

                {/* Nomor RW */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nomor RW <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nomor"
                    value={formData.nomor}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.nomor ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Contoh: 01, 02, 03"
                    autoFocus
                  />
                  {formErrors.nomor && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.nomor}</p>
                  )}
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
                        <li>• Gunakan filter kota dan kecamatan untuk mempermudah pencarian kelurahan</li>
                        <li>• Nomor RW harus unik dalam satu kelurahan</li>
                        <li>• RW yang sudah digunakan oleh organisasi Anak Ranting tidak dapat dihapus</li>
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

export default RWs;