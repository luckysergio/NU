import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Briefcase,
  Building2,
  FolderTree,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import MainLayout from "../../components/layout/MainLayout";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useWorkProgram } from "../../hooks/useWorkProgram";
import { useRealtimeWorkProgram } from "../../hooks/useRealtimeWorkProgram";
import workProgramService from "../../services/workProgramService";
import { activityService } from "../../services/activityService";

// Import Modal Components
import WorkProgramFormModal from "./WorkProgramFormModal";
import WorkProgramDetailModal from "./WorkProgramDetailModal";
import ActivityDetailModal from "./ActivityDetailModal";
import ActivityEditModal from "./ActivityEditModal";

const WorkPrograms = () => {
  const { user: currentUser } = useAuth();
  const { success, error, warning } = useModal();
  useRealtimeWorkProgram();

  // ============================================
  // FILTER & UI STATE
  // ============================================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedProgramId, setExpandedProgramId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState("create");
  const [selectedProgramForForm, setSelectedProgramForForm] = useState(null);
  const [initialThemeId, setInitialThemeId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProgramForDetail, setSelectedProgramForDetail] =
    useState(null);

  const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] =
    useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState(null);

  const [isActivityEditModalOpen, setIsActivityEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Master Data State
  const [themes, setThemes] = useState([]);
  const [fields, setFields] = useState([]);
  const [targets, setTargets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [mwcOrganizations, setMwcOrganizations] = useState([]);
  const [availableThemeOptions, setAvailableThemeOptions] = useState([]);
  const [themesStats, setThemesStats] = useState({
    total_themes: 0,
    used_themes: 0,
    available_count: 0,
  });
  const [loadingThemes, setLoadingThemes] = useState(false);

  // User Role
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdmin = userRole === "admin";
  const isMWC = userOrgLevel === "mwc";
  const isRanting = userOrgLevel === "ranting";
  const isPC = userOrgLevel === "pc";
  const hasOrganization = !!currentUser?.organization?.id;
  const isRestrictedLevel = isMWC || isRanting;
  const shouldAutoSelectOrg = hasOrganization && !isSuperAdmin;
  const userOrganizationId =
    currentUser?.organization?.id || currentUser?.organization_id;
  const userOrganizationName = currentUser?.organization?.nama;

  const filters = useMemo(
    () => ({
      page: currentPage,
      per_page: perPage,
      search: searchTerm || undefined,
      status: filterStatus || undefined,
      organization_id: filterOrganization || undefined,
    }),
    [currentPage, perPage, searchTerm, filterStatus, filterOrganization],
  );

  const {
    data: response,
    isLoading: queryLoading,
    isFetching,
    delete: deleteProgram,
  } = useWorkProgram(filters, { enabled: !initialLoading });
  const programs = response?.data || [];
  const totalPages = response?.last_page || 1;
  const totalPrograms = response?.total || 0;
  const loading = queryLoading;

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getLevelDisplay = () => {
    if (isMWC) return "MWC";
    if (isRanting) return "Ranting";
    if (isPC) return "PC";
    return "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderStatusBadge = (status) => {
    let badgeClass = "",
      badgeText = "";
    switch (status) {
      case "aktif":
        badgeClass = "bg-emerald-100 text-emerald-700";
        badgeText = "Aktif";
        break;
      case "selesai":
        badgeClass = "bg-blue-100 text-blue-700";
        badgeText = "Selesai";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-600";
        badgeText = "Draft";
    }
    return (
      <span
        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {badgeText}
      </span>
    );
  };

  // ============================================
  // DATA FETCHING
  // ============================================
  const fetchAvailableThemes = useCallback(async () => {
    if (!isMWC) return;
    setLoadingThemes(true);
    try {
      const result = await workProgramService.getAvailableThemesForMWC();
      if (result.success && result.data) {
        const available = (result.data.available_themes || []).filter(
          (t) => t.is_active === true,
        );
        setAvailableThemeOptions(available);
        setThemesStats({
          total_themes: result.data.total_themes || 0,
          used_themes: result.data.used_themes || 0,
          available_count: result.data.available_count || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThemes(false);
    }
  }, [isMWC]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [themesData, fieldsData, targetsData, goalsData, orgsData] =
        await Promise.all([
          workProgramService.getActiveThemes().catch(() => []),
          workProgramService
            .getFields({ per_page: 100, is_active: true })
            .catch(() => []),
          workProgramService
            .getTargets({ per_page: 100, is_active: true })
            .catch(() => []),
          workProgramService
            .getGoals({ per_page: 100, is_active: true })
            .catch(() => []),
          workProgramService
            .getOrganizations({ per_page: 100 })
            .catch(() => []),
        ]);

      setThemes(
        (Array.isArray(themesData) ? themesData : []).filter(
          (t) => t.is_active,
        ),
      );
      setFields(Array.isArray(fieldsData) ? fieldsData : []);
      setTargets(Array.isArray(targetsData) ? targetsData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);

      let accessibleOrgs = [],
        mwcOrgs = [];
      if (isSuperAdmin) {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter((o) => o.level?.slug === "mwc");
      } else if (isPC) {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter(
          (o) => o.level?.slug === "mwc" && o.parent_id === userOrganizationId,
        );
      } else if (isRestrictedLevel && userOrganizationId) {
        accessibleOrgs = orgsData.filter((o) => o.id === userOrganizationId);
        if (accessibleOrgs.length === 0 && currentUser?.organization)
          accessibleOrgs = [currentUser.organization];
        mwcOrgs = accessibleOrgs.filter((o) => o.level?.slug === "mwc");
      } else {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter((o) => o.level?.slug === "mwc");
      }

      setOrganizations(accessibleOrgs);
      setMwcOrganizations(mwcOrgs);
      setInitialLoading(false);
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat memuat data master");
      setInitialLoading(false);
    }
  }, [
    isRestrictedLevel,
    userOrganizationId,
    isSuperAdmin,
    isPC,
    currentUser,
    error,
  ]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);
  useEffect(() => {
    if (isMWC && !initialLoading) fetchAvailableThemes();
  }, [isMWC, initialLoading, fetchAvailableThemes]);

  // ============================================
  // HANDLERS
  // ============================================
  // ✅ BARU: Handler untuk refresh data setelah form sukses (create/update)
  const handleFormSuccess = (createdProgramData = null) => {
    // 1. Optimistic Update: Langsung hapus tema yang baru dipakai dari list
    if (isMWC && createdProgramData?.theme_id) {
      const themeId = parseInt(createdProgramData.theme_id);
      setAvailableThemeOptions((prev) =>
        prev.filter((t) => t.id !== themeId),
      );
      setThemesStats((prev) => ({
        ...prev,
        used_themes: prev.used_themes + 1,
        available_count: Math.max(0, prev.available_count - 1),
      }));
    }

    // 2. Background refresh dari server untuk memastikan data sinkron
    if (isMWC && !initialLoading) {
      fetchAvailableThemes();
    }
  };

  const handleDeleteProgram = (program) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus program kerja "${program.nama_program}"?`,
      () => {
        setDeletingId(program.id);
        deleteProgram(program.id, {
          onSuccess: () => {
            success("Berhasil", "Program kerja berhasil dihapus");
            setDeletingId(null);

            // ✅ BARU: Refresh daftar tema tersedia setelah delete
            // Agar tema yang dibebaskan muncul kembali
            if (isMWC && !initialLoading) {
              fetchAvailableThemes();
            }
          },
          onError: (err) => {
            error("Gagal", err?.message || "Terjadi kesalahan");
            setDeletingId(null);
          },
        });
      },
    );
  };

  const handleOpenCreateModal = (preSelectedThemeId = null) => {
    setFormModalMode("create");
    setSelectedProgramForForm(null);
    setInitialThemeId(preSelectedThemeId);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (program) => {
    setFormModalMode("edit");
    setSelectedProgramForForm(program);
    setInitialThemeId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenViewModal = async (program) => {
    setSelectedProgramForDetail(program);
    setIsDetailModalOpen(true);
    try {
      const result = await activityService.getAll({
        work_program_id: program.id,
        per_page: 100,
      });
      if (result.success && result.data.data) {
        setSelectedProgramForDetail({
          ...program,
          activities: result.data.data,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenActivityDetail = (activity) => {
    setSelectedActivityDetail(activity);
    setIsActivityDetailModalOpen(true);
  };

  const handleOpenEditActivityModal = (activity) => {
    setEditingActivity(activity);
    setIsActivityEditModalOpen(true);
  };

  const handleActivityEditSuccess = async () => {
    if (selectedProgramForDetail) {
      const refreshResult = await activityService.getAll({
        work_program_id: selectedProgramForDetail.id,
        per_page: 100,
      });
      if (refreshResult.success && refreshResult.data.data) {
        setSelectedProgramForDetail({
          ...selectedProgramForDetail,
          activities: refreshResult.data.data,
        });
      }
    }
  };

  const hasActiveFilters = searchTerm || filterOrganization || filterStatus;

  if (initialLoading) {
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-emerald-600" /> Program Kerja{" "}
                {getLevelDisplay()}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola program kerja {getLevelDisplay()}
                {hasOrganization &&
                  userOrganizationName &&
                  ` - ${userOrganizationName}`}
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateModal()}
              disabled={
                fields.length === 0 ||
                targets.length === 0 ||
                goals.length === 0
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Tambah Program
            </button>
          </div>

          {/* Available Themes Section - MWC Only */}
          {isMWC && (
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-200">
                  <FolderTree className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-emerald-800">
                    Tema Tersedia
                  </h2>
                </div>
                {loadingThemes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-emerald-600">
                      Memuat tema...
                    </span>
                  </div>
                ) : availableThemeOptions.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-700 font-medium text-sm">
                      Semua tema aktif sudah digunakan
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableThemeOptions.map((theme) => (
                      <div
                        key={theme.id}
                        className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">
                            {theme.nama}
                          </h3>
                          {theme.deskripsi && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {theme.deskripsi}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenCreateModal(theme.id)}
                          className="mt-3 pt-3 border-t border-gray-100 w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Buat Program
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isPC && mwcOrganizations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI (MWC)
                  </label>
                  <select
                    value={filterOrganization}
                    onChange={(e) => {
                      setFilterOrganization(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Semua MWC</option>
                    {mwcOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  STATUS
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  TAMPILAN
                </label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterOrganization("");
                      setFilterStatus("");
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
              </div>
            )}
            <div
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all ${isFetching ? "opacity-50" : "opacity-100"}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Nama Program
                      </th>
                      {isPC && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                          MWC
                        </th>
                      )}
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Tema
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Tahun
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Bidang
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Kegiatan
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {programs.length === 0 && !loading ? (
                      <tr>
                        <td
                          colSpan={isPC ? 8 : 7}
                          className="px-6 py-16 text-center"
                        >
                          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Tidak ada data</p>
                        </td>
                      </tr>
                    ) : (
                      programs.map((program) => {
                        const stats = program.statistics || {};
                        const isExpanded = expandedProgramId === program.id;
                        const rantingStatus = stats.ranting_status || [];
                        return (
                          <React.Fragment key={program.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="text-center px-6 py-4 font-semibold text-gray-800">
                                {program.nama_program}
                              </td>
                              {isPC && (
                                <td className="text-center px-6 py-4 text-sm text-gray-800">
                                  {program.organization?.nama || "-"}
                                </td>
                              )}
                              <td className="text-center px-6 py-4 text-sm text-gray-600">
                                {program.theme?.nama || "-"}
                              </td>
                              <td className="text-center px-6 py-4 text-sm text-gray-600">
                                {program.tahun}
                              </td>
                              <td className="text-center px-6 py-4 text-sm text-gray-600">
                                {program.field?.nama || "-"}
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                  {stats.total_activities || 0}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                {renderStatusBadge(program.status)}
                              </td>
                              <td className="text-center px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenViewModal(program)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditModal(program)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProgram(program)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    disabled={deletingId === program.id}
                                  >
                                    {deletingId === program.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                  {rantingStatus.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setExpandedProgramId(
                                          isExpanded ? null : program.id,
                                        )
                                      }
                                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-gray-50">
                                <td
                                  colSpan={isPC ? 8 : 7}
                                  className="px-6 py-4"
                                >
                                  <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-emerald-600" />
                                      Status Kegiatan
                                    </p>
                                    <table className="w-full min-w-125">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">
                                            No
                                          </th>
                                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">
                                            Organisasi
                                          </th>
                                          <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">
                                            Jumlah
                                          </th>
                                          <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">
                                            Status
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        <tr className="bg-emerald-50/30">
                                          <td className="text-center px-4 py-3 text-sm">
                                            1
                                          </td>
                                          <td className="text-left px-4 py-3 text-sm font-semibold text-emerald-700">
                                            {program.organization?.nama} (MWC)
                                          </td>
                                          <td className="text-center px-4 py-3 text-sm">
                                            <span
                                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${program.mwc_activities_count > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                                            >
                                              {program.mwc_activities_count ||
                                                0}
                                            </span>
                                          </td>
                                          <td className="text-center px-4 py-3">
                                            <span
                                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${program.mwc_activities_count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                                            >
                                              {program.mwc_activities_count > 0
                                                ? "SUDAH ADA"
                                                : "BELUM ADA"}
                                            </span>
                                          </td>
                                        </tr>
                                        {rantingStatus
                                          .sort((a, b) =>
                                            a.nama.localeCompare(b.nama),
                                          )
                                          .map((r, idx) => (
                                            <tr
                                              key={r.id}
                                              className="hover:bg-gray-100"
                                            >
                                              <td className="text-center px-4 py-3 text-sm">
                                                {idx + 2}
                                              </td>
                                              <td className="text-left px-4 py-3 text-sm text-gray-800">
                                                {r.nama}
                                              </td>
                                              <td className="text-center px-4 py-3 text-sm">
                                                <span
                                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${r.activities_count > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                                                >
                                                  {r.activities_count}
                                                </span>
                                              </td>
                                              <td className="text-center px-4 py-3">
                                                <span
                                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${r.has_activities ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                                                >
                                                  {r.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Menampilkan {(currentPage - 1) * perPage + 1} -{" "}
                {Math.min(currentPage * perPage, totalPrograms)} dari{" "}
                {totalPrograms}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum =
                      totalPages <= 5
                        ? i + 1
                        : currentPage <= 3
                          ? i + 1
                          : currentPage >= totalPages - 2
                            ? totalPages - 4 + i
                            : currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl font-medium transition-all ${currentPage === pageNum ? "bg-emerald-600 text-white shadow-md" : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Modals */}
      <WorkProgramFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={formModalMode}
        selectedProgram={selectedProgramForForm}
        initialThemeId={initialThemeId}
        masterData={{
          organizations,
          themes,
          fields,
          targets,
          goals,
          availableThemeOptions,
        }}
        userContext={{
          isMWC,
          isRestrictedLevel,
          shouldAutoSelectOrg,
          userOrganizationId,
          userOrganizationName,
        }}
        onSuccess={handleFormSuccess}
        modalActions={{ success, error }}
      />

      <WorkProgramDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        program={selectedProgramForDetail}
        onViewActivity={handleOpenActivityDetail}
        onEditActivity={handleOpenEditActivityModal}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        renderStatusBadge={renderStatusBadge}
      />

      <ActivityDetailModal
        isOpen={isActivityDetailModalOpen}
        onClose={() => setIsActivityDetailModalOpen(false)}
        activity={selectedActivityDetail}
        onEdit={handleOpenEditActivityModal}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />

      <ActivityEditModal
        isOpen={isActivityEditModalOpen}
        onClose={() => setIsActivityEditModalOpen(false)}
        activity={editingActivity}
        onSuccess={handleActivityEditSuccess}
        modalActions={{ success, error }}
      />
    </MainLayout>
  );
};

export default WorkPrograms;