import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
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

  // =========================================================================
  // ✅ STATE - DOKUMEN (BARU)
  // =========================================================================
  const [documents, setDocuments] = useState([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // =========================================================================
  // STATE - ACTIVITIES
  // =========================================================================
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterWorkProgram, setFilterWorkProgram] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [organizations, setOrganizations] = useState([]);
  const [workPrograms, setWorkPrograms] = useState([]);
  const [anggotas, setAnggotas] = useState([]);

  const [parentMWCId, setParentMWCId] = useState(null);
  const [parentMWCLoaded, setParentMWCLoaded] = useState(false);
  const [parentMWCName, setParentMWCName] = useState("");

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

  const searchTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);
  const initialDataLoadedRef = useRef(false);

  const userRole = currentUser?.role?.slug;
  const isSuperAdmin = userRole === "super-admin";
  const userOrgLevel = currentUser?.organization?.level;
  const userOrganizationId = currentUser?.organization?.id;
  const userOrganizationName = currentUser?.organization?.nama;
  const isPC = userOrgLevel === "pc";
  const isMWC = userOrgLevel === "mwc";
  const isRanting = userOrgLevel === "ranting";

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================
  const getImageUrl = (path) => {
    if (!path) return "";
    return getStoragePath(path);
  };

  const fetchActivities = useCallback(
    async (page = 1) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoading(true);

      const params = {
        page,
        per_page: pagination.per_page,
      };

      if (search && search.trim()) params.search = search.trim();
      if (filterOrganization) params.organization_id = filterOrganization;
      if (filterWorkProgram) params.work_program_id = filterWorkProgram;
      if (filterStatus) params.status = filterStatus;

      try {
        const result = await activityService.getAll(params);

        if (result.success) {
          setActivities(result.data.data);
          setPagination({
            current_page: result.data.current_page,
            last_page: result.data.last_page,
            per_page: result.data.per_page,
            total: result.data.total,
          });
        } else {
          error("Gagal", result.message || "Terjadi kesalahan saat mengambil data");
          setActivities([]);
        }
      } catch (err) {
        console.error("Fetch activities error:", err);
        error("Gagal", "Terjadi kesalahan saat mengambil data kegiatan");
        setActivities([]);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [pagination.per_page, error, search, filterOrganization, filterWorkProgram, filterStatus]
  );

  const fetchParentMWC = useCallback(async () => {
    if (!isRanting || !userOrganizationId || parentMWCLoaded) return null;

    try {
      const result = await organizationService.getById(userOrganizationId);
      if (result.success && result.data) {
        const organization = result.data.data || result.data;
        if (organization.parent_id) {
          const parentResult = await organizationService.getById(
            organization.parent_id,
          );
          if (parentResult.success && parentResult.data) {
            const parent = parentResult.data.data || parentResult.data;
            if (parent.level?.slug === "mwc") {
              setParentMWCId(parent.id);
              setParentMWCName(parent.nama);
              setParentMWCLoaded(true);
              return parent.id;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching parent MWC:", err);
    }
    setParentMWCLoaded(true);
    return null;
  }, [isRanting, userOrganizationId, parentMWCLoaded]);

  const fetchWorkPrograms = useCallback(
    async (mwcId = null) => {
      const result = await workProgramService.getWorkPrograms({
        per_page: 1000,
      });

      if (result.success) {
        let programs = result.data.data || [];
        let filtered = [];

        if (isSuperAdmin) {
          filtered = programs;
        } else if (isPC) {
          filtered = programs.filter((p) => {
            const orgParentId =
              p.organization?.parent_id || p.parent_organization_id;
            return orgParentId === userOrganizationId;
          });
        } else if (isMWC) {
          filtered = programs.filter(
            (p) => p.organization_id === userOrganizationId,
          );
        } else if (isRanting) {
          const mwcIdToUse = mwcId || parentMWCId;
          filtered = programs.filter((p) => p.organization_id === mwcIdToUse);
        } else {
          filtered = programs;
        }

        setWorkPrograms(filtered);
      }
    },
    [isSuperAdmin, isPC, isMWC, isRanting, userOrganizationId, parentMWCId],
  );

  const fetchOrganizations = useCallback(async () => {
    const result = await organizationService.getAll({ per_page: 1000 });
    if (result.success) {
      let orgs = result.data.data || [];

      if (isSuperAdmin) {
        setOrganizations(orgs);
      } else if (isPC) {
        orgs = orgs.filter(
          (org) =>
            org.level?.slug === "mwc" && org.parent_id === userOrganizationId,
        );
        setOrganizations(orgs);
      } else if (isMWC) {
        orgs = orgs.filter(
          (org) =>
            org.level?.slug === "ranting" &&
            org.parent_id === userOrganizationId,
        );
        setOrganizations(orgs);
      } else if (isRanting) {
        orgs = orgs.filter((org) => org.id === userOrganizationId);
        setOrganizations(orgs);
      } else {
        setOrganizations(orgs);
      }
    }
  }, [isSuperAdmin, isPC, isMWC, isRanting, userOrganizationId]);

  const fetchAnggotasByOrganization = async (organizationId) => {
    if (!organizationId) {
      setAnggotas([]);
      return;
    }

    try {
      let allAnggotas = [];
      let currentPage = 1;
      let lastPage = 1;
      const perPage = 100;

      do {
        const result = await anggotaService.getAll({
          per_page: perPage,
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
  };

  // =========================================================================
  // ✅ DOKUMEN HANDLERS (BARU - OPTIMIZED)
  // =========================================================================

  /**
   * ✅ Load documents saat modal detail dibuka
   * Menggunakan useCallback untuk optimasi performa
   */
  const loadDocuments = useCallback(async (activityId) => {
    if (!activityId) {
      setDocuments([]);
      return;
    }

    try {
      // ✅ Load semua dokumen dengan per_page besar untuk performa
      const result = await activityDocumentService.getAll(activityId, {
        per_page: 100,
      });

      if (result.success) {
        setDocuments(result.data.data || []);
      } else {
        console.error('Load documents error:', result.message);
        setDocuments([]);
      }
    } catch (err) {
      console.error('Load documents error:', err);
      setDocuments([]);
    }
  }, []);

  /**
   * ✅ Handle document upload
   * Return { success: true/false, message?, data? }
   */
  const handleDocumentUpload = useCallback(async (formData) => {
    if (!selectedActivity?.id) {
      return { success: false, message: "Activity ID tidak tersedia" };
    }

    setIsUploadingDocument(true);
    try {
      const result = await activityDocumentService.upload(
        selectedActivity.id,
        formData
      );

      if (result.success) {
        // ✅ Tambahkan dokumen baru ke state
        const newDocuments = result.data.documents || [];
        setDocuments((prev) => [...newDocuments, ...prev]);
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error('Upload document error:', err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal upload dokumen"
      };
    } finally {
      setIsUploadingDocument(false);
    }
  }, [selectedActivity]);

  /**
   * ✅ Handle document delete
   * Return { success: true/false, message? }
   */
  const handleDocumentDelete = useCallback(async (documentId) => {
    try {
      const result = await activityDocumentService.delete(documentId);

      if (result.success) {
        // ✅ Hapus dokumen dari state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error('Delete document error:', err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Gagal hapus dokumen"
      };
    }
  }, []);

  /**
   * ✅ Handle document download
   */
  const handleDocumentDownload = useCallback((documentId, fileName) => {
    try {
      const downloadUrl = activityDocumentService.getDownloadUrl(documentId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download document error:', err);
      error("Error", "Gagal download dokumen");
    }
  }, [error]);

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, current_page: 1 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    if (!initialLoading) {
      fetchActivities(1);
    }
  }, [
    search,
    filterOrganization,
    filterWorkProgram,
    filterStatus,
    initialLoading,
    fetchActivities,
  ]);

  useEffect(() => {
    if (formData.work_program_id) {
      const selectedProgram = workPrograms.find(
        (wp) => wp.id === parseInt(formData.work_program_id),
      );
      if (selectedProgram) {
        if (isMWC) {
          setFormData((prev) => ({ ...prev, organization_id: "" }));
          setAnggotas([]);
        } else if (isRanting) {
          setFormData((prev) => ({
            ...prev,
            organization_id: userOrganizationId.toString(),
          }));
          fetchAnggotasByOrganization(userOrganizationId);
        } else if (isPC) {
          const orgId = selectedProgram.organization_id;
          if (orgId) {
            setFormData((prev) => ({
              ...prev,
              organization_id: orgId.toString(),
            }));
            fetchAnggotasByOrganization(orgId);
          }
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, organization_id: "" }));
      setAnggotas([]);
    }
  }, [
    formData.work_program_id,
    workPrograms,
    isMWC,
    isRanting,
    isPC,
    userOrganizationId,
  ]);

  useEffect(() => {
    if (formData.organization_id) {
      fetchAnggotasByOrganization(parseInt(formData.organization_id));
      setFormData((prev) => ({ ...prev, penanggung_jawab_id: "" }));
    }
  }, [formData.organization_id]);

  useEffect(() => {
    if (initialDataLoadedRef.current) return;
    initialDataLoadedRef.current = true;

    const loadInitialData = async () => {
      setInitialLoading(true);

      let mwcId = null;
      if (isRanting) {
        mwcId = await fetchParentMWC();
      }

      await fetchOrganizations();
      await fetchWorkPrograms(mwcId);

      setInitialLoading(false);
      await fetchActivities(1);
    };

    loadInitialData();
  }, [
    fetchOrganizations,
    fetchWorkPrograms,
    fetchParentMWC,
    isRanting,
    fetchActivities,
  ]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    fetchActivities(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterOrganization = (e) => {
    setFilterOrganization(e.target.value);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleFilterWorkProgram = (e) => {
    setFilterWorkProgram(e.target.value);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handleReset = () => {
    setSearch("");
    setFilterOrganization("");
    setFilterWorkProgram("");
    setFilterStatus("");
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchActivities(newPage);
  };

  const handleDelete = (activity) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kegiatan "${activity.nama_kegiatan}"?`,
      async () => {
        const result = await activityService.delete(activity.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchActivities(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const resetForm = () => {
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
  };

  const resetEditForm = () => {
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
  };

  const resetDetailForm = () => {
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
  };

  const openCreateForm = () => {
    setEditingActivity(null);
    resetForm();
    resetEditForm();
    setShowForm(true);
  };

  const openEditForm = async (activity) => {
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

    if (
      activity.expense_descriptions &&
      activity.expense_descriptions.length > 0
    ) {
      const formattedExpenses = activity.expense_descriptions.map((exp) => ({
        ...exp,
        amount: exp.amount
          ? Math.floor(parseFloat(exp.amount)).toString()
          : "0",
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
  };

  /**
   * ✅ PERBAIKAN: Load documents saat modal detail dibuka
   */
  const openDetail = (activity) => {
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

    // ✅ BARU: Load documents saat modal detail dibuka
    loadDocuments(activity.id);

    setShowDetail(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e, type) => {
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
  };

  const removeFile = (index, type) => {
    if (type === "photos") {
      URL.revokeObjectURL(photoPreviews[index]);
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "expense_photos") {
      URL.revokeObjectURL(expensePhotoPreviews[index]);
      setExpensePhotos((prev) => prev.filter((_, i) => i !== index));
      setExpensePhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removeExistingPhoto = (photoId) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const removeExistingExpensePhoto = (photoId) => {
    setDeletedExpensePhotoIds((prev) => [...prev, photoId]);
    setExistingExpensePhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const addExpenseDescription = () => {
    setExpenseDescriptions([
      ...expenseDescriptions,
      { description: "", amount: "0" },
    ]);
  };

  const updateExpenseDescription = (index, field, value) => {
    const updated = [...expenseDescriptions];
    if (field === "amount") {
      const cleanValue = value.toString().replace(/\D/g, "");
      updated[index][field] = cleanValue;
    } else {
      updated[index][field] = value;
    }
    setExpenseDescriptions(updated);
  };

  const removeExpenseDescription = (index) => {
    setExpenseDescriptions(expenseDescriptions.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.work_program_id)
      errors.work_program_id = "Program kerja wajib dipilih";
    if (!formData.organization_id)
      errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.penanggung_jawab_id)
      errors.penanggung_jawab_id = "Penanggung jawab wajib dipilih";
    if (!formData.nama_kegiatan.trim())
      errors.nama_kegiatan = "Nama kegiatan wajib diisi";
    if (!formData.tanggal_pelaksanaan)
      errors.tanggal_pelaksanaan = "Tanggal pelaksanaan wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
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
        submitData.append(
          "expense_descriptions",
          JSON.stringify(formattedExpenses),
        );
      }

      if (deletedPhotoIds.length > 0) {
        submitData.append("deleted_photo_ids", JSON.stringify(deletedPhotoIds));
      }
      if (deletedExpensePhotoIds.length > 0) {
        submitData.append(
          "deleted_expense_photo_ids",
          JSON.stringify(deletedExpensePhotoIds),
        );
      }

      photos.forEach((photo) => {
        submitData.append("photos[]", photo);
      });

      expensePhotos.forEach((photo) => {
        submitData.append("expense_photos[]", photo);
      });
    }

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
      fetchActivities(pagination.current_page);
    } else {
      if (result.errors) {
        setFormErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
      } else {
        error("Gagal", result.message);
      }
    }
    setSubmitting(false);
  };

  const hasActiveFilters =
    search || filterOrganization || filterWorkProgram || filterStatus;

  // =========================================================================
  // LOADING STATE
  // =========================================================================
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
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            )}

            <div
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? "opacity-50" : "opacity-100"}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Kegiatan
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Program Kerja
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Organisasi
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Penanggung Jawab
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">
                              Tidak ada data kegiatan
                            </p>
                            <button
                              onClick={openCreateForm}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Kegiatan Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity) => (
                        <tr
                          key={activity.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="text-center px-6 py-4">
                            <div className="font-semibold text-gray-800">
                              {activity.nama_kegiatan}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {activity.work_program?.nama_program || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {activity.organization?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {activity.penanggung_jawab?.nama || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(activity.tanggal_pelaksanaan)}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(activity.status)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetail(activity)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditForm(activity)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(activity)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

              {/* Pagination */}
              {pagination.last_page > 1 &&
                !loading &&
                activities.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-sm text-gray-500 order-2 sm:order-1">
                      Menampilkan{" "}
                      {(pagination.current_page - 1) * pagination.per_page + 1}{" "}
                      -{" "}
                      {Math.min(
                        pagination.current_page * pagination.per_page,
                        pagination.total,
                      )}{" "}
                      dari {pagination.total} data
                    </div>
                    <div className="flex gap-2 order-1 sm:order-2">
                      <button
                        onClick={() =>
                          handlePageChange(pagination.current_page - 1)
                        }
                        disabled={pagination.current_page === 1}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.last_page) },
                          (_, i) => {
                            let pageNum;
                            if (pagination.last_page <= 5) pageNum = i + 1;
                            else if (pagination.current_page <= 3)
                              pageNum = i + 1;
                            else if (
                              pagination.current_page >=
                              pagination.last_page - 2
                            )
                              pageNum = pagination.last_page - 4 + i;
                            else pageNum = pagination.current_page - 2 + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                                  pagination.current_page === pageNum
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "border border-gray-300 hover:bg-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.current_page + 1)
                        }
                        disabled={
                          pagination.current_page === pagination.last_page
                        }
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
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

      {/* ✅ PERBAIKAN: Detail Modal dengan Props Dokumen */}
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
          submitData.append(
            "work_program_id",
            selectedActivity.work_program_id,
          );
          submitData.append(
            "organization_id",
            selectedActivity.organization_id,
          );
          submitData.append(
            "penanggung_jawab_id",
            selectedActivity.penanggung_jawab_id,
          );
          submitData.append("nama_kegiatan", selectedActivity.nama_kegiatan);
          submitData.append(
            "tanggal_pelaksanaan",
            selectedActivity.tanggal_pelaksanaan,
          );
          if (selectedActivity.deskripsi)
            submitData.append("deskripsi", selectedActivity.deskripsi);

          if (detailFormData.status)
            submitData.append("status", detailFormData.status);
          if (detailFormData.total_pengeluaran) {
            const rawNumber = detailFormData.total_pengeluaran
              .toString()
              .replace(/\D/g, "");
            submitData.append("total_pengeluaran", rawNumber);
          }
          if (detailFormData.catatan)
            submitData.append("catatan", detailFormData.catatan);

          if (detailDeletedPhotoIds.length > 0) {
            submitData.append(
              "deleted_photo_ids",
              JSON.stringify(detailDeletedPhotoIds),
            );
          }
          if (detailDeletedExpensePhotoIds.length > 0) {
            submitData.append(
              "deleted_expense_photo_ids",
              JSON.stringify(detailDeletedExpensePhotoIds),
            );
          }

          detailPhotos.forEach((photo) => {
            submitData.append("photos[]", photo);
          });

          detailExpensePhotos.forEach((photo) => {
            submitData.append("expense_photos[]", photo);
          });

          const result = await activityService.update(
            selectedActivity.id,
            submitData,
          );

          if (result.success) {
            success("Berhasil", "Data kegiatan berhasil diperbarui");
            setIsEditingDetail(false);
            resetDetailForm();
            fetchActivities(pagination.current_page);

            const freshData = await activityService.getById(
              selectedActivity.id,
            );
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
          setDetailSubmitting(false);
        }}
        onEditFull={openEditForm}
        onFileChange={(e, type) => {
          const files = Array.from(e.target.files);

          if (type === "photos") {
            const newPhotos = [...detailPhotos, ...files];
            if (
              newPhotos.length +
                (selectedActivity?.photos?.length || 0) -
                detailDeletedPhotoIds.length >
              5
            ) {
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
            setDetailPhotoPreviews((prev) =>
              prev.filter((_, i) => i !== index),
            );
          } else if (type === "expense_photos") {
            URL.revokeObjectURL(detailExpensePhotoPreviews[index]);
            setDetailExpensePhotos((prev) =>
              prev.filter((_, i) => i !== index),
            );
            setDetailExpensePhotoPreviews((prev) =>
              prev.filter((_, i) => i !== index),
            );
          }
        }}
        onRemoveExistingPhoto={(photoId) => {
          setDetailDeletedPhotoIds((prev) => [...prev, photoId]);
        }}
        onRemoveExistingExpensePhoto={(photoId) => {
          setDetailDeletedExpensePhotoIds((prev) => [...prev, photoId]);
        }}
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