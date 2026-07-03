import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { usePermissions } from "../../hooks/usePermissions";
import { useAnggota } from "../../hooks/useAnggota";
import { organizationService } from "../../services/organization";
import { jabatanService } from "../../services/jabatan";
import { organizationTypeService } from "../../services/organizationType";
import MainLayout from "../../components/layout/MainLayout";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Wifi,
  WifiOff,
  CheckCircle,
  Loader2,
} from "lucide-react";
import AnggotaModal from "./AnggotaModal";
import AnggotaDetail from "./AnggotaDetail";

const Anggotas = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const permissions = usePermissions();

  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [filterLevel, setFilterLevel] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterOrganizationType, setFilterOrganizationType] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState(null);

  const filterTimeoutRef = useRef(null);

  const user = permissions.user;
  const userRole = user?.role?.slug;

  const getUserOrgLevel = () => {
    if (user?.organization?.level?.slug) return user.organization.level.slug;
    if (typeof user?.organization?.level === "string") return user.organization.level;
    return null;
  };

  const getUserOrganizationId = () => {
    return user?.organization?.id || user?.organization_id || null;
  };

  const userOrgLevel = getUserOrgLevel();
  const userOrganizationId = getUserOrganizationId();

  const canCreate = ["super-admin", "admin", "operator"].includes(userRole);
  const canEditDelete = ["super-admin", "admin"].includes(userRole);

  const isPCLevel = userOrgLevel === "pc";
  const isMWCLevel = userOrgLevel === "mwc";
  const isRantingLevel = userOrgLevel === "ranting";

  const levelOptions = [
    { slug: "pc", display: "PCNU" },
    { slug: "mwc", display: "MWCNU" },
    { slug: "ranting", display: "RANTING" },
    { slug: "anak-ranting", display: "ANAK RANTING" },
    { slug: "lembaga", display: "LEMBAGA" },
    { slug: "banom", display: "BANOM" },
  ];

  const LEVELS_WITH_TYPE_FILTER = ["lembaga", "banom"];

  const getAvailableLevelOptions = () => {
    if (userRole === "super-admin" || isPCLevel) return levelOptions;
    if (isMWCLevel) return levelOptions.filter(l => l.slug !== "pc");
    if (isRantingLevel) return levelOptions.filter(l => ["ranting", "anak-ranting"].includes(l.slug));
    return levelOptions.filter(l => l.slug === userOrgLevel);
  };

  const availableLevelOptions = getAvailableLevelOptions();
  const showTypeFilter = LEVELS_WITH_TYPE_FILTER.includes(filterLevel);

  // Build filters untuk React Query
  const filters = {
    level_slug: filterLevel || undefined,
    organization_id: filterOrganization || undefined,
    organization_type_id: filterOrganizationType || undefined,
    jabatan_id: filterJabatan || undefined,
    is_active: filterStatus || undefined,
  };

  // Gunakan hook useAnggota dengan cache dan realtime
  const {
    data: anggotaData,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteAnggota,
    isDeleting,
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  } = useAnggota(filters, {
    enabled: !initialLoading,
  });

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const result = await organizationService.getAll({ per_page: 1000 });
      if (!result.success) {
        console.error("Failed to fetch organizations:", result.message);
        return;
      }

      const allOrgs = result.data.data || [];
      setAllOrganizations(allOrgs);

      const accessibleOrgs = getAccessibleOrganizations(allOrgs);
      accessibleOrgs.sort((a, b) => a.nama.localeCompare(b.nama));

      setOrganizations(accessibleOrgs);
      setFilteredOrganizations(accessibleOrgs);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  // Get accessible organizations
  const getAccessibleOrganizations = (allOrgs) => {
    if (userRole === "super-admin") return allOrgs;
    if (!userOrganizationId) return [];

    const userOrg = allOrgs.find(org => org.id === userOrganizationId);
    if (!userOrg) return [];

    if (isPCLevel || isMWCLevel) {
      const descendants = getAllDescendantOrganizations(allOrgs, userOrganizationId);
      return [userOrg, ...descendants];
    }

    if (isRantingLevel) {
      const children = allOrgs.filter(org => org.parent_id === userOrganizationId);
      return [userOrg, ...children];
    }

    return [userOrg];
  };

  const getAllDescendantOrganizations = (orgs, parentId) => {
    const result = [];
    const children = orgs.filter(org => org.parent_id === parentId);
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendantOrganizations(orgs, child.id));
    }
    return result;
  };

  const getOrgLevelSlug = (org) => {
    if (!org) return null;
    if (typeof org.level === "string") return org.level;
    if (org.level?.slug) return org.level.slug;
    return null;
  };

  // Fetch organization types
  const fetchOrganizationTypes = async () => {
    try {
      const result = await organizationTypeService.getAll({ per_page: 100 });
      if (result.success) {
        const types = result.data.data || [];
        setOrganizationTypes(types.filter(t => t.is_active !== false));
      }
    } catch (err) {
      console.error("Error fetching organization types:", err);
    }
  };

  const fetchJabatans = async () => {
    const result = await jabatanService.getAll({ per_page: 100 });
    if (result.success) setJabatans(result.data.data || []);
  };

  // Filter organisasi by level
  const handleFilterLevelChange = (levelSlug) => {
    setFilterLevel(levelSlug);
    setFilterOrganization("");
    setFilterOrganizationType("");

    let filteredOrgs = [];

    if (!levelSlug) {
      filteredOrgs = organizations;
    } else {
      const accessibleIds = new Set(organizations.map(org => org.id));
      filteredOrgs = allOrganizations.filter(org => {
        const orgLevelSlug = getOrgLevelSlug(org);
        return orgLevelSlug === levelSlug && accessibleIds.has(org.id);
      });
    }

    filteredOrgs.sort((a, b) => a.nama.localeCompare(b.nama));
    setFilteredOrganizations(filteredOrgs);
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchOrganizations(),
        fetchJabatans(),
        fetchOrganizationTypes()
      ]);
      setInitialLoading(false);
    };
    loadInitialData();
  }, []);

  // Handlers
  const handleFilterOrganizationChange = (e) => setFilterOrganization(e.target.value);
  const handleFilterOrganizationTypeChange = (e) => setFilterOrganizationType(e.target.value);
  const handleFilterJabatanChange = (e) => setFilterJabatan(e.target.value);
  const handleFilterStatusChange = (e) => setFilterStatus(e.target.value);

  const handleReset = () => {
    setFilterLevel("");
    setFilterOrganization("");
    setFilterOrganizationType("");
    setFilterJabatan("");
    setFilterStatus("");
    setFilteredOrganizations(organizations);
  };

  const handleDelete = (anggota) => {
    if (!canEditDelete) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus anggota");
      return;
    }
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus anggota "${anggota.nama}"?`,
      async () => {
        try {
          await deleteAnggota(anggota.id);
          success("Berhasil", "Anggota berhasil dihapus");
        } catch (err) {
          error("Gagal", err.message || "Gagal menghapus anggota");
        }
      }
    );
  };

  const openCreateForm = () => {
    if (!canCreate) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah anggota");
      return;
    }
    setEditingAnggota(null);
    setModalOpen(true);
  };

  const openEditForm = (anggota) => {
    if (!canEditDelete) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit anggota");
      return;
    }
    setEditingAnggota(anggota);
    setModalOpen(true);
  };

  const openDetail = (anggota) => {
    setSelectedAnggota(anggota);
    setDetailOpen(true);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Tidak Aktif
      </span>
    );
  };

  const renderRealtimeStatus = () => {
    const statusConfig = {
      connected: {
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        text: 'Terhubung',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      connecting: {
        icon: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
        text: 'Menghubungkan...',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      },
      disconnected: {
        icon: <WifiOff className="w-4 h-4 text-gray-500" />,
        text: 'Terputus',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
      },
      error: {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        text: 'Error koneksi',
        className: 'bg-red-50 text-red-700 border-red-200',
      },
    };

    const status = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.className}`}>
        {status.icon}
        <span className="text-xs font-medium">{status.text}</span>
        {isRealtimeEnabled && connectionStatus === 'connected' && (
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-1"></span>
        )}
      </span>
    );
  };

  const statusOptions = [
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Tidak Aktif" },
  ];

  const hasActiveFilters = filterLevel || filterOrganization || filterOrganizationType || filterJabatan || filterStatus;

  const pagination = anggotaData || { current_page: 1, last_page: 1, per_page: 10, total: 0 };
  const anggotaList = anggotaData?.data || [];

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await refetch({ page: newPage });
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

  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
                <Users className="w-8 h-8 text-emerald-600" />
                Manajemen Anggota
              </h1>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                <span>Kelola data anggota organisasi Nahdatul Ulama</span>
                {renderRealtimeStatus()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleRealtime}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isRealtimeEnabled
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                }`}
                title={isRealtimeEnabled ? 'Realtime aktif' : 'Realtime nonaktif'}
              >
                {isRealtimeEnabled ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isRealtimeEnabled ? 'Live' : 'Offline'}
                </span>
              </button>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {canCreate && (
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Anggota
                </button>
              )}
            </div>
          </div>

          {/* Status Realtime Banner */}
          {isRealtimeEnabled && connectionStatus === 'connected' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-emerald-700">
                <strong>Realtime aktif</strong> — Perubahan data anggota akan muncul secara otomatis.
              </span>
              <button
                onClick={toggleRealtime}
                className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium"
              >
                Nonaktifkan
              </button>
            </div>
          )}

          {!isRealtimeEnabled && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <WifiOff className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Mode offline. Perubahan tidak akan terlihat secara otomatis.
              </span>
              <button
                onClick={toggleRealtime}
                className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium"
              >
                Aktifkan Realtime
              </button>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Level Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    LEVEL ORGANISASI
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => handleFilterLevelChange(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Level</option>
                    {availableLevelOptions.map((level) => (
                      <option key={level.slug} value={level.slug}>
                        {level.display}
                      </option>
                    ))}
                  </select>
                </div>

                {showTypeFilter ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      TIPE {filterLevel === "lembaga" ? "LEMBAGA" : "BANOM"}
                    </label>
                    <select
                      value={filterOrganizationType}
                      onChange={handleFilterOrganizationTypeChange}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Tipe</option>
                      {organizationTypes
                        .filter(type => type.organization_level_id === (filterLevel === "lembaga" ? 5 : 6))
                        .map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.nama}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      ORGANISASI
                    </label>
                    <select
                      value={filterOrganization}
                      onChange={handleFilterOrganizationChange}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Organisasi</option>
                      {filteredOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Jabatan Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    JABATAN
                  </label>
                  <select
                    value={filterJabatan}
                    onChange={handleFilterJabatanChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Jabatan</option>
                    {jabatans.map((jab) => (
                      <option key={jab.id} value={jab.id}>
                        {jab.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    STATUS
                  </label>
                  <select
                    value={filterStatus}
                    onChange={handleFilterStatusChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Status</option>
                    {statusOptions.map((opt) => (
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
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Telepon</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {anggotaList.length === 0 && !isFetching ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data anggota</p>
                            {canCreate && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Anggota Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      anggotaList.map((anggota, index) => (
                        <tr key={anggota.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">{anggota.nama}</div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.organization?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.jabatan?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.no_hp || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">{getStatusBadge(anggota.is_active)}</td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetail(anggota)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canEditDelete && (
                                <>
                                  <button
                                    onClick={() => openEditForm(anggota)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(anggota)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Hapus"
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {anggotaList.length === 0 && !isFetching ? (
                  <div className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Tidak ada data anggota</p>
                    </div>
                  </div>
                ) : (
                  anggotaList.map((anggota) => (
                    <div key={anggota.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{anggota.nama}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{anggota.organization?.nama || "-"}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openDetail(anggota)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditDelete && (
                            <>
                              <button
                                onClick={() => openEditForm(anggota)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(anggota)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Jabatan</p>
                          <p className="text-gray-700 mt-1">{anggota.jabatan?.nama || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">No. Telepon</p>
                          <p className="text-gray-700 mt-1">{anggota.no_hp || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(anggota.is_active)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && !isFetching && anggotaList.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari{" "}
                    {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1 || isFetching}
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
                            disabled={isFetching}
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
                      disabled={pagination.current_page === pagination.last_page || isFetching}
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

      <AnggotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAnggota={editingAnggota}
        organizations={organizations}
        allOrganizations={allOrganizations}
        jabatans={jabatans}
        onSuccess={() => refresh()}
        canManage={canCreate}
        userOrgLevel={userOrgLevel}
        defaultOrgId={organizations.length === 1 ? organizations[0]?.id : null}
        currentUser={user}
        userOrganizationId={userOrganizationId}
        isRestrictedLevel={!isPCLevel && userRole !== "super-admin"}
      />

      <AnggotaDetail
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        anggota={selectedAnggota}
        onEdit={() => {
          setDetailOpen(false);
          openEditForm(selectedAnggota);
        }}
        canEdit={canEditDelete}
      />
    </MainLayout>
  );
};

export default Anggotas;