import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Briefcase,
  Calendar,
  Building2,
  FolderTree,
  AlertCircle,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  Target,
  Flag,
  Layers,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Paperclip,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import workProgramService from "../../services/workProgramService";
import programMasterService from "../../services/programMasterService";
import { activityService } from "../../services/activityService";
import { getStoragePath, getPhotoUrl } from "../../utils/storageUrl";

const WorkPrograms = () => {
  const { user: currentUser } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [expandedProgramId, setExpandedProgramId] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isThemeDetailModalOpen, setIsThemeDetailModalOpen] = useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState(null);
  const [isActivityDetailModalOpen, setIsActivityDetailModalOpen] = useState(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama_kegiatan: "",
    tanggal_pelaksanaan: "",
    total_pengeluaran: "",
    catatan: "",
    deskripsi: "",
    expense_descriptions: [],
  });
  const [editPhotos, setEditPhotos] = useState([]);
  const [editExpensePhotos, setEditExpensePhotos] = useState([]);
  const [editAttendanceFiles, setEditAttendanceFiles] = useState([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState([]);
  const [editExpensePhotoPreviews, setEditExpensePhotoPreviews] = useState([]);
  const [editAttendanceFileNames, setEditAttendanceFileNames] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // State untuk tema tersedia
  const [availableThemes, setAvailableThemes] = useState([]);
  const [availableThemeOptions, setAvailableThemeOptions] = useState([]);
  const [themesStats, setThemesStats] = useState({
    total_themes: 0,
    used_themes: 0,
    available_count: 0,
    organization_id: null,
  });
  const [loadingThemes, setLoadingThemes] = useState(false);

  // Master data
  const [themes, setThemes] = useState([]);
  const [fields, setFields] = useState([]);
  const [targets, setTargets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [mwcOrganizations, setMwcOrganizations] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    organization_id: "",
    theme_id: "",
    field_id: "",
    target_id: "",
    goal_id: "",
    nama_program: "",
    deskripsi: "",
    tahun: new Date().getFullYear(),
    status: "draft",
  });
  const [formErrors, setFormErrors] = useState({});

  const { success, error, warning } = useModal();

  // Cek role dan level user
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

  const getUserOrganizationId = () => {
    if (currentUser?.organization?.id) return currentUser.organization.id;
    if (currentUser?.organization_id) return currentUser.organization_id;
    return null;
  };

  const userOrganizationId = getUserOrganizationId();
  const userOrganizationName = currentUser?.organization?.nama;

  // Helper function untuk mendapatkan URL gambar yang benar
  const getImageUrl = (path) => {
    if (!path) return "";
    return getStoragePath(path);
  };

  // Fetch available themes untuk MWC - hanya tema aktif
  const fetchAvailableThemes = useCallback(async () => {
    if (!isMWC) return;

    setLoadingThemes(true);
    try {
      const result = await workProgramService.getAvailableThemesForMWC();

      if (result.success && result.data) {
        const available = (result.data.available_themes || []).filter(theme => theme.is_active === true);
        setAvailableThemes(available);
        setAvailableThemeOptions(available);
        
        setThemesStats({
          total_themes: result.data.total_themes || 0,
          used_themes: result.data.used_themes || 0,
          available_count: result.data.available_count || 0,
          organization_id: result.data.organization_id || null,
        });
      }
    } catch (err) {
      console.error("Error fetching available themes:", err);
    } finally {
      setLoadingThemes(false);
    }
  }, [isMWC]);

  // Fetch master data with error handling
  const fetchMasterData = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      let themesData = [];
      try {
        const themesResult = await programMasterService.getActiveThemes();
        themesData = Array.isArray(themesResult) ? themesResult : [];
      } catch (err) {
        console.error("Error fetching themes:", err);
        themesData = [];
      }

      let fieldsData = [];
      try {
        const fieldsResult = await programMasterService.getFields({ per_page: 100, is_active: true });
        fieldsData = Array.isArray(fieldsResult) ? fieldsResult : [];
      } catch (err) {
        console.error("Error fetching fields:", err);
        fieldsData = [];
      }

      let targetsData = [];
      try {
        const targetsResult = await programMasterService.getTargets({ per_page: 100, is_active: true });
        targetsData = Array.isArray(targetsResult) ? targetsResult : [];
      } catch (err) {
        console.error("Error fetching targets:", err);
        targetsData = [];
      }

      let goalsData = [];
      try {
        const goalsResult = await programMasterService.getGoals({ per_page: 100, is_active: true });
        goalsData = Array.isArray(goalsResult) ? goalsResult : [];
      } catch (err) {
        console.error("Error fetching goals:", err);
        goalsData = [];
      }

      let orgsData = [];
      try {
        const orgsResult = await programMasterService.getOrganizations({ per_page: 1000 });
        orgsData = Array.isArray(orgsResult) ? orgsResult : [];
      } catch (err) {
        console.error("Error fetching organizations:", err);
        orgsData = [];
      }

      const activeThemes = themesData.filter(theme => theme.is_active === true);
      setThemes(activeThemes);
      setFields(fieldsData);
      setTargets(targetsData);
      setGoals(goalsData);

      let accessibleOrgs = [];
      let mwcOrgs = [];

      if (isSuperAdmin) {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter(org => org.level?.slug === "mwc");
      } else if (isPC) {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter(org => 
          org.level?.slug === "mwc" && org.parent_id === userOrganizationId
        );
      } else if (isRestrictedLevel && userOrganizationId) {
        accessibleOrgs = orgsData.filter((org) => org.id === userOrganizationId);
        if (accessibleOrgs.length === 0 && currentUser?.organization) {
          accessibleOrgs = [currentUser.organization];
        }
        mwcOrgs = accessibleOrgs.filter(org => org.level?.slug === "mwc");
      } else {
        accessibleOrgs = orgsData;
        mwcOrgs = accessibleOrgs.filter(org => org.level?.slug === "mwc");
      }

      setOrganizations(accessibleOrgs);
      setMwcOrganizations(mwcOrgs);
      setInitialLoading(false);
    } catch (err) {
      console.error("Error fetching master data:", err);
      error("Gagal", "Terjadi kesalahan saat memuat data master");
      setInitialLoading(false);
    } finally {
      setIsFetching(false);
    }
  }, [isRestrictedLevel, userOrganizationId, isSuperAdmin, isPC, currentUser, error]);

  // Fetch programs
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
      };

      if (isPC && filterOrganization) {
        params.organization_id = filterOrganization;
      }
      if (filterStatus) params.status = filterStatus;

      const result = await workProgramService.getWorkPrograms(params);

      if (result.success) {
        setPrograms(result.data.data || []);
        setTotalPages(result.data.last_page || 1);
        setTotalPrograms(result.data.total || 0);

        if (isMWC) {
          await fetchAvailableThemes();
        }
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    perPage,
    searchTerm,
    filterOrganization,
    filterStatus,
    error,
    isMWC,
    isPC,
    fetchAvailableThemes,
  ]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchPrograms();
    }
  }, [fetchPrograms, initialLoading]);

  useEffect(() => {
    if (isMWC && !initialLoading) {
      fetchAvailableThemes();
    }
  }, [isMWC, initialLoading, fetchAvailableThemes]);

  const toggleExpand = (programId) => {
    setExpandedProgramId(expandedProgramId === programId ? null : programId);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterOrganization = (e) => {
    setFilterOrganization(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterOrganization("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  const getDefaultOrganizationId = () => {
    if (selectedProgram && selectedProgram.organization_id) {
      return selectedProgram.organization_id.toString();
    }

    if (isRestrictedLevel && userOrganizationId) {
      return userOrganizationId.toString();
    }

    if (shouldAutoSelectOrg && userOrganizationId) {
      return userOrganizationId.toString();
    }

    if (organizations.length === 1 && organizations[0]?.id) {
      return organizations[0].id.toString();
    }

    return "";
  };

  const resetForm = () => {
    const defaultOrgId = getDefaultOrganizationId();

    setFormData({
      organization_id: defaultOrgId,
      theme_id: "",
      field_id: "",
      target_id: "",
      goal_id: "",
      nama_program: "",
      deskripsi: "",
      tahun: new Date().getFullYear(),
      status: "draft",
    });
    setFormErrors({});
  };

  const handleOpenCreateModal = (preSelectedThemeId = null) => {
    setModalMode("create");
    setSelectedProgram(null);
    resetForm();
    if (preSelectedThemeId) {
      setFormData(prev => ({ ...prev, theme_id: preSelectedThemeId.toString() }));
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (program) => {
    setModalMode("edit");
    setSelectedProgram(program);
    setFormData({
      organization_id: program.organization_id?.toString() || "",
      theme_id: program.theme_id?.toString() || "",
      field_id: program.field_id?.toString() || "",
      target_id: program.target_id?.toString() || "",
      goal_id: program.goal_id?.toString() || "",
      nama_program: program.nama_program,
      deskripsi: program.deskripsi || "",
      tahun: program.tahun,
      status: program.status,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenViewModal = async (program) => {
    setModalMode("view");
    setSelectedProgram(program);
    
    try {
      const result = await activityService.getAll({ work_program_id: program.id, per_page: 100 });
      if (result.success && result.data.data) {
        const programWithActivities = { ...program, activities: result.data.data };
        setSelectedProgram(programWithActivities);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
    
    setIsModalOpen(true);
  };

  const handleOpenActivityDetail = (activity) => {
    setSelectedActivityDetail(activity);
    setIsActivityDetailModalOpen(true);
  };

  const handleOpenEditActivityModal = (activity) => {
    setEditingActivity(activity);
    setEditFormData({
      nama_kegiatan: activity.nama_kegiatan || "",
      tanggal_pelaksanaan: activity.tanggal_pelaksanaan || "",
      total_pengeluaran: activity.total_pengeluaran || "",
      catatan: activity.catatan || "",
      deskripsi: activity.deskripsi || "",
      expense_descriptions: activity.expense_descriptions || [],
    });
    setEditPhotos([]);
    setEditExpensePhotos([]);
    setEditAttendanceFiles([]);
    setEditPhotoPreviews([]);
    setEditExpensePhotoPreviews([]);
    setEditAttendanceFileNames([]);
    setIsEditActivityModalOpen(true);
  };

  const handleEditActivitySubmit = async () => {
    setEditSubmitting(true);
    
    const submitData = new FormData();
    submitData.append("nama_kegiatan", editFormData.nama_kegiatan);
    submitData.append("tanggal_pelaksanaan", editFormData.tanggal_pelaksanaan);
    submitData.append("total_pengeluaran", editFormData.total_pengeluaran);
    if (editFormData.catatan) submitData.append("catatan", editFormData.catatan);
    if (editFormData.deskripsi) submitData.append("deskripsi", editFormData.deskripsi);
    submitData.append("expense_descriptions", JSON.stringify(editFormData.expense_descriptions));
    
    editPhotos.forEach(photo => submitData.append("photos[]", photo));
    editExpensePhotos.forEach(photo => submitData.append("expense_photos[]", photo));
    editAttendanceFiles.forEach(file => submitData.append("attendance_files[]", file));

    try {
      const result = await activityService.update(editingActivity.id, submitData);
      if (result.success) {
        success("Berhasil", "Kegiatan berhasil diperbarui");
        setIsEditActivityModalOpen(false);
        // Refresh data
        if (selectedProgram) {
          const refreshResult = await activityService.getAll({ work_program_id: selectedProgram.id, per_page: 100 });
          if (refreshResult.success && refreshResult.data.data) {
            setSelectedProgram({ ...selectedProgram, activities: refreshResult.data.data });
          }
        }
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat menyimpan data");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProgram = (program) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus program kerja "${program.nama_program}"?`,
      async () => {
        setDeletingId(program.id);
        try {
          const result = await workProgramService.deleteWorkProgram(program.id);
          if (result.success) {
            success("Berhasil", result.message);
            fetchPrograms();
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

  const handleOpenThemeDetail = (theme) => {
    setSelectedTheme(theme);
    setIsThemeDetailModalOpen(true);
  };

  const handleEditFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "photos") {
      setEditPhotos(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setEditPhotoPreviews(prev => [...prev, ...previews]);
    } else if (type === "expense_photos") {
      setEditExpensePhotos(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setEditExpensePhotoPreviews(prev => [...prev, ...previews]);
    } else if (type === "attendance_files") {
      setEditAttendanceFiles(prev => [...prev, ...files]);
      const names = files.map(file => file.name);
      setEditAttendanceFileNames(prev => [...prev, ...names]);
    }
  };

  const handleEditRemoveFile = (index, type) => {
    if (type === "photos") {
      URL.revokeObjectURL(editPhotoPreviews[index]);
      setEditPhotos(prev => prev.filter((_, i) => i !== index));
      setEditPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    } else if (type === "expense_photos") {
      URL.revokeObjectURL(editExpensePhotoPreviews[index]);
      setEditExpensePhotos(prev => prev.filter((_, i) => i !== index));
      setEditExpensePhotoPreviews(prev => prev.filter((_, i) => i !== index));
    } else if (type === "attendance_files") {
      setEditAttendanceFiles(prev => prev.filter((_, i) => i !== index));
      setEditAttendanceFileNames(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addExpenseDescription = () => {
    setEditFormData(prev => ({
      ...prev,
      expense_descriptions: [...prev.expense_descriptions, { description: "", amount: 0 }]
    }));
  };

  const updateExpenseDescription = (index, field, value) => {
    const updated = [...editFormData.expense_descriptions];
    updated[index][field] = field === "amount" ? parseInt(value) || 0 : value;
    setEditFormData(prev => ({ ...prev, expense_descriptions: updated }));
  };

  const removeExpenseDescription = (index) => {
    setEditFormData(prev => ({
      ...prev,
      expense_descriptions: prev.expense_descriptions.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};

    let orgId = formData.organization_id;
    if (
      (isRestrictedLevel || shouldAutoSelectOrg) &&
      userOrganizationId &&
      !orgId
    ) {
      orgId = userOrganizationId.toString();
      setFormData((prev) => ({ ...prev, organization_id: orgId }));
    }

    if (!orgId) {
      errors.organization_id = "Organisasi wajib dipilih";
    }
    if (!formData.field_id) {
      errors.field_id = "Bidang program wajib dipilih";
    }
    if (!formData.target_id) {
      errors.target_id = "Sasaran program wajib dipilih";
    }
    if (!formData.goal_id) {
      errors.goal_id = "Tujuan program wajib dipilih";
    }
    if (!formData.nama_program?.trim()) {
      errors.nama_program = "Nama program wajib diisi";
    }
    if (!formData.tahun) {
      errors.tahun = "Tahun wajib diisi";
    }

    if (isMWC && formData.theme_id && modalMode === "create") {
      const themeId = parseInt(formData.theme_id);
      const isThemeAvailable = availableThemeOptions.some(
        (t) => t.id === themeId,
      );
      if (!isThemeAvailable) {
        errors.theme_id = "Tema ini sudah digunakan. Silakan pilih tema lain.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    let submitData = { ...formData };

    if (
      (isRestrictedLevel || shouldAutoSelectOrg) &&
      userOrganizationId &&
      !submitData.organization_id
    ) {
      submitData.organization_id = userOrganizationId.toString();
      setFormData((prev) => ({
        ...prev,
        organization_id: submitData.organization_id,
      }));
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    if (submitData.theme_id === "" || submitData.theme_id === null) {
      submitData.theme_id = null;
    }

    try {
      let result;
      if (modalMode === "create") {
        result = await workProgramService.createWorkProgram(submitData);
      } else {
        result = await workProgramService.updateWorkProgram(
          selectedProgram.id,
          submitData,
        );
      }

      if (result.success) {
        success("Berhasil", result.message);
        setIsModalOpen(false);
        fetchPrograms();
      } else {
        if (result.message) {
          error("Gagal", result.message);
        } else {
          error("Gagal", "Terjadi kesalahan saat menyimpan data");
        }
      }
    } catch (err) {
      error("Gagal", err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    let badgeClass = "";
    let badgeText = "";

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
      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
        {badgeText}
      </span>
    );
  };

  const getLevelDisplay = () => {
    if (isMWC) return "MWC";
    if (isRanting) return "Ranting";
    if (isPC) return "PC";
    return "";
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    if (!number) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(number));
  };

  const handleRupiahChange = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    setter(value);
  };

  const hasActiveFilters = searchTerm || filterOrganization || filterStatus;

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
                <Briefcase className="w-8 h-8 text-emerald-600" />
                Program Kerja {getLevelDisplay()}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola program kerja {getLevelDisplay()}
                {hasOrganization && userOrganizationName && ` - ${userOrganizationName}`}
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateModal()}
              disabled={fields.length === 0 || targets.length === 0 || goals.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Tambah Program
            </button>
          </div>

          {/* Available Themes Section - Hanya untuk MWC */}
          {isMWC && (
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-200">
                  <FolderTree className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-emerald-800">Tema Tersedia</h2>
                </div>

                {loadingThemes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-emerald-600">Memuat tema tersedia...</span>
                  </div>
                ) : availableThemes.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-700 font-medium text-sm">Semua tema aktif sudah digunakan</p>
                    <p className="text-emerald-500 text-xs mt-0.5">Anda telah membuat program kerja untuk semua tema aktif yang tersedia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableThemes.map((theme) => (
                      <div key={theme.id} className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-md transition-all duration-200 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">{theme.nama}</h3>
                          {theme.deskripsi && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{theme.deskripsi}</p>
                          )}
                          {theme.tanggal_mulai && theme.tanggal_selesai && (
                            <p className="text-xs text-emerald-600 mb-2">
                              Periode: {formatDate(theme.tanggal_mulai)} - {formatDate(theme.tanggal_selesai)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleOpenCreateModal(theme.id)}
                            className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Buat Program
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {themesStats.total_themes > 0 && availableThemes.length === 0 && (
                  <div className="mt-3 pt-2 border-t border-emerald-200">
                    <div className="flex justify-between text-xs text-emerald-600 mb-1">
                      <span>Progress penggunaan tema aktif</span>
                      <span>{themesStats.used_themes} / {themesStats.total_themes} tema digunakan</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(themesStats.used_themes / themesStats.total_themes) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isPC && mwcOrganizations.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      ORGANISASI (MWC)
                    </label>
                    <select
                      value={filterOrganization}
                      onChange={handleFilterOrganization}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua MWC</option>
                      {mwcOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.nama}</option>
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
                    onChange={handleFilterStatus}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
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
                    onChange={handlePerPageChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </select>
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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Program</th>
                      {isPC && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">MWC</th>}
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tema</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tahun</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Bidang</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jml Kegiatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {programs.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={isPC ? 9 : 8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Briefcase className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data program kerja</p>
                            <button onClick={() => handleOpenCreateModal()} className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium">
                              + Tambah Program Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      programs.map((program) => {
                        const statistics = program.statistics || {};
                        const isExpanded = expandedProgramId === program.id;
                        const rantingStatus = statistics.ranting_status || [];
                        const mwcName = program.organization?.nama || "-";
                        
                        const sortedRanting = [...rantingStatus].sort((a, b) => {
                          if (a.has_activities !== b.has_activities) return a.has_activities ? -1 : 1;
                          return a.nama.localeCompare(b.nama);
                        });
                        
                        return (
                          <React.Fragment key={program.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="text-center px-6 py-4">
                                <div className="font-semibold text-gray-800">{program.nama_program}</div>
                              </td>
                              {isPC && (
                                <td className="text-center px-6 py-4">
                                  <span className="text-sm font-medium text-gray-800">{mwcName}</span>
                                </td>
                              )}
                              <td className="text-center px-6 py-4">
                                <span className="text-sm text-gray-600">{program.theme?.nama || "-"}</span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="text-sm text-gray-600">{program.tahun}</span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="text-sm text-gray-600">{program.field?.nama || "-"}</span>
                              </td>
                              <td className="text-center px-6 py-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                  {statistics.total_activities || 0}
                                </span>
                              </td>
                              <td className="text-center px-6 py-4">
                                {renderStatusBadge(program.status)}
                              </td>
                              <td className="text-center px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleOpenViewModal(program)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleOpenEditModal(program)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit" disabled={deletingId === program.id}>
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteProgram(program)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus" disabled={deletingId === program.id}>
                                    {deletingId === program.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                  {rantingStatus.length > 0 && (
                                    <button onClick={() => toggleExpand(program.id)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title={isExpanded ? "Sembunyikan" : "Lihat Status Ranting"}>
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          
                            {isExpanded && (
                              <tr className="bg-gray-50">
                                <td colSpan={isPC ? 9 : 8} className="px-6 py-4">
                                  <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-emerald-600" />
                                      Status Kegiatan Program Kerja
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full min-w-125">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">No</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Organisasi</th>
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Jumlah Kegiatan</th>
                                            <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          <tr className="hover:bg-gray-100 bg-emerald-50/30">
                                            <td className="text-center px-4 py-3 text-sm text-gray-600">1</td>
                                            <td className="text-left px-4 py-3 text-sm font-semibold text-emerald-700">
                                              {program.organization?.nama || "-"} (MWC)
                                            </td>
                                            <td className="text-center px-4 py-3 text-sm">
                                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                                                program.mwc_activities_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                              }`}>
                                                {program.mwc_activities_count || 0}
                                              </span>
                                            </td>
                                            <td className="text-center px-4 py-3">
                                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                program.mwc_activities_count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                {program.mwc_activities_count > 0 ? 'SUDAH ADA KEGIATAN' : 'BELUM ADA KEGIATAN'}
                                              </span>
                                            </td>
                                          </tr>
                                          
                                          {sortedRanting.map((ranting, idx) => (
                                            <tr key={ranting.id} className="hover:bg-gray-100">
                                              <td className="text-center px-4 py-3 text-sm text-gray-600">{idx + 2}</td>
                                              <td className="text-left px-4 py-3 text-sm text-gray-800">{ranting.nama}</td>
                                              <td className="text-center px-4 py-3 text-sm">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                                                  ranting.activities_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                  {ranting.activities_count}
                                                </span>
                                              </td>
                                              <td className="text-center px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                  ranting.has_activities ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                  {ranting.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                          <tr>
                                            <td colSpan={2} className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Total Semua Kegiatan:</td>
                                            <td className="text-center px-4 py-3 text-sm font-semibold text-blue-600">
                                              {(program.mwc_activities_count || 0) + (statistics.total_ranting_activities || 0)}
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
                Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalPrograms)} dari {totalPrograms} data
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-9 h-9 rounded-xl font-medium transition-all duration-200 ${
                        currentPage === pageNum ? "bg-emerald-600 text-white shadow-md" : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form for Program */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === "create" && "Tambah Program Kerja"}
                    {modalMode === "edit" && "Edit Program Kerja"}
                    {modalMode === "view" && "Detail Program Kerja"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {modalMode === "create" && "Isi form berikut untuk menambahkan program kerja baru"}
                    {modalMode === "edit" && "Ubah data program kerja"}
                    {modalMode === "view" && "Informasi lengkap program kerja"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {modalMode === "view" ? (
                <div className="space-y-6">
                  {/* Program Info */}
                  <div className="text-center border-b border-gray-100 pb-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedProgram?.nama_program}</h3>
                    <div className="mt-2">{renderStatusBadge(selectedProgram?.status)}</div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Informasi Program</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-medium text-gray-500 uppercase">Organisasi</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.organization?.nama || "-"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-medium text-gray-500 uppercase">Tahun Program</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.tahun || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Detail Program</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FolderTree className="w-4 h-4 text-purple-600" />
                          <p className="text-xs font-medium text-purple-600 uppercase">Tema Program</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.theme?.nama || "-"}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-600 uppercase">Bidang Program</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.field?.nama || "-"}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-amber-600" />
                          <p className="text-xs font-medium text-amber-600 uppercase">Sasaran Program</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.target?.nama || "-"}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Flag className="w-4 h-4 text-green-600" />
                          <p className="text-xs font-medium text-green-600 uppercase">Tujuan Program</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedProgram?.goal?.nama || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {selectedProgram?.deskripsi && (
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Deskripsi Program</h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedProgram.deskripsi}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daftar Kegiatan */}
                  {selectedProgram?.activities && selectedProgram.activities.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Daftar Kegiatan</h4>
                      <div className="space-y-3">
                        {selectedProgram.activities.map((activity) => (
                          <div key={activity.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs text-gray-500">{formatDate(activity.tanggal_pelaksanaan)}</span>
                                </div>
                                <h5 className="font-semibold text-gray-800 mb-2">{activity.nama_kegiatan}</h5>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.catatan || activity.deskripsi || "-"}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-xs font-semibold text-emerald-600">{formatCurrency(activity.total_pengeluaran)}</span>
                                  <span className="text-xs text-gray-500">Penanggung Jawab: {activity.penanggung_jawab?.nama || "-"}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenActivityDetail(activity)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Detail
                                </button>
                                <button
                                  onClick={() => handleOpenEditActivityModal(activity)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Informasi Pembuat</h4>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Dibuat Oleh</p>
                            <p className="text-sm font-medium text-gray-800">{selectedProgram?.creator?.name || "-"}</p>
                          </div>
                        </div>
                        {selectedProgram?.created_at && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Dibuat pada</p>
                            <p className="text-xs text-gray-600">{new Date(selectedProgram.created_at).toLocaleDateString("id-ID")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Create/Edit Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Program <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.nama_program} onChange={(e) => setFormData({ ...formData, nama_program: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.nama_program ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Masukkan nama program" disabled={isSubmitting} />
                    {formErrors.nama_program && <p className="text-xs text-red-500 mt-1">{formErrors.nama_program}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Organisasi <span className="text-red-500">*</span></label>
                    {shouldAutoSelectOrg && userOrganizationId ? (
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">{userOrganizationName || "Organisasi Anda"}</div>
                    ) : isRestrictedLevel ? (
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">{userOrganizationName || organizations[0]?.nama || "Organisasi Anda"}</div>
                    ) : (
                      <select value={formData.organization_id} onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.organization_id ? "border-red-500" : "border-gray-200"}`} disabled={isSubmitting}>
                        <option value="">Pilih Organisasi</option>
                        {organizations.map((org) => <option key={org.id} value={org.id}>{org.nama}</option>)}
                      </select>
                    )}
                    {formErrors.organization_id && <p className="text-xs text-red-500 mt-1">{formErrors.organization_id}</p>}
                    {(shouldAutoSelectOrg || isRestrictedLevel) && userOrganizationId && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Organisasi telah ditentukan berdasarkan akses Anda</p>
                    )}
                  </div>

                  {(shouldAutoSelectOrg || isRestrictedLevel) && userOrganizationId && <input type="hidden" name="organization_id" value={userOrganizationId} />}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tema <span className="text-gray-400 text-xs">(opsional)</span></label>
                      <select value={formData.theme_id} onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={isSubmitting}>
                        <option value="">Pilih Tema (opsional)</option>
                        {(isMWC ? availableThemeOptions : themes).map((theme) => <option key={theme.id} value={theme.id}>{theme.nama}</option>)}
                      </select>
                      {formErrors.theme_id && <p className="text-xs text-red-500 mt-1">{formErrors.theme_id}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun <span className="text-red-500">*</span></label>
                      <input type="number" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.tahun ? "border-red-500" : "border-gray-200"}`}
                        placeholder="Tahun" disabled={isSubmitting} />
                      {formErrors.tahun && <p className="text-xs text-red-500 mt-1">{formErrors.tahun}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bidang <span className="text-red-500">*</span></label>
                      <select value={formData.field_id} onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.field_id ? "border-red-500" : "border-gray-200"}`} disabled={isSubmitting}>
                        <option value="">Pilih Bidang</option>
                        {fields.map((field) => <option key={field.id} value={field.id}>{field.nama}</option>)}
                      </select>
                      {formErrors.field_id && <p className="text-xs text-red-500 mt-1">{formErrors.field_id}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Sasaran <span className="text-red-500">*</span></label>
                      <select value={formData.target_id} onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.target_id ? "border-red-500" : "border-gray-200"}`} disabled={isSubmitting}>
                        <option value="">Pilih Sasaran</option>
                        {targets.map((target) => <option key={target.id} value={target.id}>{target.nama}</option>)}
                      </select>
                      {formErrors.target_id && <p className="text-xs text-red-500 mt-1">{formErrors.target_id}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan <span className="text-red-500">*</span></label>
                      <select value={formData.goal_id} onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.goal_id ? "border-red-500" : "border-gray-200"}`} disabled={isSubmitting}>
                        <option value="">Pilih Tujuan</option>
                        {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.nama}</option>)}
                      </select>
                      {formErrors.goal_id && <p className="text-xs text-red-500 mt-1">{formErrors.goal_id}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={isSubmitting}>
                        <option value="draft">Draft</option>
                        <option value="aktif">Aktif</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi (opsional)</label>
                    <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      placeholder="Deskripsi program" disabled={isSubmitting} />
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                {modalMode === "view" ? "Tutup" : "Batal"}
              </button>
              {modalMode !== "view" && (
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Kegiatan */}
      {isActivityDetailModalOpen && selectedActivityDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Informasi lengkap kegiatan</p>
                </div>
                <button onClick={() => setIsActivityDetailModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Nama Kegiatan</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{selectedActivityDetail.nama_kegiatan}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Program Kerja</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivityDetail.work_program?.nama_program || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Organisasi</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivityDetail.organization?.nama || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Penanggung Jawab</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivityDetail.penanggung_jawab?.nama || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pelaksanaan</p>
                  <p className="text-sm text-gray-800 mt-1">{formatDate(selectedActivityDetail.tanggal_pelaksanaan)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Total Pengeluaran</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">{formatCurrency(selectedActivityDetail.total_pengeluaran)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Dibuat Oleh</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivityDetail.creator?.name || "-"}</p>
                </div>
              </div>

              {/* Rincian Pengeluaran */}
              {selectedActivityDetail.expense_descriptions && selectedActivityDetail.expense_descriptions.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Rincian Pengeluaran
                  </p>
                  <div className="space-y-2">
                    {selectedActivityDetail.expense_descriptions.map((expense, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-sm text-gray-700">{expense.description}</span>
                        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedActivityDetail.catatan && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Catatan
                  </p>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{selectedActivityDetail.catatan}</p>
                </div>
              )}

              {/* Foto Kegiatan */}
              {selectedActivityDetail.photos && selectedActivityDetail.photos.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Foto Kegiatan ({selectedActivityDetail.photos.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedActivityDetail.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(photo.file_path)}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/400x400?text=No+Image";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Foto Bukti Pengeluaran */}
              {selectedActivityDetail.expense_photos && selectedActivityDetail.expense_photos.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Foto Bukti Pengeluaran ({selectedActivityDetail.expense_photos.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedActivityDetail.expense_photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(photo.file_path)}
                        alt={`Expense Photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/400x400?text=No+Image";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* File Absensi */}
              {selectedActivityDetail.attendances && selectedActivityDetail.attendances.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    File Absensi ({selectedActivityDetail.attendances.length})
                  </p>
                  <div className="space-y-2">
                    {selectedActivityDetail.attendances.map((attendance, idx) => (
                      <a
                        key={idx}
                        href={getImageUrl(attendance.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 bg-white rounded-lg"
                      >
                        <Paperclip className="w-4 h-4" />
                        {attendance.file_name || `File Absensi ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setIsActivityDetailModalOpen(false)} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200">
                Tutup
              </button>
              <button
                onClick={() => {
                  setIsActivityDetailModalOpen(false);
                  handleOpenEditActivityModal(selectedActivityDetail);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Kegiatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Kegiatan */}
      {isEditActivityModalOpen && editingActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Kegiatan</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Perbarui informasi kegiatan</p>
                </div>
                <button onClick={() => setIsEditActivityModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Nama Kegiatan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.nama_kegiatan}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, nama_kegiatan: e.target.value }))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Masukkan nama kegiatan"
                />
              </div>

              {/* Tanggal Pelaksanaan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.tanggal_pelaksanaan}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tanggal_pelaksanaan: e.target.value }))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Total Pengeluaran */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Total Pengeluaran
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editFormData.total_pengeluaran ? formatRupiah(editFormData.total_pengeluaran) : ""}
                    onChange={(e) => handleRupiahChange(e, (val) => setEditFormData(prev => ({ ...prev, total_pengeluaran: val })))}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Rincian Pengeluaran */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Rincian Pengeluaran
                  </label>
                  <button
                    type="button"
                    onClick={addExpenseDescription}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Rincian
                  </button>
                </div>
                {editFormData.expense_descriptions.map((expense, idx) => (
                  <div key={idx} className="flex gap-3 mb-2 items-start">
                    <input
                      type="text"
                      placeholder="Deskripsi pengeluaran"
                      value={expense.description}
                      onChange={(e) => updateExpenseDescription(idx, "description", e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="relative w-40">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Jumlah"
                        value={expense.amount ? formatRupiah(expense.amount) : ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          updateExpenseDescription(idx, "amount", value);
                        }}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExpenseDescription(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Catatan
                </label>
                <textarea
                  value={editFormData.catatan}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Catatan tambahan tentang kegiatan"
                />
              </div>

              {/* Foto Kegiatan Baru */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Foto Kegiatan Baru
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleEditFileChange(e, "photos")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                />
                {editPhotoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editPhotoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => handleEditRemoveFile(idx, "photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Foto Bukti Pengeluaran Baru */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Foto Bukti Pengeluaran Baru
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleEditFileChange(e, "expense_photos")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                />
                {editExpensePhotoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editExpensePhotoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img src={preview} alt={`Expense Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => handleEditRemoveFile(idx, "expense_photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Absensi Baru */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  File Absensi Baru
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={(e) => handleEditFileChange(e, "attendance_files")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                />
                {editAttendanceFileNames.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {editAttendanceFileNames.map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-600">{name}</span>
                        <button type="button" onClick={() => handleEditRemoveFile(idx, "attendance_files")} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setIsEditActivityModalOpen(false)} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200">
                Batal
              </button>
              <button onClick={handleEditActivitySubmit} disabled={editSubmitting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
                {editSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default WorkPrograms;