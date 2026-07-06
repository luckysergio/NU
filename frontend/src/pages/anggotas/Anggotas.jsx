// src/pages/anggotas/Anggotas.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useAnggota } from "../../hooks/useAnggota";
import { organizationService } from "../../services/organization";
import { jabatanService } from "../../services/jabatan";
import MainLayout from "../../components/layout/MainLayout";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import AnggotaModal from "./AnggotaModal";
import AnggotaDetail from "./AnggotaDetail";

// ============================================
// LEVEL OPTIONS CONSTANTS
// ============================================
const LEVEL_OPTIONS = [
  { slug: "pc", display: "PCNU" },
  { slug: "mwc", display: "MWCNU" },
  { slug: "ranting", display: "RANTING" },
  { slug: "anak-ranting", display: "ANAK RANTING" },
  { slug: "lembaga", display: "LEMBAGA" },
  { slug: "banom", display: "BANOM" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
];

// ============================================
// SKELETON LOADING
// ============================================
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {[...Array(6)].map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              {[...Array(6)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="lg:hidden divide-y divide-gray-100">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const Anggotas = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // ============================================
  // STATE
  // ============================================
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [filteredJabatans, setFilteredJabatans] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const [filterLevel, setFilterLevel] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [forceRefetch, setForceRefetch] = useState(0);

  // ============================================
  // USER PERMISSIONS & ROLES
  // ============================================
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  const userOrganizationId = currentUser?.organization?.id || currentUser?.organization_id;
  const userId = currentUser?.id;

  const isSuperAdmin = userRole === "super-admin";
  const isAdmin = userRole === "admin";
  const isPCLevel = userOrgLevel === "pc";
  const isMWCLevel = userOrgLevel === "mwc";
  const isRantingLevel = userOrgLevel === "ranting";
  const isAnakRantingLevel = userOrgLevel === "anak-ranting";
  const isLembagaLevel = userOrgLevel === "lembaga";
  const isBanomLevel = userOrgLevel === "banom";

  const canManage = isSuperAdmin || isAdmin || ["mwc", "ranting", "anak-ranting", "lembaga", "banom"].includes(userOrgLevel);
  const canCreate = canManage || userRole === "operator";

  const showFilters = useMemo(() => {
    if (isAnakRantingLevel || isLembagaLevel || isBanomLevel) return false;
    return true;
  }, [isAnakRantingLevel, isLembagaLevel, isBanomLevel]);

  const availableLevelOptions = useMemo(() => {
    if (isSuperAdmin || (isPCLevel && isAdmin)) return LEVEL_OPTIONS;
    if (isMWCLevel && isAdmin) return LEVEL_OPTIONS.filter((l) => l.slug !== "pc" && l.slug !== "banom");
    if (isRantingLevel && isAdmin) return LEVEL_OPTIONS.filter((l) => ["ranting", "anak-ranting"].includes(l.slug));
    if (isAnakRantingLevel || isLembagaLevel || isBanomLevel) return [];
    return LEVEL_OPTIONS.filter((l) => l.slug === userOrgLevel);
  }, [isSuperAdmin, isPCLevel, isMWCLevel, isRantingLevel, isAnakRantingLevel, isLembagaLevel, isBanomLevel, isAdmin, userOrgLevel]);

  // ============================================
  // FILTERS - Tambahkan userId untuk isolasi cache per user
  // ============================================
  const filters = useMemo(() => ({
    page,
    per_page: perPage,
    level_slug: filterLevel || undefined,
    organization_id: filterOrganization || undefined,
    jabatan_id: filterJabatan || undefined,
    is_active: filterStatus === "active" ? "true" : filterStatus === "inactive" ? "false" : undefined,
    _t: forceRefetch,
    _userId: userId, // PERBAIKAN: Tambahkan userId untuk isolasi cache per user
  }), [page, perPage, filterLevel, filterOrganization, filterJabatan, filterStatus, forceRefetch, userId]);

  // ============================================
  // REACT QUERY
  // ============================================
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteAnggota,
    isDeleting,
  } = useAnggota(filters, {
    enabled: !initialLoading,
  });

  const anggotaList = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // ============================================
  // UTILS & FETCHERS
  // ============================================
  const getAllDescendantOrganizations = (orgs, parentId) => {
    const result = [];
    const children = orgs.filter((org) => org.parent_id === parentId);
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendantOrganizations(orgs, child.id));
    }
    return result;
  };

  const getOrgLevelSlug = useCallback((org) => {
    if (!org) return null;
    if (typeof org.level === "string") return org.level;
    if (org.level && typeof org.level === "object") return org.level.slug || org.level.level_slug || null;
    return null;
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      let allOrgs = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const result = await organizationService.getAll({ per_page: 100, page: currentPage });
        if (!result.success) break;
        const data = result.data;
        if (data?.data) {
          allOrgs = [...allOrgs, ...data.data];
          lastPage = data.last_page || currentPage;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= lastPage);

      setAllOrganizations(allOrgs);

      let accessibleOrgs = allOrgs;
      if (!isSuperAdmin && userOrganizationId) {
        const userOrg = allOrgs.find((org) => org.id === userOrganizationId);
        if (userOrg) {
          if (isPCLevel || isMWCLevel) {
            const descendants = getAllDescendantOrganizations(allOrgs, userOrganizationId);
            accessibleOrgs = [userOrg, ...descendants];
          } else if (isRantingLevel) {
            const children = allOrgs.filter((org) => org.parent_id === userOrganizationId);
            accessibleOrgs = [userOrg, ...children];
          } else {
            accessibleOrgs = [userOrg];
          }
        }
      }

      accessibleOrgs.sort((a, b) => a.nama.localeCompare(b.nama));
      setOrganizations(accessibleOrgs);
      setFilteredOrganizations(accessibleOrgs);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  }, [isSuperAdmin, userOrganizationId, isPCLevel, isMWCLevel, isRantingLevel]);

  const fetchJabatans = useCallback(async () => {
    try {
      const result = await jabatanService.getAll({ per_page: 100 });
      if (result.success) {
        const data = result.data.data || [];
        setJabatans(data);
        setFilteredJabatans(data);
      }
    } catch (err) {
      console.error("Error fetching jabatans:", err);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([fetchOrganizations(), fetchJabatans()]);
      setInitialLoading(false);
    };
    loadInitialData();
  }, [fetchOrganizations, fetchJabatans]);

  useEffect(() => {
    if (filterLevel) {
      const filteredOrgs = organizations.filter((org) => getOrgLevelSlug(org) === filterLevel);
      setFilteredOrganizations(filteredOrgs);
      
      const filteredJabs = jabatans.filter((jab) => 
        jab.level === filterLevel || (jab.levels && Array.isArray(jab.levels) && jab.levels.includes(filterLevel))
      );
      setFilteredJabatans(filteredJabs);
    } else {
      setFilteredOrganizations(organizations);
      setFilteredJabatans(jabatans);
    }
    setFilterOrganization("");
    setFilterJabatan("");
  }, [filterLevel, organizations, jabatans, getOrgLevelSlug]);

  // PERBAIKAN: Refetch saat userId berubah (user berganti)
  useEffect(() => {
    if (userId) {
      setForceRefetch(prev => prev + 1);
    }
  }, [userId]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFilterChange = (setter) => (e) => setter(e.target.value);

  const handleReset = () => {
    setFilterLevel("");
    setFilterOrganization("");
    setFilterJabatan("");
    setFilterStatus("");
    setPage(1);
    setForceRefetch(prev => prev + 1);
  };

  const handleDelete = (anggota) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus anggota");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus anggota "${anggota.nama}"?`,
      async () => {
        setActionLoading(prev => ({ ...prev, [anggota.id]: true }));
        try {
          const result = await deleteAnggota(anggota.id);
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus anggota");
            return;
          }
          success("Berhasil", result?.message || "Anggota berhasil dihapus");
          setTimeout(() => {
            setForceRefetch(prev => prev + 1);
            refetch();
          }, 100);
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus anggota");
        } finally {
          setActionLoading(prev => ({ ...prev, [anggota.id]: false }));
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
    if (!canManage) {
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

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
    setForceRefetch(prev => prev + 1);
  };

  const handleModalSuccess = () => {
    setForceRefetch(prev => prev + 1);
    setPage(1);
    setTimeout(() => {
      refetch();
    }, 300);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
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

  const hasActiveFilters = filterLevel || filterOrganization || filterJabatan || filterStatus;

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
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

  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  // ============================================
  // RENDER
  // ============================================
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
              <p className="text-sm text-gray-500 mt-1">
                Kelola data anggota organisasi Nahdlatul Ulama
              </p>
            </div>
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

          {/* Filter Section - Hanya ditampilkan jika showFilters true */}
          {showFilters && (
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
                      onChange={(e) => setFilterLevel(e.target.value)}
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

                  {/* Organization Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      ORGANISASI
                    </label>
                    <select
                      value={filterOrganization}
                      onChange={handleFilterChange(setFilterOrganization)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                      disabled={!filterLevel}
                    >
                      <option value="">Semua Organisasi</option>
                      {filteredOrganizations.map((org) => {
                        const orgLevel = getOrgLevelSlug(org);
                        const level = LEVEL_OPTIONS.find((l) => l.slug === orgLevel);
                        const levelDisplay = level ? `(${level.display})` : "";
                        return (
                          <option key={org.id} value={org.id}>
                            {org.nama} {levelDisplay}
                          </option>
                        );
                      })}
                    </select>
                    {filterLevel && filteredOrganizations.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">
                        Tidak ada organisasi untuk level ini
                      </p>
                    )}
                  </div>

                  {/* Jabatan Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      JABATAN
                    </label>
                    <select
                      value={filterJabatan}
                      onChange={handleFilterChange(setFilterJabatan)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Jabatan</option>
                      {filteredJabatans.map((jab) => (
                        <option key={jab.id} value={jab.id}>
                          {jab.nama}
                        </option>
                      ))}
                    </select>
                    {filterLevel && filteredJabatans.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">
                        Tidak ada jabatan untuk level ini
                      </p>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      STATUS
                    </label>
                    <select
                      value={filterStatus}
                      onChange={handleFilterChange(setFilterStatus)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Status</option>
                      {STATUS_OPTIONS.map((opt) => (
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
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                        No Anggota
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Organisasi
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Jabatan
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
                    {anggotaList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManage ? 7 : 6}
                          className="px-6 py-16 text-center"
                        >
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
                        <tr
                          key={anggota.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm font-medium text-gray-800">
                              {anggota.no_anggota || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">
                              {anggota.nama}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {anggota.organization?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {anggota.jabatan?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(anggota.is_active)}
                          </td>
                          {canManage && (
                            <td className="text-center px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openDetail(anggota)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
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
                                  disabled={actionLoading[anggota.id] || isDeleting}
                                >
                                  {actionLoading[anggota.id] ? (
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
              {pagination.last_page > 1 && !isFetching && anggotaList.length > 0 && (
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
                        }
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

      {/* Modals */}
      <AnggotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAnggota={editingAnggota}
        organizations={organizations}
        allOrganizations={allOrganizations}
        jabatans={filteredJabatans}
        onSuccess={handleModalSuccess}
        canManage={canCreate}
        userOrgLevel={userOrgLevel}
        defaultOrgId={organizations.length === 1 ? organizations[0]?.id : null}
        currentUser={currentUser}
        userOrganizationId={userOrganizationId}
        isRestrictedLevel={!isPCLevel && !isSuperAdmin && !isAdmin}
      />

      <AnggotaDetail
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        anggota={selectedAnggota}
        onEdit={() => {
          setDetailOpen(false);
          openEditForm(selectedAnggota);
        }}
        canEdit={canManage}
      />
    </MainLayout>
  );
};

export default Anggotas;