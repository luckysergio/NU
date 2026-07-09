// src/pages/program-themes/ProgramThemes.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useProgramThemes } from "../../hooks/useProgramThemes";
import { useRealtimeProgramTheme } from "../../hooks/useRealtimeProgramTheme";
import { organizationService } from "../../services/organization";
import programThemeService from "../../services/programThemeService";
import { useQuery } from "@tanstack/react-query";

// Import sub-components
import ProgramThemesForm from "./ProgramThemesForm";
import ProgramThemesDetail from "./ProgramThemesDetail";
import ProgramThemesActivityList from "./ProgramThemesActivityList";
import ProgramThemesDetailActivity from "./ProgramThemesDetailActivity";

const ProgramThemes = () => {
  const { user: currentUser } = useAuth();
  const { success, error, warning } = useModal();

  // ✅ Aktifkan realtime listener
  useRealtimeProgramTheme();

  // ✅ Filter states (konsisten dengan halaman lain)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [expandedThemeId, setExpandedThemeId] = useState(null);

  // Activity Detail Modal state
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [selectedActivityData, setSelectedActivityData] = useState(null);

  // Activity List Modal state
  const [isActivityListOpen, setIsActivityListOpen] = useState(false);
  const [activityListData, setActivityListData] = useState({
    mwcName: "",
    activities: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    organization_id: "",
    nama: "",
    deskripsi: "",
    tahun: new Date().getFullYear(),
    tanggal_mulai: "",
    tanggal_selesai: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const userRole = currentUser?.role?.slug;
  const isSuperAdmin = userRole === "super-admin";

  // ✅ Debounce search (300ms) - konsisten dengan halaman lain
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ Memoize filters - semua filter langsung trigger refetch
  const filters = useMemo(
    () => ({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      tahun: filterTahun || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      organization_id: filterOrganization || undefined,
    }),
    [
      currentPage,
      perPage,
      debouncedSearch,
      filterTahun,
      startDate,
      endDate,
      filterOrganization,
    ]
  );

  // ✅ Gunakan hook useProgramThemes
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    create,
    update,
    delete: deleteTheme,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProgramThemes(filters);

  const themes = response?.data || [];
  const totalPages = response?.last_page || 1;
  const totalThemes = response?.total || 0;

  // ✅ Fetch organizations untuk filter (only for super admin)
  const { data: organizationsData } = useQuery({
    queryKey: ["organizations-for-program-themes"],
    queryFn: async () => {
      if (!isSuperAdmin) return [];
      const result = await organizationService.getAll({ per_page: 1000 });
      if (result.success) {
        return result.data.data || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: isSuperAdmin,
  });

  const organizations = organizationsData || [];

  // ✅ Fetch available years untuk dropdown filter
  const { data: yearsData } = useQuery({
    queryKey: ["program-themes-years"],
    queryFn: async () => {
      const result = await programThemeService.getAvailableYears();
      if (result.success) {
        return result.data || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const availableYears = yearsData || [];

  // Helper functions
  const getAutoStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return today >= start && today <= end;
  };

  // Auto-update is_active when dates change
  useEffect(() => {
    if (formData.tanggal_mulai && formData.tanggal_selesai && !isManualOverride) {
      const autoActive = getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai);
      if (autoActive !== formData.is_active) {
        setFormData((prev) => ({ ...prev, is_active: autoActive }));
      }
    }
  }, [formData.tanggal_mulai, formData.tanggal_selesai, isManualOverride]);

  // ✅ Filter handlers - semua langsung trigger refetch via filters memo
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const handleFilterTahunChange = (e) => {
    setFilterTahun(e.target.value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterOrganizationChange = (e) => {
    setFilterOrganization(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterTahun("");
    setStartDate("");
    setEndDate("");
    setFilterOrganization("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleExpand = (themeId) => {
    setExpandedThemeId(expandedThemeId === themeId ? null : themeId);
  };

  const resetForm = () => {
    setFormData({
      organization_id: "",
      nama: "",
      deskripsi: "",
      tahun: new Date().getFullYear(),
      tanggal_mulai: "",
      tanggal_selesai: "",
      is_active: true,
    });
    setFormErrors({});
    setIsManualOverride(false);
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedTheme(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (theme) => {
    setModalMode("edit");
    setSelectedTheme(theme);
    setFormData({
      organization_id: theme.organization_id?.toString() || "",
      nama: theme.nama,
      deskripsi: theme.deskripsi || "",
      tahun: theme.tahun || new Date().getFullYear(),
      tanggal_mulai: theme.tanggal_mulai?.split("T")[0] || "",
      tanggal_selesai: theme.tanggal_selesai?.split("T")[0] || "",
      is_active: theme.is_active,
    });
    setIsManualOverride(false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (theme) => {
    setModalMode("view");
    setSelectedTheme(theme);
    setIsModalOpen(true);
  };

  const handleOpenActivityDetail = (activityId, activityData = null) => {
    setSelectedActivityId(activityId);
    setSelectedActivityData(activityData);
    setIsActivityDetailOpen(true);
  };

  const handleCloseActivityDetail = () => {
    setIsActivityDetailOpen(false);
    setSelectedActivityId(null);
    setSelectedActivityData(null);
  };

  const handleOpenActivityList = (mwcName, activities) => {
    setActivityListData({
      mwcName,
      activities: activities || [],
    });
    setIsActivityListOpen(true);
  };

  const handleCloseActivityList = () => {
    setIsActivityListOpen(false);
    setActivityListData({ mwcName: "", activities: [] });
  };

  const handleDeleteTheme = (theme) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus tema program "${theme.nama}"?`,
      async () => {
        const mutationOptions = {
          onSuccess: (result) => {
            success("Berhasil", result?.message || "Tema program berhasil dihapus");
          },
          onError: (err) => {
            console.error("Delete error:", err);
            error(
              "Gagal",
              err?.response?.data?.message ||
                err?.message ||
                "Terjadi kesalahan saat menghapus data"
            );
          },
        };

        deleteTheme(theme.id, mutationOptions);
      }
    );
  };

  const validateForm = () => {
    const errors = {};
    if (isSuperAdmin && !formData.organization_id) {
      errors.organization_id = "Organisasi wajib dipilih";
    }
    if (!formData.nama) errors.nama = "Nama tema wajib diisi";
    if (!formData.tahun) errors.tahun = "Tahun wajib diisi";
    if (!formData.tanggal_mulai) errors.tanggal_mulai = "Tanggal mulai wajib diisi";
    if (!formData.tanggal_selesai) errors.tanggal_selesai = "Tanggal selesai wajib diisi";

    if (formData.tanggal_mulai && formData.tanggal_selesai) {
      if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
        errors.tanggal_selesai = "Tanggal selesai harus setelah atau sama dengan tanggal mulai";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          result?.message ||
            (modalMode === "create"
              ? "Tema program berhasil dibuat"
              : "Tema program berhasil diupdate")
        );
        setIsModalOpen(false);
        setIsSubmitting(false);
      },
      onError: (err) => {
        console.error("Submit error:", err);
        error(
          "Gagal",
          err?.response?.data?.message ||
            err?.message ||
            "Terjadi kesalahan saat menyimpan data"
        );
        setIsSubmitting(false);
      },
    };

    if (modalMode === "create") {
      create(formData, mutationOptions);
    } else {
      update({ id: selectedTheme.id, data: formData }, mutationOptions);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadgeTheme = (isActive, theme = null) => {
    if (isActive) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Aktif
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Tidak Aktif
        </span>
      </div>
    );
  };

  const getDateStatus = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
      return {
        label: "Akan Datang",
        color: "bg-blue-100 text-blue-700",
      };
    } else if (today > end) {
      return {
        label: "Berakhir",
        color: "bg-gray-100 text-gray-600",
      };
    } else {
      return {
        label: "Berlangsung",
        color: "bg-green-100 text-green-700",
      };
    }
  };

  const hasActiveFilters =
    debouncedSearch || filterTahun || startDate || endDate || filterOrganization;

  // Loading state
  if (isLoading && themes.length === 0) {
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
                <FolderTree className="w-8 h-8 text-emerald-600" />
                Program Kerja PCNU Kota Tangerang
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola tema program kerja organisasi
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Tema
            </button>
          </div>

          {/* ✅ Filter Section - Layout konsisten dengan halaman lain */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-5 sm:p-6">
            {/* Search Bar - Baris pertama */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                CARI TEMA PROGRAM
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama atau deskripsi tema..."
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns - Baris kedua */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter Tahun */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  TAHUN
                </label>
                <select
                  value={filterTahun}
                  onChange={handleFilterTahunChange}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                >
                  <option value="">Semua Tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Organisasi (hanya super admin) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI
                  </label>
                  <select
                    value={filterOrganization}
                    onChange={handleFilterOrganizationChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Organisasi</option>
                    {organizations
                      .filter((org) => org.level?.slug === "pc")
                      .map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.nama}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Filter Dari Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  DARI TANGGAL
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                />
              </div>

              {/* Filter Sampai Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  SAMPAI TANGGAL
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Filter
                </button>
              </div>
            )}
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

            <div
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${
                isFetching ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      {isSuperAdmin && (
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Organisasi
                        </th>
                      )}
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Tema
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tahun
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tanggal Mulai
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tanggal Selesai
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status Program
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status Aktif
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {themes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isSuperAdmin ? 9 : 8}
                          className="px-6 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FolderTree className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">
                              Tidak ada data tema program
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={handleResetFilters}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                              >
                                Reset Filter
                              </button>
                            )}
                            {!hasActiveFilters && (
                              <button
                                onClick={handleOpenCreateModal}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Tema Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      themes.map((theme) => {
                        const dateStatus = getDateStatus(
                          theme.tanggal_mulai,
                          theme.tanggal_selesai
                        );
                        const statistics = theme.statistics || {};
                        const isExpanded = expandedThemeId === theme.id;

                        return (
                          <React.Fragment key={theme.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-200">
                              {isSuperAdmin && (
                                <td className="text-center px-6 py-4">
                                  <span className="text-sm text-gray-600">
                                    {theme.organization?.nama || "-"}
                                  </span>
                                </td>
                              )}
                              <td className="text-center px-6 py-4">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {theme.nama}
                                  </p>
                                  {theme.deskripsi && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {theme.deskripsi}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-semibold text-sm">
                                  {theme.tahun || "-"}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="text-sm text-gray-600">
                                  {formatDate(theme.tanggal_mulai)}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="text-sm text-gray-600">
                                  {formatDate(theme.tanggal_selesai)}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${dateStatus.color}`}
                                >
                                  {dateStatus.label}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                {getStatusBadgeTheme(theme.is_active, theme)}
                              </td>
                              <td className="text-center px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenViewModal(theme)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Detail"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditModal(theme)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                    title="Edit"
                                    disabled={isDeleting}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTheme(theme)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Hapus"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                  {statistics.organizations_status &&
                                    statistics.organizations_status.length > 0 && (
                                      <button
                                        onClick={() => toggleExpand(theme.id)}
                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                        title={
                                          isExpanded
                                            ? "Sembunyikan"
                                            : "Lihat Status MWC"
                                        }
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
                              <ProgramThemesDetail
                                statistics={statistics}
                                isSuperAdmin={isSuperAdmin}
                                formatDate={formatDate}
                                onOpenActivity={handleOpenActivityDetail}
                                onOpenActivityList={handleOpenActivityList}
                              />
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
          {!isFetching && totalPages > 1 && themes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-500 order-2 sm:order-1">
                Menampilkan {(currentPage - 1) * perPage + 1} -{" "}
                {Math.min(currentPage * perPage, totalThemes)} dari{" "}
                {totalThemes} data
              </div>
              <div className="flex gap-2 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                            currentPage === pageNum
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <ProgramThemesForm
        isOpen={isModalOpen}
        mode={modalMode}
        selectedTheme={selectedTheme}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        organizations={organizations}
        isSubmitting={isSubmitting}
        isCreating={isCreating}
        isUpdating={isUpdating}
        isSuperAdmin={isSuperAdmin}
        isManualOverride={isManualOverride}
        setIsManualOverride={setIsManualOverride}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formatDate={formatDate}
        getDateStatus={getDateStatus}
        getStatusBadgeTheme={getStatusBadgeTheme}
        getAutoStatus={getAutoStatus}
      />

      {/* Activity List Modal */}
      <ProgramThemesActivityList
        isOpen={isActivityListOpen}
        mwcName={activityListData.mwcName}
        activities={activityListData.activities}
        onClose={handleCloseActivityList}
        onSelectActivity={handleOpenActivityDetail}
        formatDate={formatDate}
      />

      {/* Activity Detail Modal */}
      <ProgramThemesDetailActivity
        isOpen={isActivityDetailOpen}
        activityId={selectedActivityId}
        activityData={selectedActivityData}
        onClose={handleCloseActivityDetail}
        formatDate={formatDate}
        error={error}
      />
    </MainLayout>
  );
};

export default ProgramThemes;