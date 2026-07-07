import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useActivity } from "../../hooks/useActivity";
import { useRealtimeActivity } from "../../hooks/useRealtimeActivity";
import { activityService } from "../../services/activityService";
import workProgramService from "../../services/workProgramService";
import { organizationService } from "../../services/organization";
import { anggotaService } from "../../services/anggota";
import { activityDocumentService } from "../../services/activityDocument";
import MainLayout from "../../components/layout/MainLayout";
import { getStoragePath } from "../../utils/storageUrl";
import {
  Plus,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  formatDate,
  formatRupiah,
  getStatusBadge,
  statusOptions,
  formatDateForInput,
} from "../../utils/activityUtils";
import ActivitiesModalForm from "./ActivitiesModalForm";
import ActivitiesDetail from "./ActivitiesDetail";

const Activities = () => {
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  // ✅ Aktifkan realtime listener
  useRealtimeActivity();

  // =========================================================================
  // FILTER STATE
  // =========================================================================
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterWorkProgram, setFilterWorkProgram] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const searchTimeoutRef = useRef(null);

  // =========================================================================
  // MODAL STATE
  // =========================================================================
  const [documents, setDocuments] = useState([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [anggotas, setAnggotas] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    work_program_id: "",
    organization_id: "",
    penanggung_jawab_id: "",
    nama_kegiatan: "",
    tanggal_pelaksanaan: "",
    deskripsi: "",
    status: "draft",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [totalPengeluaran, setTotalPengeluaran] = useState("");
  const [expenseDescriptions, setExpenseDescriptions] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [photos, setPhotos] = useState([]);
  const [expensePhotos, setExpensePhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [expensePhotoPreviews, setExpensePhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingExpensePhotos, setExistingExpensePhotos] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
  const [deletedExpensePhotoIds, setDeletedExpensePhotoIds] = useState([]);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailFormData, setDetailFormData] = useState({
    total_pengeluaran: "",
    catatan: "",
    status: "",
  });
  const [detailPhotos, setDetailPhotos] = useState([]);
  const [detailExpensePhotos, setDetailExpensePhotos] = useState([]);
  const [detailPhotoPreviews, setDetailPhotoPreviews] = useState([]);
  const [detailExpensePhotoPreviews, setDetailExpensePhotoPreviews] = useState([]);
  const [detailDeletedPhotoIds, setDetailDeletedPhotoIds] = useState([]);
  const [detailDeletedExpensePhotoIds, setDetailDeletedExpensePhotoIds] = useState([]);
  const [detailSubmitting, setDetailSubmitting] = useState(false);

  // ✅ REF untuk tracking (mencegah infinite loop)
  const prevWorkProgramIdRef = useRef("");
  const prevOrganizationIdRef = useRef("");

  // =========================================================================
  // USER ROLE (Memoized)
  // =========================================================================
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level;
  const userOrganizationId = currentUser?.organization?.id;
  const userOrganizationName = currentUser?.organization?.nama;
  
  const isSuperAdmin = userRole === "super-admin";
  const isPC = userOrgLevel === "pc";
  const isMWC = userOrgLevel === "mwc";
  const isRanting = userOrgLevel === "ranting";

  // =========================================================================
  // ✅ FETCH PARENT MWC (untuk Ranting) - FIXED
  // =========================================================================
  const { data: parentMWCData, isLoading: isLoadingParentMWC } = useQuery({
    queryKey: ["parent-mwc", userOrganizationId],
    queryFn: async () => {
      if (!isRanting || !userOrganizationId) return null;
      
      const result = await organizationService.getById(userOrganizationId);
      if (!result.success || !result.data) return null;
      
      const organization = result.data.data || result.data;
      if (!organization.parent_id) return null;
      
      const parentResult = await organizationService.getById(organization.parent_id);
      if (!parentResult.success || !parentResult.data) return null;
      
      const parent = parentResult.data.data || parentResult.data;
      if (parent.level?.slug === "mwc") {
        return parent;
      }
      return null;
    },
    enabled: isRanting && !!userOrganizationId,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // ✅ Memoize parentMWCId (bukan useState + useEffect)
  const parentMWCId = parentMWCData?.id || null;

  // =========================================================================
  // ✅ FETCH ORGANIZATIONS (Cached 24 jam)
  // =========================================================================
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations-activities", userOrganizationId, parentMWCId, isSuperAdmin, isPC, isMWC, isRanting],
    queryFn: async () => {
      const result = await organizationService.getAll({ per_page: 500 });
      if (!result.success) return [];
      let orgs = result.data.data || [];

      if (isSuperAdmin) return orgs;
      if (isPC) return orgs.filter(org => org.level?.slug === "mwc" && org.parent_id === userOrganizationId);
      if (isMWC) return orgs.filter(org => org.level?.slug === "ranting" && org.parent_id === userOrganizationId);
      if (isRanting) return orgs.filter(org => org.id === userOrganizationId);
      return orgs;
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    enabled: !!currentUser && (!isRanting || !!parentMWCId),
  });

  // =========================================================================
  // ✅ FETCH WORK PROGRAMS (Cached 24 jam)
  // =========================================================================
  const { data: workProgramsData, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["work-programs-activities", userOrganizationId, parentMWCId, isSuperAdmin, isPC, isMWC, isRanting],
    queryFn: async () => {
      const result = await workProgramService.getWorkPrograms({ per_page: 500 });
      if (!result.success) return [];
      let programs = result.data.data || [];

      if (isSuperAdmin) return programs;
      if (isPC) return programs.filter(p => {
        const orgParentId = p.organization?.parent_id || p.parent_organization_id;
        return orgParentId === userOrganizationId;
      });
      if (isMWC) return programs.filter(p => p.organization_id === userOrganizationId);
      if (isRanting) return programs.filter(p => p.organization_id === parentMWCId);
      return programs;
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    enabled: !!currentUser && (!isRanting || !!parentMWCId),
  });

  const organizations = organizationsData || [];
  const workPrograms = workProgramsData || [];

  // =========================================================================
  // ✅ MEMOIZE FILTERS (PENTING untuk mencegah infinite loop)
  // =========================================================================
  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
      organization_id: filterOrganization || undefined,
      work_program_id: filterWorkProgram || undefined,
      status: filterStatus || undefined,
    }),
    [page, perPage, debouncedSearch, filterOrganization, filterWorkProgram, filterStatus]
  );

  // =========================================================================
  // USE ACTIVITY HOOK (dengan optimistic update)
  // =========================================================================
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteActivity,
    isDeleting,
    invalidate,
  } = useActivity(filters);

  const activities = response?.data || [];
  const pagination = response || {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };

  // =========================================================================
  // ✅ DOCUMENT HANDLERS (useCallback untuk stability)
  // =========================================================================
  const loadDocuments = useCallback(async (activityId) => {
    if (!activityId) {
      setDocuments([]);
      return;
    }

    try {
      const result = await activityDocumentService.getAll(activityId, { per_page: 100 });
      if (result.success) {
        setDocuments(result.data.data || []);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Load documents error:', err);
      setDocuments([]);
    }
  }, []);

  const handleDocumentUpload = useCallback(async (formData) => {
    if (!selectedActivity?.id) {
      return { success: false, message: "Activity ID tidak tersedia" };
    }

    setIsUploadingDocument(true);
    try {
      const result = await activityDocumentService.upload(selectedActivity.id, formData);

      if (result.success) {
        const newDocuments = result.data.documents || [];
        setDocuments((prev) => [...newDocuments, ...prev]);
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal upload dokumen"
      };
    } finally {
      setIsUploadingDocument(false);
    }
  }, [selectedActivity]);

  const handleDocumentDelete = useCallback(async (documentId) => {
    try {
      const result = await activityDocumentService.delete(documentId);

      if (result.success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal hapus dokumen"
      };
    }
  }, []);

  const handleDocumentDownload = useCallback((documentId) => {
    try {
      const downloadUrl = activityDocumentService.getDownloadUrl(documentId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      error("Error", "Gagal download dokumen");
    }
  }, [error]);

  // =========================================================================
  // ✅ FETCH ANGGOTAS (useCallback untuk stability)
  // =========================================================================
  const fetchAnggotasByOrganization = useCallback(async (organizationId) => {
    if (!organizationId) {
      setAnggotas([]);
      return;
    }

    try {
      let allAnggotas = [];
      let currentPage = 1;
      let lastPage = 1;
      const perPageLimit = 100;

      do {
        const result = await anggotaService.getAll({
          per_page: perPageLimit,
          page: currentPage,
          organization_id: organizationId,
        });

        if (result.success && result.data) {
          const data = result.data.data || [];
          allAnggotas = [...allAnggotas, ...data];
          lastPage = result.data.last_page || 1;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= lastPage);

      setAnggotas(allAnggotas);
    } catch (err) {
      console.error("Error fetching anggotas:", err);
      setAnggotas([]);
    }
  }, []);

  // =========================================================================
  // ✅ DEBOUNCE SEARCH
  // =========================================================================
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

  // =========================================================================
  // ✅ RESET FORM DATA saat work_program_id berubah (FIXED - No Loop)
  // =========================================================================
  useEffect(() => {
    // ✅ Cek apakah work_program_id benar-benar berubah
    if (formData.work_program_id === prevWorkProgramIdRef.current) {
      return;
    }
    
    prevWorkProgramIdRef.current = formData.work_program_id;

    if (formData.work_program_id) {
      const selectedProgram = workPrograms.find(
        (wp) => wp.id === parseInt(formData.work_program_id),
      );
      
      if (selectedProgram) {
        if (isMWC) {
          setFormData((prev) => ({ ...prev, organization_id: "", penanggung_jawab_id: "" }));
          setAnggotas([]);
        } else if (isRanting) {
          setFormData((prev) => ({
            ...prev,
            organization_id: userOrganizationId.toString(),
            penanggung_jawab_id: "",
          }));
          fetchAnggotasByOrganization(userOrganizationId);
        } else if (isPC) {
          const orgId = selectedProgram.organization_id;
          if (orgId) {
            setFormData((prev) => ({
              ...prev,
              organization_id: orgId.toString(),
              penanggung_jawab_id: "",
            }));
            fetchAnggotasByOrganization(orgId);
          }
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, organization_id: "", penanggung_jawab_id: "" }));
      setAnggotas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.work_program_id]);

  // =========================================================================
  // ✅ FETCH ANGGOTAS saat organization_id berubah (FIXED - No Loop)
  // =========================================================================
  useEffect(() => {
    // ✅ Cek apakah organization_id benar-benar berubah
    if (formData.organization_id === prevOrganizationIdRef.current) {
      return;
    }
    
    prevOrganizationIdRef.current = formData.organization_id;

    if (formData.organization_id) {
      fetchAnggotasByOrganization(parseInt(formData.organization_id));
      setFormData((prev) => ({ ...prev, penanggung_jawab_id: "" }));
    } else {
      setAnggotas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.organization_id]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  const handleSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPage(1);
  }, [search]);

  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  const handleFilterOrganization = useCallback((e) => {
    setFilterOrganization(e.target.value);
    setPage(1);
  }, []);

  const handleFilterWorkProgram = useCallback((e) => {
    setFilterWorkProgram(e.target.value);
    setPage(1);
  }, []);

  const handleFilterStatus = useCallback((e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setFilterOrganization("");
    setFilterWorkProgram("");
    setFilterStatus("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  }, [page]);

  const handleDelete = useCallback((activity) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kegiatan "${activity.nama_kegiatan}"?`,
      async () => {
        try {
          await deleteActivity(activity.id);
          success("Berhasil", "Kegiatan berhasil dihapus");
          
          if (activities.length === 1 && page > 1) {
            setPage(page - 1);
          }
        } catch (err) {
          console.error("Delete error:", err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus kegiatan");
        }
      },
    );
  }, [warning, deleteActivity, success, error, activities.length, page]);

  const resetForm = useCallback(() => {
    setFormData({
      work_program_id: "",
      organization_id: "",
      penanggung_jawab_id: "",
      nama_kegiatan: "",
      tanggal_pelaksanaan: "",
      deskripsi: "",
      status: "draft",
    });
    setFormErrors({});
    // ✅ Reset ref tracking
    prevWorkProgramIdRef.current = "";
    prevOrganizationIdRef.current = "";
  }, []);

  const resetEditForm = useCallback(() => {
    setTotalPengeluaran("");
    setExpenseDescriptions([]);
    setCatatan("");
    setPhotos([]);
    setExpensePhotos([]);
    setPhotoPreviews([]);
    setExpensePhotoPreviews([]);
    setExistingPhotos([]);
    setExistingExpensePhotos([]);
    setDeletedPhotoIds([]);
    setDeletedExpensePhotoIds([]);
  }, []);

  const resetDetailForm = useCallback(() => {
    setDetailFormData({
      total_pengeluaran: "",
      catatan: "",
      status: "",
    });
    setDetailPhotos([]);
    setDetailExpensePhotos([]);
    setDetailPhotoPreviews([]);
    setDetailExpensePhotoPreviews([]);
    setDetailDeletedPhotoIds([]);
    setDetailDeletedExpensePhotoIds([]);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingActivity(null);
    resetForm();
    resetEditForm();
    setShowForm(true);
  }, [resetForm, resetEditForm]);

  const openEditForm = useCallback(async (activity) => {
    setEditingActivity(activity);
    setFormData({
      work_program_id: activity.work_program_id?.toString() || "",
      organization_id: activity.organization_id?.toString() || "",
      penanggung_jawab_id: activity.penanggung_jawab_id?.toString() || "",
      nama_kegiatan: activity.nama_kegiatan || "",
      tanggal_pelaksanaan: formatDateForInput(activity.tanggal_pelaksanaan),
      deskripsi: activity.deskripsi || "",
      status: activity.status || "draft",
    });

    const rawTotal = activity.total_pengeluaran
      ? Math.floor(parseFloat(activity.total_pengeluaran)).toString()
      : "";
    setTotalPengeluaran(rawTotal);
    setCatatan(activity.catatan || "");

    setExistingPhotos(activity.photos || []);
    setExistingExpensePhotos(activity.expense_photos || []);

    if (activity.expense_descriptions && activity.expense_descriptions.length > 0) {
      const formattedExpenses = activity.expense_descriptions.map((exp) => ({
        ...exp,
        amount: exp.amount ? Math.floor(parseFloat(exp.amount)).toString() : "0",
      }));
      setExpenseDescriptions(formattedExpenses);
    } else {
      setExpenseDescriptions([]);
    }

    setPhotos([]);
    setExpensePhotos([]);
    setPhotoPreviews([]);
    setExpensePhotoPreviews([]);
    setDeletedPhotoIds([]);
    setDeletedExpensePhotoIds([]);
    setFormErrors({});
    setShowForm(true);
    
    // ✅ Reset ref tracking agar tidak trigger loop
    prevWorkProgramIdRef.current = activity.work_program_id?.toString() || "";
    prevOrganizationIdRef.current = activity.organization_id?.toString() || "";
  }, []);

  const openDetail = useCallback((activity) => {
    setSelectedActivity(activity);
    setIsEditingDetail(false);

    const rawTotal = activity.total_pengeluaran
      ? Math.floor(parseFloat(activity.total_pengeluaran)).toString()
      : "";

    setDetailFormData({
      total_pengeluaran: rawTotal,
      catatan: activity.catatan || "",
      status: activity.status || "draft",
    });

    setDetailPhotos([]);
    setDetailExpensePhotos([]);
    setDetailPhotoPreviews([]);
    setDetailExpensePhotoPreviews([]);
    setDetailDeletedPhotoIds([]);
    setDetailDeletedExpensePhotoIds([]);

    loadDocuments(activity.id);
    setShowDetail(true);
  }, [loadDocuments]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [formErrors]);

  const handleFileChange = useCallback((e, type) => {
    const files = Array.from(e.target.files);

    if (type === "photos") {
      setPhotos((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...previews]);
    } else if (type === "expense_photos") {
      setExpensePhotos((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setExpensePhotoPreviews((prev) => [...prev, ...previews]);
    }
  }, []);

  const removeFile = useCallback((index, type) => {
    if (type === "photos") {
      URL.revokeObjectURL(photoPreviews[index]);
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "expense_photos") {
      URL.revokeObjectURL(expensePhotoPreviews[index]);
      setExpensePhotos((prev) => prev.filter((_, i) => i !== index));
      setExpensePhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  }, [photoPreviews, expensePhotoPreviews]);

  const removeExistingPhoto = useCallback((photoId) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const removeExistingExpensePhoto = useCallback((photoId) => {
    setDeletedExpensePhotoIds((prev) => [...prev, photoId]);
    setExistingExpensePhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const addExpenseDescription = useCallback(() => {
    setExpenseDescriptions((prev) => [
      ...prev,
      { description: "", amount: "0" },
    ]);
  }, []);

  const updateExpenseDescription = useCallback((index, field, value) => {
    setExpenseDescriptions((prev) => {
      const updated = [...prev];
      if (field === "amount") {
        const cleanValue = value.toString().replace(/\D/g, "");
        updated[index][field] = cleanValue;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  }, []);

  const removeExpenseDescription = useCallback((index) => {
    setExpenseDescriptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.work_program_id) errors.work_program_id = "Program kerja wajib dipilih";
    if (!formData.organization_id) errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.penanggung_jawab_id) errors.penanggung_jawab_id = "Penanggung jawab wajib dipilih";
    if (!formData.nama_kegiatan.trim()) errors.nama_kegiatan = "Nama kegiatan wajib diisi";
    if (!formData.tanggal_pelaksanaan) errors.tanggal_pelaksanaan = "Tanggal pelaksanaan wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    const submitData = new FormData();
    submitData.append("work_program_id", formData.work_program_id);
    submitData.append("organization_id", formData.organization_id);
    submitData.append("penanggung_jawab_id", formData.penanggung_jawab_id);
    submitData.append("nama_kegiatan", formData.nama_kegiatan);
    submitData.append("tanggal_pelaksanaan", formData.tanggal_pelaksanaan);
    if (formData.deskripsi) submitData.append("deskripsi", formData.deskripsi);
    if (formData.status) submitData.append("status", formData.status);

    if (editingActivity) {
      if (totalPengeluaran) {
        const rawNumber = totalPengeluaran.toString().replace(/\D/g, "");
        submitData.append("total_pengeluaran", rawNumber);
      }
      if (catatan) submitData.append("catatan", catatan);

      if (expenseDescriptions.length > 0) {
        const formattedExpenses = expenseDescriptions.map((exp) => ({
          description: exp.description,
          amount: parseInt(exp.amount) || 0,
        }));
        submitData.append("expense_descriptions", JSON.stringify(formattedExpenses));
      }

      if (deletedPhotoIds.length > 0) {
        submitData.append("deleted_photo_ids", JSON.stringify(deletedPhotoIds));
      }
      if (deletedExpensePhotoIds.length > 0) {
        submitData.append("deleted_expense_photo_ids", JSON.stringify(deletedExpensePhotoIds));
      }

      photos.forEach((photo) => submitData.append("photos[]", photo));
      expensePhotos.forEach((photo) => submitData.append("expense_photos[]", photo));
    }

    try {
      let result;
      if (editingActivity) {
        result = await activityService.update(editingActivity.id, submitData);
      } else {
        result = await activityService.create(submitData);
      }

      if (result.success) {
        success("Berhasil", result.message);
        setShowForm(false);
        resetForm();
        resetEditForm();
      } else {
        if (result.errors) {
          setFormErrors(result.errors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error("Gagal", result.message);
        }
      }
    } catch (err) {
      error("Gagal", err.response?.data?.message || err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm, formData, editingActivity, totalPengeluaran, catatan,
    expenseDescriptions, deletedPhotoIds, deletedExpensePhotoIds, photos,
    expensePhotos, success, error, resetForm, resetEditForm
  ]);

  const handleModalSuccess = useCallback(() => {
    setPage(1);
  }, []);

  const hasActiveFilters = search || filterOrganization || filterWorkProgram || filterStatus;
  const getImageUrl = useCallback((path) => (path ? getStoragePath(path) : ""), []);

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (isLoadingOrgs || isLoadingPrograms || isLoadingParentMWC || isLoading) {
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

  // =========================================================================
  // ERROR STATE
  // =========================================================================
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message || "Silakan coba lagi"}</p>
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

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Calendar className="w-8 h-8 text-emerald-600" />
                Kegiatan Program Kerja
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola kegiatan pelaksanaan program kerja organisasi
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Kegiatan
            </button>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    PROGRAM KERJA
                  </label>
                  <select
                    value={filterWorkProgram}
                    onChange={handleFilterWorkProgram}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Program Kerja</option>
                    {workPrograms.map((wp) => (
                      <option key={wp.id} value={wp.id}>
                        {wp.nama_program}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI
                  </label>
                  <select
                    value={filterOrganization}
                    onChange={handleFilterOrganization}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Organisasi</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama}
                      </option>
                    ))}
                  </select>
                </div>

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
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
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
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Memperbarui data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${isFetching ? "opacity-50" : "opacity-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Kegiatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Program Kerja</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Penanggung Jawab</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data kegiatan</p>
                            <button onClick={openCreateForm} className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium">
                              + Tambah Kegiatan Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity, index) => (
                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">{activity.nama_kegiatan}</div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{activity.work_program?.nama_program || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{activity.organization?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{activity.penanggung_jawab?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{formatDate(activity.tanggal_pelaksanaan)}</span>
                          </td>
                          <td className="text-center px-6 py-4">{getStatusBadge(activity.status)}</td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openDetail(activity)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Detail">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditForm(activity)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(activity)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Hapus"
                                disabled={isDeleting}
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
              {pagination.last_page > 1 && !isFetching && activities.length > 0 && (
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
                        if (pagination.last_page <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                        else pageNum = page - 2 + i;
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

      {/* Form Modal */}
      <ActivitiesModalForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        editingActivity={editingActivity}
        formData={formData}
        formErrors={formErrors}
        submitting={submitting}
        workPrograms={workPrograms}
        organizations={organizations}
        anggotas={anggotas}
        totalPengeluaran={totalPengeluaran}
        expenseDescriptions={expenseDescriptions}
        catatan={catatan}
        photos={photos}
        expensePhotos={expensePhotos}
        photoPreviews={photoPreviews}
        expensePhotoPreviews={expensePhotoPreviews}
        existingPhotos={existingPhotos}
        existingExpensePhotos={existingExpensePhotos}
        isRanting={isRanting}
        isMWC={isMWC}
        userOrganizationName={userOrganizationName}
        onFormChange={handleChange}
        onTotalPengeluaranChange={setTotalPengeluaran}
        onCatatanChange={setCatatan}
        onAddExpenseDescription={addExpenseDescription}
        onUpdateExpenseDescription={updateExpenseDescription}
        onRemoveExpenseDescription={removeExpenseDescription}
        onFileChange={handleFileChange}
        onRemoveFile={removeFile}
        onRemoveExistingPhoto={removeExistingPhoto}
        onRemoveExistingExpensePhoto={removeExistingExpensePhoto}
        onSubmit={handleSubmit}
        getImageUrl={getImageUrl}
      />

      {/* Detail Modal */}
      <ActivitiesDetail
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        selectedActivity={selectedActivity}
        isEditing={isEditingDetail}
        setIsEditing={setIsEditingDetail}
        detailFormData={detailFormData}
        setDetailFormData={setDetailFormData}
        detailPhotos={detailPhotos}
        detailExpensePhotos={detailExpensePhotos}
        detailPhotoPreviews={detailPhotoPreviews}
        detailExpensePhotoPreviews={detailExpensePhotoPreviews}
        detailDeletedPhotoIds={detailDeletedPhotoIds}
        detailDeletedExpensePhotoIds={detailDeletedExpensePhotoIds}
        detailSubmitting={detailSubmitting}
        onSubmit={async () => {
          setDetailSubmitting(true);

          const submitData = new FormData();
          submitData.append("work_program_id", selectedActivity.work_program_id);
          submitData.append("organization_id", selectedActivity.organization_id);
          submitData.append("penanggung_jawab_id", selectedActivity.penanggung_jawab_id);
          submitData.append("nama_kegiatan", selectedActivity.nama_kegiatan);
          submitData.append("tanggal_pelaksanaan", selectedActivity.tanggal_pelaksanaan);
          if (selectedActivity.deskripsi) submitData.append("deskripsi", selectedActivity.deskripsi);

          if (detailFormData.status) submitData.append("status", detailFormData.status);
          if (detailFormData.total_pengeluaran) {
            const rawNumber = detailFormData.total_pengeluaran.toString().replace(/\D/g, "");
            submitData.append("total_pengeluaran", rawNumber);
          }
          if (detailFormData.catatan) submitData.append("catatan", detailFormData.catatan);

          if (detailDeletedPhotoIds.length > 0) {
            submitData.append("deleted_photo_ids", JSON.stringify(detailDeletedPhotoIds));
          }
          if (detailDeletedExpensePhotoIds.length > 0) {
            submitData.append("deleted_expense_photo_ids", JSON.stringify(detailDeletedExpensePhotoIds));
          }

          detailPhotos.forEach((photo) => submitData.append("photos[]", photo));
          detailExpensePhotos.forEach((photo) => submitData.append("expense_photos[]", photo));

          try {
            const result = await activityService.update(selectedActivity.id, submitData);

            if (result.success) {
              success("Berhasil", "Data kegiatan berhasil diperbarui");
              setIsEditingDetail(false);
              resetDetailForm();
              
              const freshData = await activityService.getById(selectedActivity.id);
              if (freshData.success) {
                setSelectedActivity(freshData.data);
              }
            } else {
              if (result.errors) {
                error("Validasi Gagal", "Silakan periksa kembali data Anda");
              } else {
                error("Gagal", result.message);
              }
            }
          } catch (err) {
            error("Gagal", err.response?.data?.message || err.message || "Terjadi kesalahan");
          } finally {
            setDetailSubmitting(false);
          }
        }}
        onEditFull={openEditForm}
        onFileChange={(e, type) => {
          const files = Array.from(e.target.files);

          if (type === "photos") {
            const newPhotos = [...detailPhotos, ...files];
            if (newPhotos.length + (selectedActivity?.photos?.length || 0) - detailDeletedPhotoIds.length > 5) {
              warning("Peringatan", `Maksimal 5 foto kegiatan`);
              return;
            }
            setDetailPhotos(newPhotos);
            const previews = files.map((file) => URL.createObjectURL(file));
            setDetailPhotoPreviews((prev) => [...prev, ...previews]);
          } else if (type === "expense_photos") {
            setDetailExpensePhotos((prev) => [...prev, ...files]);
            const previews = files.map((file) => URL.createObjectURL(file));
            setDetailExpensePhotoPreviews((prev) => [...prev, ...previews]);
          }
        }}
        onRemoveFile={(index, type) => {
          if (type === "photos") {
            URL.revokeObjectURL(detailPhotoPreviews[index]);
            setDetailPhotos((prev) => prev.filter((_, i) => i !== index));
            setDetailPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
          } else if (type === "expense_photos") {
            URL.revokeObjectURL(detailExpensePhotoPreviews[index]);
            setDetailExpensePhotos((prev) => prev.filter((_, i) => i !== index));
            setDetailExpensePhotoPreviews((prev) => prev.filter((_, i) => i !== index));
          }
        }}
        onRemoveExistingPhoto={(photoId) => setDetailDeletedPhotoIds((prev) => [...prev, photoId])}
        onRemoveExistingExpensePhoto={(photoId) => setDetailDeletedExpensePhotoIds((prev) => [...prev, photoId])}
        getImageUrl={getImageUrl}
        documents={documents}
        onDocumentUpload={handleDocumentUpload}
        onDocumentDelete={handleDocumentDelete}
        onDocumentDownload={handleDocumentDownload}
        isUploadingDocument={isUploadingDocument}
      />
    </MainLayout>
  );
};

export default Activities;