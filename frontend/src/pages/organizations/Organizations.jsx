// src/pages/organizations/Organizations.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useOrganizations } from "../../hooks/useOrganizations";
import { organizationLevelService } from "../../services/organizationLevel";
import { organizationTypeService } from "../../services/organizationType";
import { kotaService } from "../../services/kota";
import { kecamatanService } from "../../services/kecamatan";
import { kelurahanService } from "../../services/kelurahan";
import { rwService } from "../../services/rw";
import { organizationService } from "../../services/organization";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Loader2,
} from "lucide-react";

const Organizations = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterRW, setFilterRW] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [levels, setLevels] = useState([]);
  const [parentOrganizations, setParentOrganizations] = useState([]);
  const [kotas, setKotas] = useState([]);
  const [kecamatans, setKecamatans] = useState([]);
  const [kelurahans, setKelurahans] = useState([]);
  const [rws, setRws] = useState([]);
  const [selectedLevelSlug, setSelectedLevelSlug] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [forceRefetch, setForceRefetch] = useState(0);

  const searchTimeoutRef = useRef(null);

  // ============================================
  // CHECK USER PERMISSIONS
  // ============================================
  
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  
  const isSuperAdmin = userRole === 'super-admin';
  const isAdminPC = userRole === 'admin' && userOrgLevel === 'pc';
  const canManage = isSuperAdmin || isAdminPC;
  const canCreate = isSuperAdmin || isAdminPC;

  const filters = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    organization_level_id: filterLevel || undefined,
    parent_id: filterParent || undefined,
    kota_id: filterKota || undefined,
    kecamatan_id: filterKecamatan || undefined,
    kelurahan_id: filterKelurahan || undefined,
    rw_id: filterRW || undefined,
    _t: forceRefetch,
  };

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteOrganization,
    isDeleting,
  } = useOrganizations(filters);

  const organizations = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  const levelOptions = [
    { id: 1, name: "PC", slug: "pc", display: "PCNU" },
    { id: 2, name: "MWC", slug: "mwc", display: "MWCNU" },
    { id: 3, name: "Ranting", slug: "ranting", display: "RANTING" },
    { id: 4, name: "Anak Ranting", slug: "anak-ranting", display: "ANAK RANTING" },
    { id: 5, name: "Lembaga", slug: "lembaga", display: "LEMBAGA" },
    { id: 6, name: "Banom", slug: "banom", display: "BANOM" },
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          organizationLevelService.getAll({ per_page: 100 }).then(res => {
            if (res.success) setLevels(res.data.data);
          }),
          kotaService.getAll({ per_page: 100 }).then(res => {
            if (res.success) setKotas(res.data.data);
          }),
        ]);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch parent organizations when Lembaga/Banom selected
  useEffect(() => {
    if (selectedLevelId && (selectedLevelSlug === "lembaga" || selectedLevelSlug === "banom")) {
      const fetchParents = async () => {
        try {
          const result = await organizationService.getAvailableParentsForLembagaBanom(
            parseInt(selectedLevelId)
          );
          if (result.success) {
            let parents = result.data || [];
            
            parents.sort((a, b) => {
              const aIsPC = a.level?.slug === 'pc';
              const bIsPC = b.level?.slug === 'pc';
              if (aIsPC && !bIsPC) return -1;
              if (!aIsPC && bIsPC) return 1;
              return a.nama?.localeCompare(b.nama || '') || 0;
            });
            
            setParentOrganizations(parents);
          } else {
            setParentOrganizations([]);
          }
        } catch (err) {
          console.error("Error fetching parent organizations:", err);
          setParentOrganizations([]);
        }
      };
      fetchParents();
      setFilterParent("");
    } else {
      setParentOrganizations([]);
      setFilterParent("");
    }
  }, [selectedLevelId, selectedLevelSlug]);

  // Fetch kecamatan when kota selected
  useEffect(() => {
    if (filterKota) {
      kecamatanService.getAll({ kota_id: filterKota, per_page: 100 }).then(res => {
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setKecamatans(data);
        }
      });
      setFilterKecamatan("");
      setFilterKelurahan("");
      setFilterRW("");
    }
  }, [filterKota]);

  // Fetch kelurahan when kecamatan selected
  useEffect(() => {
    if (filterKecamatan) {
      kelurahanService.getAll({ kecamatan_id: filterKecamatan, per_page: 100 }).then(res => {
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setKelurahans(data);
        }
      });
      setFilterKelurahan("");
      setFilterRW("");
    }
  }, [filterKecamatan]);

  // Fetch RW when kelurahan selected
  useEffect(() => {
    if (filterKelurahan) {
      rwService.getAll({ kelurahan_id: filterKelurahan }).then(res => {
        if (res.success) {
          let data = [];
          if (Array.isArray(res.data)) {
            data = res.data;
          } else if (res.data?.data) {
            data = Array.isArray(res.data.data) ? res.data.data : [];
          }
          setRws(data);
        } else {
          setRws([]);
        }
      });
      setFilterRW("");
    } else {
      setRws([]);
    }
  }, [filterKelurahan]);

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

  const handleFilterLevel = (levelId) => {
    setFilterLevel(levelId);
    setFilterParent("");
    setFilterKota("");
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterRW("");
    setPage(1);

    const selected = levelOptions.find(l => l.id.toString() === levelId);
    setSelectedLevelSlug(selected?.slug || "");
    setSelectedLevelId(levelId || "");
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterLevel("");
    setFilterParent("");
    setFilterKota("");
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterRW("");
    setSelectedLevelSlug("");
    setSelectedLevelId("");
    setParentOrganizations([]);
    setRws([]);
    setPage(1);
    setForceRefetch(prev => prev + 1);
  };

  const handleDelete = (org) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus organisasi");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus organisasi "${org.nama}"?`,
      async () => {
        setActionLoading(prev => ({ ...prev, [org.id]: true }));
        try {
          const result = await deleteOrganization(org.id);
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus organisasi");
            return;
          }
          success("Berhasil", result?.message || "Organisasi berhasil dihapus");
          setTimeout(() => {
            setForceRefetch(prev => prev + 1);
            refetch();
          }, 100);
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus organisasi");
        } finally {
          setActionLoading(prev => ({ ...prev, [org.id]: false }));
        }
      }
    );
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

  const getLevelBadge = (levelName) => {
    const colors = {
      PC: "bg-purple-100 text-purple-700",
      MWC: "bg-blue-100 text-blue-700",
      Ranting: "bg-green-100 text-green-700",
      "Anak Ranting": "bg-teal-100 text-teal-700",
      Lembaga: "bg-orange-100 text-orange-700",
      Banom: "bg-pink-100 text-pink-700",
    };
    const displayName = levelName === "PC" ? "PCNU" : levelName === "Anak Ranting" ? "ANAK RANTING" : levelName;
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors[levelName] || "bg-gray-100 text-gray-700"}`}>
        {displayName || "-"}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
    setForceRefetch(prev => prev + 1);
  };

  const handleManualRefetch = () => {
    setForceRefetch(prev => prev + 1);
    refetch();
    success("Berhasil", "Data berhasil diperbarui");
  };

  const showParentFilter = selectedLevelSlug === "lembaga" || selectedLevelSlug === "banom";
  const showKotaFilter = selectedLevelSlug === "mwc" || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting";
  const showKecamatanFilter = (selectedLevelSlug === "mwc" && filterKota) || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting";
  const showKelurahanFilter = (selectedLevelSlug === "ranting" && filterKecamatan) || selectedLevelSlug === "anak-ranting";
  const showRWFilter = selectedLevelSlug === "anak-ranting" && filterKelurahan;

  // Loading state
  if (initialLoading || isLoading) {
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
              onClick={() => {
                setForceRefetch(prev => prev + 1);
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
                Manajemen Organisasi
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data organisasi Nahdatul Ulama
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefetch}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {canCreate && (
                <button
                  onClick={() => navigate("/organizations/create")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Organisasi
                </button>
              )}
            </div>
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
                  placeholder="Cari organisasi berdasarkan nama..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    LEVEL ORGANISASI
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => handleFilterLevel(e.target.value)}
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

                {showParentFilter && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      ORGANISASI INDUK
                    </label>
                    <select
                      value={filterParent}
                      onChange={(e) => setFilterParent(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Induk</option>
                      {parentOrganizations.map((org) => {
                        let label = org._display_name || org.nama;
                        if (!org._display_name && org.level?.nama) {
                          label += ` (${org.level.nama === "PC" ? "PCNU" : org.level.nama})`;
                        }
                        return (
                          <option key={org.id} value={org.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {showKotaFilter && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      KOTA/KABUPATEN
                    </label>
                    <select
                      value={filterKota}
                      onChange={(e) => setFilterKota(e.target.value)}
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
                )}

                {showKecamatanFilter && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      KECAMATAN
                    </label>
                    <select
                      value={filterKecamatan}
                      onChange={(e) => setFilterKecamatan(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Kecamatan</option>
                      {kecamatans.map((kec) => (
                        <option key={kec.id} value={kec.id}>
                          {kec.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {showKelurahanFilter && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      KELURAHAN/DESA
                    </label>
                    <select
                      value={filterKelurahan}
                      onChange={(e) => setFilterKelurahan(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Kelurahan</option>
                      {kelurahans.map((kel) => (
                        <option key={kel.id} value={kel.id}>
                          {kel.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showRWFilter && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        RW
                      </label>
                      <select
                        value={filterRW}
                        onChange={(e) => setFilterRW(e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                      >
                        <option value="">Semua RW</option>
                        {Array.isArray(rws) && rws.map((rw) => (
                          <option key={rw.id} value={rw.id}>
                            RW {rw.nomor}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {(filterLevel || filterParent || filterKota || filterKecamatan || filterKelurahan || filterRW || search) && (
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

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Organisasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      {canManage && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {organizations.length === 0 ? (
                      <tr>
                        <td colSpan={canManage ? 7 : 6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data organisasi</p>
                            {canCreate && (
                              <button
                                onClick={() => navigate("/organizations/create")}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Organisasi Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      organizations.map((org, index) => (
                        <tr key={org.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{org.nama}</div>
                              <div className="text-xs text-gray-400">{org.slug}</div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getLevelBadge(org.level?.nama)}
                          </td>
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {org.kota?.nama || org.kecamatan?.nama || org.kelurahan?.nama || "-"}
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(org.is_active)}
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => navigate(`/organizations/${org.id}`)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/organizations/${org.id}/edit`)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(org)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                  disabled={actionLoading[org.id] || isDeleting}
                                >
                                  {actionLoading[org.id] ? (
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
              {pagination.last_page > 1 && !isFetching && organizations.length > 0 && (
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
    </MainLayout>
  );
};

export default Organizations;