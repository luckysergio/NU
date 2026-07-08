// src/pages/anggotas/Anggotas.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useAnggota } from "../../hooks/useAnggota";
import { useRealtimeAnggota } from "../../hooks/useRealtimeAnggota";
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
  Search,
  X,
} from "lucide-react";
import AnggotaModal from "./AnggotaModal";
import AnggotaDetail from "./AnggotaDetail";

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

// Level yang dianggap "leaf" (tidak punya children)
const LEAF_LEVELS = ["anak-ranting", "lembaga", "banom"];

const Anggotas = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // ✅ Aktifkan realtime listener
  useRealtimeAnggota();

  // ✅ User info
  const userRole = currentUser?.role?.slug;
  const userOrgLevel =
    currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  const userOrganizationId =
    currentUser?.organization?.id || currentUser?.organization_id;
  const userId = currentUser?.id;

  const isSuperAdmin = userRole === "super-admin";
  const isAdmin = userRole === "admin";
  const isPCLevel = userOrgLevel === "pc";
  const isMWCLevel = userOrgLevel === "mwc";
  const isRantingLevel = userOrgLevel === "ranting";
  const isLeafLevel = LEAF_LEVELS.includes(userOrgLevel);

  const canManage =
    isSuperAdmin ||
    isAdmin ||
    ["mwc", "ranting", "anak-ranting", "lembaga", "banom"].includes(
      userOrgLevel
    );
  const canCreate = canManage || userRole === "operator";

  // ✅ Apakah user boleh memilih level lain?
  // Super-admin & admin di PC/MWC/Ranting boleh memilih level
  // Admin di leaf level & user biasa tidak boleh memilih level
  const canChooseLevel = useMemo(() => {
    if (isSuperAdmin) return true;
    if (!isAdmin && !isPCLevel && !isMWCLevel && !isRantingLevel) return false;
    if (isLeafLevel && !isSuperAdmin) return false;
    return true;
  }, [isSuperAdmin, isAdmin, isPCLevel, isMWCLevel, isRantingLevel, isLeafLevel]);

  // ✅ Filter states
  const [filterLevel, setFilterLevel] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // ✅ Auto-set filterLevel sesuai level user jika di leaf level
  useEffect(() => {
    if (isLeafLevel && !isSuperAdmin) {
      setFilterLevel(userOrgLevel);
    }
  }, [isLeafLevel, isSuperAdmin, userOrgLevel]);

  // ✅ Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ Available level options
  const availableLevelOptions = useMemo(() => {
    if (isSuperAdmin) return LEVEL_OPTIONS;
    if (isPCLevel && isAdmin) return LEVEL_OPTIONS;
    if (isMWCLevel && isAdmin) {
      return LEVEL_OPTIONS.filter((l) => l.slug !== "pc");
    }
    if (isRantingLevel && isAdmin) {
      return LEVEL_OPTIONS.filter((l) =>
        ["ranting", "anak-ranting"].includes(l.slug)
      );
    }
    // Untuk leaf level atau user biasa, hanya tampilkan level mereka sendiri
    if (isLeafLevel || !canChooseLevel) {
      return LEVEL_OPTIONS.filter((l) => l.slug === userOrgLevel);
    }
    return LEVEL_OPTIONS.filter((l) => l.slug === userOrgLevel);
  }, [
    isSuperAdmin,
    isPCLevel,
    isMWCLevel,
    isRantingLevel,
    isLeafLevel,
    isAdmin,
    userOrgLevel,
    canChooseLevel,
  ]);

  // ✅ Fetch organizations
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations-all-for-anggota", userId],
    queryFn: async () => {
      const result = await organizationService.getAllSimple({
        per_page: 1000,
      });
      if (!result.success) return [];
      return Array.isArray(result.data) ? result.data : [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // ✅ Fetch jabatans
  const { data: jabatansData, isLoading: isLoadingJabatans } = useQuery({
    queryKey: ["jabatans-all"],
    queryFn: async () => {
      const result = await jabatanService.getAll({ per_page: 100 });
      if (!result.success) return [];
      return result.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // ✅ Process organizations & jabatans dengan useMemo
  const { organizations, filteredOrganizations, filteredJabatans } =
    useMemo(() => {
      const allOrgs = organizationsData || [];
      const allJabatans = jabatansData || [];

      const getOrgLevelSlug = (org) => {
        if (!org) return null;
        if (typeof org.level === "string") return org.level;
        if (org.level && typeof org.level === "object")
          return org.level.slug || org.level.level_slug || null;
        return null;
      };

      const getAllDescendantOrganizations = (orgs, parentId) => {
        const result = [];
        const children = orgs.filter((org) => org.parent_id === parentId);
        for (const child of children) {
          result.push(child);
          result.push(...getAllDescendantOrganizations(orgs, child.id));
        }
        return result;
      };

      // Hitung organisasi yang bisa diakses user
      let accessibleOrgs = allOrgs;
      if (!isSuperAdmin && userOrganizationId) {
        const userOrg = allOrgs.find((org) => org.id === userOrganizationId);
        if (userOrg) {
          if (isPCLevel || isMWCLevel) {
            const descendants = getAllDescendantOrganizations(
              allOrgs,
              userOrganizationId
            );
            accessibleOrgs = [userOrg, ...descendants];
          } else if (isRantingLevel) {
            const children = allOrgs.filter(
              (org) => org.parent_id === userOrganizationId
            );
            accessibleOrgs = [userOrg, ...children];
          } else {
            // Leaf level (anak-ranting, lembaga, banom) atau user biasa
            accessibleOrgs = [userOrg];
          }
        }
      }

      accessibleOrgs.sort((a, b) => a.nama.localeCompare(b.nama));

      let filteredOrgs = accessibleOrgs;
      let filteredJabs = allJabatans;

      // Filter organisasi berdasarkan level yang dipilih
      if (filterLevel) {
        filteredOrgs = accessibleOrgs.filter(
          (org) => getOrgLevelSlug(org) === filterLevel
        );
        filteredJabs = allJabatans.filter(
          (jab) =>
            jab.level === filterLevel ||
            (jab.levels &&
              Array.isArray(jab.levels) &&
              jab.levels.includes(filterLevel))
        );
      }

      return {
        organizations: accessibleOrgs,
        filteredOrganizations: filteredOrgs,
        filteredJabatans: filteredJabs,
      };
    }, [
      organizationsData,
      jabatansData,
      filterLevel,
      isSuperAdmin,
      userOrganizationId,
      isPCLevel,
      isMWCLevel,
      isRantingLevel,
    ]);

  // ✅ Memoize filters untuk API call
  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
      level_slug: filterLevel || undefined,
      organization_id: filterOrganization || undefined,
      jabatan_id: filterJabatan || undefined,
      is_active:
        filterStatus === "active"
          ? "true"
          : filterStatus === "inactive"
          ? "false"
          : undefined,
      _userId: userId,
    }),
    [
      page,
      perPage,
      debouncedSearch,
      filterLevel,
      filterOrganization,
      filterJabatan,
      filterStatus,
      userId,
    ]
  );

  // ✅ Gunakan hook useAnggota
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteAnggota,
    isDeleting,
  } = useAnggota(filters);

  const anggotaList = response?.data || [];
  const pagination = response || {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };

  // ✅ Handlers
  const handleFilterLevelChange = (e) => {
    setFilterLevel(e.target.value);
    setFilterOrganization("");
    setFilterJabatan("");
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleReset = () => {
    // Reset ke level user jika di leaf level
    setFilterLevel(isLeafLevel && !isSuperAdmin ? userOrgLevel : "");
    setFilterOrganization("");
    setFilterJabatan("");
    setFilterStatus("");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
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
        setActionLoading((prev) => ({ ...prev, [anggota.id]: true }));
        try {
          await deleteAnggota(anggota.id);
          success("Berhasil", "Anggota berhasil dihapus");

          if (anggotaList.length === 1 && page > 1) {
            setPage(page - 1);
          }
        } catch (err) {
          console.error("Delete error:", err);
          error(
            "Gagal",
            err?.response?.data?.message ||
              err.message ||
              "Gagal menghapus anggota"
          );
        } finally {
          setActionLoading((prev) => ({ ...prev, [anggota.id]: false }));
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
  };

  const handleModalSuccess = () => {
    setPage(1);
  };

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

  const hasActiveFilters =
    filterLevel || filterOrganization || filterJabatan || filterStatus || debouncedSearch;

  // ✅ Loading state
  if (isLoadingOrgs || isLoadingJabatans || isLoading) {
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

  // ✅ Error state
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">
              {queryError?.message || "Silakan coba lagi"}
            </p>
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

          {/* ✅ FILTERS - SELALU DITAMPILKAN */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  CARI ANGGOTA
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama atau no anggota..."
                    className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* LEVEL ORGANISASI */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    LEVEL ORGANISASI
                    {!canChooseLevel && (
                      <span className="ml-1 text-[10px] text-amber-600 normal-case">
                        (Terkunci)
                      </span>
                    )}
                  </label>
                  <select
                    value={filterLevel}
                    onChange={handleFilterLevelChange}
                    disabled={!canChooseLevel}
                    className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                      !canChooseLevel
                        ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <option value="">Semua Level</option>
                    {availableLevelOptions.map((level) => (
                      <option key={level.slug} value={level.slug}>
                        {level.display}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ORGANISASI */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI
                  </label>
                  <select
                    value={filterOrganization}
                    onChange={handleFilterChange(setFilterOrganization)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!filterLevel || filteredOrganizations.length === 0}
                  >
                    <option value="">Semua Organisasi</option>
                    {filteredOrganizations.map((org) => {
                      const orgLevel =
                        typeof org.level === "string"
                          ? org.level
                          : org.level?.slug;
                      const level = LEVEL_OPTIONS.find(
                        (l) => l.slug === orgLevel
                      );
                      const levelDisplay = level
                        ? `(${level.display})`
                        : "";
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

                {/* JABATAN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    JABATAN
                  </label>
                  <select
                    value={filterJabatan}
                    onChange={handleFilterChange(setFilterJabatan)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={filteredJabatans.length === 0}
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

                {/* STATUS */}
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
                    <X className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TABLE */}
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
                            <p className="text-gray-500">
                              Tidak ada data anggota
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={handleReset}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                              >
                                Reset Filter
                              </button>
                            )}
                            {canCreate && !hasActiveFilters && (
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
                                  disabled={
                                    actionLoading[anggota.id] || isDeleting
                                  }
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

              {pagination.last_page > 1 &&
                !isFetching &&
                anggotaList.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-sm text-gray-500 order-2 sm:order-1">
                      Menampilkan {(page - 1) * perPage + 1} -{" "}
                      {Math.min(page * perPage, pagination.total)} dari{" "}
                      {pagination.total} data
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

      <AnggotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAnggota={editingAnggota}
        organizations={organizations}
        allOrganizations={organizationsData || []}
        jabatans={filteredJabatans}
        onSuccess={handleModalSuccess}
        canManage={canCreate}
        userOrgLevel={userOrgLevel}
        defaultOrgId={
          organizations.length === 1 ? organizations[0]?.id : null
        }
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