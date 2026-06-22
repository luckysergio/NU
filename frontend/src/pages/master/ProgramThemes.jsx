import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  FolderTree,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  User,
  FileText,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import programThemeService from "../../services/programThemeService";
import { organizationService } from "../../services/organization";

const ProgramThemes = () => {
  const { user: currentUser } = useAuth();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThemes, setTotalThemes] = useState(0);
  const [perPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [expandedThemeId, setExpandedThemeId] = useState(null);

  const userRole = currentUser?.role?.slug;
  const isSuperAdmin = userRole === "super-admin";

  // Form state
  const [formData, setFormData] = useState({
    organization_id: "",
    nama: "",
    deskripsi: "",
    periode: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const { success, error, warning } = useModal();

  // Fetch organizations for filter (only for super admin)
  const fetchOrganizations = async () => {
    if (!isSuperAdmin) return;
    try {
      const result = await organizationService.getAll({ per_page: 1000 });
      if (result.success) {
        setOrganizations(result.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Helper function to calculate auto status based on dates
  const getAutoStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return today >= start && today <= end;
  };

  // Auto-update is_active when dates change (if not manually overridden)
  useEffect(() => {
    if (formData.tanggal_mulai && formData.tanggal_selesai && !isManualOverride) {
      const autoActive = getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai);
      if (autoActive !== formData.is_active) {
        setFormData(prev => ({ ...prev, is_active: autoActive }));
      }
    }
  }, [formData.tanggal_mulai, formData.tanggal_selesai, isManualOverride]);

  // Fetch themes
  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
      };
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (filterOrganization) params.organization_id = filterOrganization;
      
      const result = await programThemeService.getProgramThemes(params);

      if (result.success) {
        setThemes(result.data.data || []);
        setTotalPages(result.data.last_page || 1);
        setTotalThemes(result.data.total || 0);
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat mengambil数据");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, startDate, endDate, filterOrganization, error]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
    setSearchTerm("");
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
      periode: "",
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
      periode: theme.periode || "",
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

  const handleDeleteTheme = (theme) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus tema program "${theme.nama}"?`,
      async () => {
        setDeletingId(theme.id);
        try {
          const result = await programThemeService.deleteProgramTheme(theme.id);
          if (result.success) {
            success("Berhasil", result.message);
            fetchThemes();
          } else {
            error("Gagal", result.message);
          }
        } catch (err) {
          error("Gagal", "Terjadi kesalahan saat menghapus data");
        } finally {
          setDeletingId(null);
        }
      },
    );
  };

  const validateForm = () => {
    const errors = {};
    if (isSuperAdmin && !formData.organization_id) {
      errors.organization_id = "Organisasi wajib dipilih";
    }
    if (!formData.nama) errors.nama = "Nama tema wajib diisi";
    if (!formData.tanggal_mulai)
      errors.tanggal_mulai = "Tanggal mulai wajib diisi";
    if (!formData.tanggal_selesai)
      errors.tanggal_selesai = "Tanggal selesai wajib diisi";

    if (formData.tanggal_mulai && formData.tanggal_selesai) {
      if (
        new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)
      ) {
        errors.tanggal_selesai =
          "Tanggal selesai harus setelah atau sama dengan tanggal mulai";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let result;
      if (modalMode === "create") {
        result = await programThemeService.createProgramTheme(formData);
      } else {
        result = await programThemeService.updateProgramTheme(
          selectedTheme.id,
          formData,
        );
      }

      if (result.success) {
        success("Berhasil", result.message);
        setIsModalOpen(false);
        fetchThemes();
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
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

  const getStatusBadge = (isActive, theme = null) => {
    if (isActive) {
      const isAutoActive = theme && getAutoStatus(theme.tanggal_mulai, theme.tanggal_selesai);
      const isManuallyActive = theme && theme.is_active === true && !isAutoActive;
      
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            Aktif
          </span>
          {isManuallyActive && (
            <span className="text-xs text-blue-500">(Manual)</span>
          )}
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

  const hasActiveFilters = searchTerm || startDate || endDate || filterOrganization;

  if (loading && themes.length === 0) {
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
                <FolderTree className="w-8 h-8 text-emerald-600" />
                Tema Program
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

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      {organizations.filter(org => org.level?.slug === "pc").map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    DARI TANGGAL
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    SAMPAI TANGGAL
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  />
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={handleResetFilters}
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
                      {isSuperAdmin && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>}
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Tema</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Mulai</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Selesai</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Program</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Aktif</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {themes.length === 0 ? (
                      <tr>
                        <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <FolderTree className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data tema program</p>
                            <button
                              onClick={handleOpenCreateModal}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Tema Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      themes.map((theme, index) => {
                        const dateStatus = getDateStatus(
                          theme.tanggal_mulai,
                          theme.tanggal_selesai,
                        );
                        const statistics = theme.statistics || {};
                        const isExpanded = expandedThemeId === theme.id;
                        
                        // Sort organizations: yang sudah membuat (has_work_program = true) di atas, lalu urut abjad
                        const sortedOrganizations = [...(statistics.organizations_status || [])].sort((a, b) => {
                          if (a.has_work_program !== b.has_work_program) {
                            return a.has_work_program ? -1 : 1;
                          }
                          return a.nama.localeCompare(b.nama);
                        });
                        
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
                                <span className="text-sm text-gray-600">
                                  {theme.periode || "-"}
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
                                <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${dateStatus.color}`}>
                                  {dateStatus.label}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                {getStatusBadge(theme.is_active, theme)}
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
                                    disabled={deletingId === theme.id}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTheme(theme)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Hapus"
                                    disabled={deletingId === theme.id}
                                  >
                                    {deletingId === theme.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                  {statistics.organizations_status && statistics.organizations_status.length > 0 && (
                                    <button
                                      onClick={() => toggleExpand(theme.id)}
                                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                                      title={isExpanded ? "Sembunyikan" : "Lihat Status MWC"}
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row for MWC Statistics */}
                            {isExpanded && statistics.organizations_status && statistics.organizations_status.length > 0 && (
                              <tr className="bg-gray-50">
                                <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-4">
                                  <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-emerald-600" />
                                      Status Program Kerja per MWC
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full min-w-125">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">No</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Nama MWC</th>
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Jumlah Proker</th>
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Jumlah Kegiatan</th>
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {sortedOrganizations.map((org, idx) => (
                                            <tr key={org.id} className="hover:bg-gray-100">
                                              <td className="text-center px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                                              <td className="text-left px-4 py-3 text-sm font-medium text-gray-800">{org.nama}</td>
                                              <td className="text-center px-4 py-3 text-sm text-gray-600">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                                                  org.work_program_count > 0 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                  {org.work_program_count}
                                                </span>
                                              </td>
                                              <td className="text-center px-4 py-3 text-sm text-gray-600">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                                                  org.activities_count > 0 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                  {org.activities_count}
                                                </span>
                                              </td>
                                              <td className="text-center px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                  org.has_work_program 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                  {org.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                          <tr>
                                            <td colSpan={2} className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Total:</td>
                                            <td className="text-center px-4 py-3 text-sm font-semibold text-emerald-600">
                                              {statistics.total_work_programs || 0}
                                            </td>
                                            <td className="text-center px-4 py-3 text-sm font-semibold text-blue-600">
                                              {statistics.total_activities || 0}
                                            </td>
                                            <td></td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
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
                {Math.min(currentPage * perPage, totalThemes)} dari{" "}
                {totalThemes} data
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-md"
                            : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form - Rapi dan Modern */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === "create" && "Tambah Tema Program"}
                    {modalMode === "edit" && "Edit Tema Program"}
                    {modalMode === "view" && "Detail Tema Program"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    {modalMode === "create" && "Isi form untuk menambahkan tema program baru"}
                    {modalMode === "edit" && "Ubah data tema program yang sudah ada"}
                    {modalMode === "view" && "Informasi lengkap tema program"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalMode === "view" ? (
                // View Mode - Clean and Organized
                <div className="p-6">
                  {/* Header Section with Icon */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderTree className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedTheme?.nama}
                    </h3>
                    {selectedTheme?.periode && (
                      <p className="text-sm text-gray-500 mt-1">
                        Periode: {selectedTheme.periode}
                      </p>
                    )}
                  </div>

                  {/* Information Grid */}
                  <div className="space-y-4">
                    {/* Organization Info */}
                    {isSuperAdmin && selectedTheme?.organization && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Organisasi</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {selectedTheme.organization.nama}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deskripsi</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedTheme?.deskripsi || "Tidak ada deskripsi"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tanggal Mulai</p>
                        <p className="text-base font-semibold text-gray-800">
                          {formatDate(selectedTheme?.tanggal_mulai)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tanggal Selesai</p>
                        <p className="text-base font-semibold text-gray-800">
                          {formatDate(selectedTheme?.tanggal_selesai)}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status Program</p>
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium ${getDateStatus(selectedTheme?.tanggal_mulai, selectedTheme?.tanggal_selesai).color}`}>
                          {getDateStatus(selectedTheme?.tanggal_mulai, selectedTheme?.tanggal_selesai).label}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status Aktif</p>
                        {getStatusBadge(selectedTheme?.is_active, selectedTheme)}
                      </div>
                    </div>

                    {/* Statistics Section */}
                    {selectedTheme?.statistics && selectedTheme.statistics.organizations_status && selectedTheme.statistics.organizations_status.length > 0 && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Statistik Program Kerja per MWC
                        </p>
                        <div className="space-y-3">
                          {selectedTheme.statistics.organizations_status.map((org, idx) => (
                            <div key={org.id} className="flex items-center justify-between py-2 border-b border-emerald-200 last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{org.nama}</p>
                                <p className="text-xs text-gray-500">MWC</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-center min-w-12.5">
                                  <p className="text-xs text-gray-500">Proker</p>
                                  <p className={`text-sm font-semibold ${org.work_program_count > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                    {org.work_program_count}
                                  </p>
                                </div>
                                <div className="text-center min-w-15">
                                  <p className="text-xs text-gray-500">Kegiatan</p>
                                  <p className={`text-sm font-semibold ${org.activities_count > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {org.activities_count}
                                  </p>
                                </div>
                                <div>
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    org.has_work_program 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {org.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-emerald-200">
                            <p className="text-sm font-semibold text-gray-700">Total:</p>
                            <div className="flex items-center gap-4">
                              <p className="text-sm font-semibold text-emerald-600">{selectedTheme.statistics.total_work_programs || 0} Proker</p>
                              <p className="text-sm font-semibold text-blue-600">{selectedTheme.statistics.total_activities || 0} Kegiatan</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Creator Info */}
                    {selectedTheme?.creator && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Dibuat Oleh</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {selectedTheme.creator.name}
                              </p>
                            </div>
                          </div>
                          {selectedTheme?.created_at && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Dibuat pada</p>
                              <p className="text-xs text-gray-600">
                                {new Date(selectedTheme.created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Create/Edit Mode Form
                <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-5">
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Organisasi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.organization_id}
                        onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                          formErrors.organization_id ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                        }`}
                        disabled={isSubmitting}
                      >
                        <option value="">Pilih Organisasi</option>
                        {organizations.filter(org => org.level?.slug === "pc").map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                          </option>
                        ))}
                      </select>
                      {formErrors.organization_id && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {formErrors.organization_id}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Tema <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                        formErrors.nama ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                      }`}
                      placeholder="Masukkan nama tema"
                      disabled={isSubmitting}
                    />
                    {formErrors.nama && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {formErrors.nama}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Periode <span className="text-gray-400 text-xs">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                      placeholder="Contoh: 2024/2025"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deskripsi <span className="text-gray-400 text-xs">(opsional)</span>
                    </label>
                    <textarea
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 resize-none bg-white"
                      placeholder="Masukkan deskripsi tema"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tanggal Mulai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal_mulai}
                        onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                          formErrors.tanggal_mulai ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.tanggal_mulai && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {formErrors.tanggal_mulai}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tanggal Selesai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal_selesai}
                        onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                          formErrors.tanggal_selesai ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.tanggal_selesai && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {formErrors.tanggal_selesai}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => {
                            setFormData({ ...formData, is_active: e.target.checked });
                            setIsManualOverride(true);
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Status Aktif</span>
                      </label>
                      
                      {formData.tanggal_mulai && formData.tanggal_selesai && (
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className="inline-flex items-center gap-1">
                            {getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai) ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            Otomatis: {getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai) ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {isManualOverride && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Status sedang diatur secara manual. Centang/hapus centang untuk mengubah.
                        </p>
                      </div>
                    )}
                    
                    {!isManualOverride && formData.tanggal_mulai && formData.tanggal_selesai && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Status diatur otomatis berdasarkan tanggal. Centang kotak untuk mengatur manual.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Information Box */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-semibold mb-1">Informasi:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Status aktif akan diatur otomatis berdasarkan tanggal</li>
                          <li>Anda dapat mengesampingkan status otomatis dengan mencentang/menghapus centang</li>
                          <li>Hanya tema yang aktif yang bisa dipilih untuk program kerja</li>
                          <li>Tema yang sudah memiliki program kerja tidak dapat dihapus</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                {modalMode === "view" ? "Tutup" : "Batal"}
              </button>
              {modalMode !== "view" && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : modalMode === "create" ? (
                    "Simpan"
                  ) : (
                    "Update"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProgramThemes;