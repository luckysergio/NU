import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { activityService } from "../../services/activityService";
import workProgramService from "../../services/workProgramService";
import { organizationService } from "../../services/organization";
import { anggotaService } from "../../services/anggota";
import MainLayout from "../../components/layout/MainLayout";
import { getStoragePath } from "../../utils/storageUrl";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  X,
  Loader2,
  Building2,
  Briefcase,
  User,
  FileText,
  Image,
  Paperclip,
  Upload,
  Save,
  PlusCircle,
  Trash,
  File,
  FileImage,
  FileArchive,
  Camera,
  FileCheck,
  Pencil,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Activities = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

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
  const [filteredWorkPrograms, setFilteredWorkPrograms] = useState([]);
  const [anggotas, setAnggotas] = useState([]);
  const [filteredAnggotas, setFilteredAnggotas] = useState([]);
  
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

  const [total_pengeluaran, setTotalPengeluaran] = useState("");
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

  const MAX_PHOTOS = 5;

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  };

  const getImageUrl = (path) => {
    if (!path) return "";
    return getStoragePath(path);
  };

  const getFileIcon = (fileName, fileType) => {
    if (!fileName) return <Paperclip className="w-4 h-4" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="w-4 h-4 text-green-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext)) return <FileArchive className="w-4 h-4 text-green-600" />;
    return <Paperclip className="w-4 h-4 text-gray-400" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <FileCheck className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
  ];

  const fetchActivities = useCallback(
    async (page = 1) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoading(true);

      const params = {
        page,
        per_page: pagination.per_page,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (filterOrganization) {
        params.organization_id = filterOrganization;
      }
      if (filterWorkProgram) {
        params.work_program_id = filterWorkProgram;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }

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
        error("Gagal", result.message);
      }

      setLoading(false);
      isFetchingRef.current = false;
    },
    [pagination.per_page, error, search, filterOrganization, filterWorkProgram, filterStatus],
  );

  const fetchParentMWC = useCallback(async () => {
    if (!isRanting || !userOrganizationId || parentMWCLoaded) return null;
    
    try {
      const result = await organizationService.getById(userOrganizationId);
      if (result.success && result.data) {
        const organization = result.data.data || result.data;
        if (organization.parent_id) {
          const parentResult = await organizationService.getById(organization.parent_id);
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

  const fetchWorkPrograms = useCallback(async (mwcId = null) => {
    const result = await workProgramService.getWorkPrograms({ per_page: 1000 });
    
    if (result.success) {
      let programs = result.data.data || [];
      let filtered = [];
      
      if (isSuperAdmin) {
        filtered = programs;
      } else if (isPC) {
        filtered = programs.filter(p => {
          const orgParentId = p.organization?.parent_id || p.parent_organization_id;
          return orgParentId === userOrganizationId;
        });
      } else if (isMWC) {
        filtered = programs.filter(p => p.organization_id === userOrganizationId);
      } else if (isRanting) {
        const mwcIdToUse = mwcId || parentMWCId;
        filtered = programs.filter(p => p.organization_id === mwcIdToUse);
      } else {
        filtered = programs;
      }
      
      setWorkPrograms(filtered);
      setFilteredWorkPrograms(filtered);
    }
  }, [isSuperAdmin, isPC, isMWC, isRanting, userOrganizationId, parentMWCId]);

  const fetchOrganizations = useCallback(async () => {
    const result = await organizationService.getAll({ per_page: 1000 });
    if (result.success) {
      let orgs = result.data.data || [];
      
      if (isSuperAdmin) {
        setOrganizations(orgs);
      } else if (isPC) {
        orgs = orgs.filter(org => org.level?.slug === "mwc" && org.parent_id === userOrganizationId);
        setOrganizations(orgs);
      } else if (isMWC) {
        orgs = orgs.filter(org => org.level?.slug === "ranting" && org.parent_id === userOrganizationId);
        setOrganizations(orgs);
      } else if (isRanting) {
        orgs = orgs.filter(org => org.id === userOrganizationId);
        setOrganizations(orgs);
      } else {
        setOrganizations(orgs);
      }
    }
  }, [isSuperAdmin, isPC, isMWC, isRanting, userOrganizationId]);

  const fetchAnggotasByOrganization = async (organizationId) => {
    if (!organizationId) {
      setAnggotas([]);
      setFilteredAnggotas([]);
      return;
    }
    
    const result = await anggotaService.getAll({ 
      per_page: 1000,
      organization_id: organizationId
    });
    if (result.success) {
      let anggotaList = result.data.data || [];
      setAnggotas(anggotaList);
      setFilteredAnggotas(anggotaList);
    }
  };

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
  }, [search, filterOrganization, filterWorkProgram, filterStatus, initialLoading, fetchActivities]);

  useEffect(() => {
    if (formData.work_program_id) {
      const selectedProgram = workPrograms.find(wp => wp.id === parseInt(formData.work_program_id));
      if (selectedProgram) {
        if (isMWC) {
          setFormData(prev => ({ ...prev, organization_id: "" }));
          setFilteredAnggotas([]);
        } else if (isRanting) {
          setFormData(prev => ({ ...prev, organization_id: userOrganizationId.toString() }));
          fetchAnggotasByOrganization(userOrganizationId);
        } else if (isPC) {
          const orgId = selectedProgram.organization_id;
          if (orgId) {
            setFormData(prev => ({ ...prev, organization_id: orgId.toString() }));
            fetchAnggotasByOrganization(orgId);
          }
        }
      }
    } else {
      setFormData(prev => ({ ...prev, organization_id: "" }));
      setFilteredAnggotas([]);
    }
  }, [formData.work_program_id, workPrograms, isMWC, isRanting, isPC, userOrganizationId]);

  useEffect(() => {
    if (formData.organization_id) {
      fetchAnggotasByOrganization(parseInt(formData.organization_id));
      setFormData(prev => ({ ...prev, penanggung_jawab_id: "" }));
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
  }, [fetchOrganizations, fetchWorkPrograms, fetchParentMWC, isRanting, fetchActivities]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    fetchActivities(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
    
    const rawTotal = activity.total_pengeluaran ? Math.floor(parseFloat(activity.total_pengeluaran)).toString() : "";
    setTotalPengeluaran(rawTotal);
    setCatatan(activity.catatan || "");
    
    setExistingPhotos(activity.photos || []);
    setExistingExpensePhotos(activity.expense_photos || []);
    
    if (activity.expense_descriptions && activity.expense_descriptions.length > 0) {
      const formattedExpenses = activity.expense_descriptions.map(exp => ({
        ...exp,
        amount: exp.amount ? Math.floor(parseFloat(exp.amount)).toString() : "0"
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

  const openDetail = (activity) => {
    setSelectedActivity(activity);
    setIsEditingDetail(false);
    
    const rawTotal = activity.total_pengeluaran ? Math.floor(parseFloat(activity.total_pengeluaran)).toString() : "";
    
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
    
    setShowDetail(true);
  };

  const handleDetailFileChange = (e, type) => {
    const files = Array.from(e.target.files);

    if (type === "photos") {
      const newPhotos = [...detailPhotos, ...files];
      if (newPhotos.length + (selectedActivity?.photos?.length || 0) - detailDeletedPhotoIds.length > MAX_PHOTOS) {
        warning("Peringatan", `Maksimal ${MAX_PHOTOS} foto kegiatan`);
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
  };

  const handleDetailRemoveFile = (index, type) => {
    if (type === "photos") {
      URL.revokeObjectURL(detailPhotoPreviews[index]);
      setDetailPhotos((prev) => prev.filter((_, i) => i !== index));
      setDetailPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    } else if (type === "expense_photos") {
      URL.revokeObjectURL(detailExpensePhotoPreviews[index]);
      setDetailExpensePhotos((prev) => prev.filter((_, i) => i !== index));
      setDetailExpensePhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDetailRemoveExistingPhoto = (photoId) => {
    setDetailDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  const handleDetailRemoveExistingExpensePhoto = (photoId) => {
    setDetailDeletedExpensePhotoIds((prev) => [...prev, photoId]);
  };

  const handleDetailSubmit = async () => {
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
    
    detailPhotos.forEach((photo) => {
      submitData.append("photos[]", photo);
    });
    
    detailExpensePhotos.forEach((photo) => {
      submitData.append("expense_photos[]", photo);
    });

    const result = await activityService.update(selectedActivity.id, submitData);

    if (result.success) {
      success("Berhasil", "Data kegiatan berhasil diperbarui");
      setIsEditingDetail(false);
      resetDetailForm();
      await fetchActivities(pagination.current_page);
      
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
    setDetailSubmitting(false);
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
    setExpenseDescriptions([...expenseDescriptions, { description: "", amount: "0" }]);
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
      if (total_pengeluaran) {
        const rawNumber = total_pengeluaran.toString().replace(/\D/g, "");
        submitData.append("total_pengeluaran", rawNumber);
      }
      if (catatan) submitData.append("catatan", catatan);
      
      if (expenseDescriptions.length > 0) {
        const formattedExpenses = expenseDescriptions.map(exp => ({
          description: exp.description,
          amount: parseInt(exp.amount) || 0
        }));
        submitData.append("expense_descriptions", JSON.stringify(formattedExpenses));
      }
      
      if (deletedPhotoIds.length > 0) {
        submitData.append("deleted_photo_ids", JSON.stringify(deletedPhotoIds));
      }
      if (deletedExpensePhotoIds.length > 0) {
        submitData.append("deleted_expense_photo_ids", JSON.stringify(deletedExpensePhotoIds));
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num).replace("IDR", "Rp");
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    let number;
    if (typeof value === 'string' && value.includes('.')) {
      number = value.split('.')[0];
    } else {
      number = value.toString();
    }
    const cleanNumber = number.replace(/\D/g, "");
    if (!cleanNumber) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(cleanNumber));
  };

  const handleRupiahChange = (e, setter) => {
    const value = e.target.value.replace(/\D/g, "");
    setter(value);
  };

  const hasActiveFilters = search || filterOrganization || filterWorkProgram || filterStatus;

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchActivities(newPage);
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
                    {filteredWorkPrograms.map((wp) => (
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
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
                    {activities.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
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
                      activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
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
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(activity.status)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openDetail(activity)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditForm(activity)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(activity)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
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
              {pagination.last_page > 1 && !loading && activities.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) pageNum = i + 1;
                        else if (pagination.current_page <= 3) pageNum = i + 1;
                        else if (pagination.current_page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                        else pageNum = pagination.current_page - 2 + i;
                        return (
                          <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                            pagination.current_page === pageNum ? "bg-emerald-600 text-white shadow-md" : "border border-gray-300 hover:bg-white"
                          }`}>
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form - Create/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingActivity ? "Lengkapi data kegiatan" : "Isi form berikut untuk menambahkan kegiatan baru"}
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Program Kerja <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="work_program_id"
                    value={formData.work_program_id}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.work_program_id ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="">Pilih Program Kerja</option>
                    {filteredWorkPrograms.map((wp) => (
                      <option key={wp.id} value={wp.id}>
                        {wp.nama_program}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.work_program_id && <p className="mt-1 text-xs text-red-500">{formErrors.work_program_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Organisasi Pelaksana <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {isRanting ? (
                    <input
                      type="text"
                      value={userOrganizationName || "Memuat..."}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                    />
                  ) : isMWC ? (
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.organization_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={!formData.work_program_id}
                    >
                      <option value="">Pilih Organisasi Pelaksana</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.nama}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700">
                      {organizations.find(o => o.id === parseInt(formData.organization_id))?.nama || "Pilih program kerja terlebih dahulu"}
                    </div>
                  )}
                </div>
                {formErrors.organization_id && <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_kegiatan"
                  value={formData.nama_kegiatan}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama_kegiatan ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Masukkan nama kegiatan"
                />
                {formErrors.nama_kegiatan && <p className="mt-1 text-xs text-red-500">{formErrors.nama_kegiatan}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="penanggung_jawab_id"
                    value={formData.penanggung_jawab_id}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.penanggung_jawab_id ? "border-red-500" : "border-gray-200"
                    }`}
                    disabled={!formData.organization_id}
                  >
                    <option value="">Pilih Penanggung Jawab</option>
                    {filteredAnggotas.map((anggota) => (
                      <option key={anggota.id} value={anggota.id}>
                        {anggota.nama} {anggota.jabatan?.nama ? `- ${anggota.jabatan.nama}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.penanggung_jawab_id && <p className="mt-1 text-xs text-red-500">{formErrors.penanggung_jawab_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_pelaksanaan"
                  value={formData.tanggal_pelaksanaan}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.tanggal_pelaksanaan ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {formErrors.tanggal_pelaksanaan && <p className="mt-1 text-xs text-red-500">{formErrors.tanggal_pelaksanaan}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Deskripsi Kegiatan
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Deskripsi singkat tentang kegiatan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Status Kegiatan
                </label>
                <div className="relative">
                  <FileCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingActivity && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Informasi Keuangan & Dokumentasi</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Total Pengeluaran
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="text"
                        value={total_pengeluaran ? formatRupiah(total_pengeluaran) : ""}
                        onChange={(e) => handleRupiahChange(e, setTotalPengeluaran)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Rincian Pengeluaran
                      </label>
                      <button
                        type="button"
                        onClick={addExpenseDescription}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Tambah Rincian
                      </button>
                    </div>
                    {expenseDescriptions.map((expense, idx) => (
                      <div key={idx} className="flex gap-3 mb-2 items-start">
                        <input
                          type="text"
                          placeholder="Deskripsi pengeluaran"
                          value={expense.description}
                          onChange={(e) => updateExpenseDescription(idx, "description", e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="relative w-40">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Rp</span>
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
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      placeholder="Catatan tambahan tentang kegiatan"
                    />
                  </div>

                  {existingPhotos.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Foto Kegiatan Saat Ini
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {existingPhotos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={getImageUrl(photo.file_path)}
                              alt="Kegiatan"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingPhoto(photo.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Foto Kegiatan Baru
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "photos")}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                    {photoPreviews.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {photoPreviews.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <img src={preview} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                            <button type="button" onClick={() => removeFile(idx, "photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {existingExpensePhotos.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Foto Bukti Pengeluaran Saat Ini
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {existingExpensePhotos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={getImageUrl(photo.file_path)}
                              alt="Bukti Pengeluaran"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingExpensePhoto(photo.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Foto Bukti Pengeluaran Baru
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, "expense_photos")}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                    />
                    {expensePhotoPreviews.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {expensePhotoPreviews.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <img src={preview} alt={`Expense Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                            <button type="button" onClick={() => removeFile(idx, "expense_photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : (editingActivity ? "Update" : "Simpan")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {showDetail && selectedActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {isEditingDetail ? "Edit informasi kegiatan" : "Informasi lengkap kegiatan"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingDetail ? (
                    <button
                      onClick={() => setIsEditingDetail(true)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                      title="Edit Kegiatan"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditingDetail(false);
                        resetDetailForm();
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                      title="Batal Edit"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => setShowDetail(false)} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Informasi Dasar Kegiatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Nama Kegiatan</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{selectedActivity.nama_kegiatan}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Program Kerja</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.work_program?.nama_program || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Organisasi Pelaksana</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.organization?.nama || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Penanggung Jawab</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.penanggung_jawab?.nama || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pelaksanaan</p>
                  <p className="text-sm text-gray-800 mt-1">{formatDate(selectedActivity.tanggal_pelaksanaan)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedActivity.status)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Dibuat Oleh</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.creator?.name || "-"}</p>
                </div>
              </div>

              {selectedActivity.deskripsi && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Deskripsi</p>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{selectedActivity.deskripsi}</p>
                </div>
              )}

              {/* Bagian Keuangan & Dokumentasi */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-md font-semibold text-gray-700">Informasi Keuangan & Dokumentasi</h3>
                  {!isEditingDetail && (
                    <span className="text-xs text-gray-400 ml-2">(Klik tombol pensil untuk edit)</span>
                  )}
                </div>

                {!isEditingDetail ? (
                  // Mode Tampilan
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Total Pengeluaran</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(selectedActivity.total_pengeluaran)}</p>
                    </div>

                    {selectedActivity.catatan && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Catatan</p>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{selectedActivity.catatan}</p>
                      </div>
                    )}

                    {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          <Camera className="w-4 h-4 inline mr-1" /> Foto Kegiatan ({selectedActivity.photos.length}/{MAX_PHOTOS})
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedActivity.photos.map((photo, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={getImageUrl(photo.file_path)}
                                alt={`Kegiatan ${idx + 1}`}
                                className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200"
                                onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedActivity.expense_photos && selectedActivity.expense_photos.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          <Image className="w-4 h-4 inline mr-1" /> Foto Bukti Pengeluaran
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedActivity.expense_photos.map((photo, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={getImageUrl(photo.file_path)}
                                alt={`Bukti ${idx + 1}`}
                                className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200"
                                onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Mode Edit
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Total Pengeluaran
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input
                          type="text"
                          value={detailFormData.total_pengeluaran ? formatRupiah(detailFormData.total_pengeluaran) : ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setDetailFormData(prev => ({ ...prev, total_pengeluaran: value }));
                          }}
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Catatan Tambahan
                      </label>
                      <textarea
                        value={detailFormData.catatan}
                        onChange={(e) => setDetailFormData(prev => ({ ...prev, catatan: e.target.value }))}
                        rows="3"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        placeholder="Catatan tambahan tentang kegiatan"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Status Kegiatan
                      </label>
                      <div className="relative">
                        <FileCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={detailFormData.status}
                          onChange={(e) => setDetailFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Existing Photos */}
                    {selectedActivity.photos && selectedActivity.photos.filter(p => !detailDeletedPhotoIds.includes(p.id)).length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Foto Kegiatan Saat Ini
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {selectedActivity.photos.map((photo) => (
                            !detailDeletedPhotoIds.includes(photo.id) && (
                              <div key={photo.id} className="relative">
                                <img
                                  src={getImageUrl(photo.file_path)}
                                  alt="Kegiatan"
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDetailRemoveExistingPhoto(photo.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Photos Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Foto Kegiatan Baru 
                        <span className="text-xs text-gray-500 ml-2">
                          (Maksimal {MAX_PHOTOS} foto, {(selectedActivity.photos?.length || 0) - detailDeletedPhotoIds.length + detailPhotos.length}/{MAX_PHOTOS})
                        </span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleDetailFileChange(e, "photos")}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                      />
                      {detailPhotoPreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detailPhotoPreviews.map((preview, idx) => (
                            <div key={idx} className="relative">
                              <img src={preview} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                              <button type="button" onClick={() => handleDetailRemoveFile(idx, "photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Existing Expense Photos */}
                    {selectedActivity.expense_photos && selectedActivity.expense_photos.filter(p => !detailDeletedExpensePhotoIds.includes(p.id)).length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Foto Bukti Pengeluaran Saat Ini
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {selectedActivity.expense_photos.map((photo) => (
                            !detailDeletedExpensePhotoIds.includes(photo.id) && (
                              <div key={photo.id} className="relative">
                                <img
                                  src={getImageUrl(photo.file_path)}
                                  alt="Bukti Pengeluaran"
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDetailRemoveExistingExpensePhoto(photo.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Expense Photos Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Foto Bukti Pengeluaran Baru
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleDetailFileChange(e, "expense_photos")}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                      />
                      {detailExpensePhotoPreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detailExpensePhotoPreviews.map((preview, idx) => (
                            <div key={idx} className="relative">
                              <img src={preview} alt={`Expense Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                              <button type="button" onClick={() => handleDetailRemoveFile(idx, "expense_photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowDetail(false)} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200">
                Tutup
              </button>
              {isEditingDetail ? (
                <button onClick={handleDetailSubmit} disabled={detailSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200">
                  {detailSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                </button>
              ) : (
                <button onClick={() => openEditForm(selectedActivity)} className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Lengkap
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Activities;