import React, { useState, useEffect, useRef, useMemo } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useAnggota } from "../../hooks/useAnggota";
import { anggotaService } from "../../services/anggota";
import { jabatanService } from "../../services/jabatan";
import {
  Phone,
  MapPin,
  Building2,
  Briefcase,
  User,
  X,
  Info,
  Camera,
  Image,
  Trash2,
  IdCard,
  Loader2,
  Heart,
  GraduationCap,
  FileText,
  Search,
  UserCheck,
  Calendar,
  ChevronDown,
} from "lucide-react";

// =========================================================================
// HELPER FUNCTIONS & CONSTANTS (Outside Component)
// =========================================================================
const getFotoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
  const baseUrl =
    import.meta.env.VITE_STORAGE_URL ||
    import.meta.env.VITE_BASE_URL ||
    "http://localhost:8000";
  const cleanBaseUrl = baseUrl.replace(/\/storage$/, "");
  const cleanPath = foto.replace(/^\/storage\//, "");
  return `${cleanBaseUrl}/storage/${cleanPath}`;
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateValue.split("T")[0];
  }
  try {
    return new Date(dateValue).toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

const LEVEL_ORDER = {
  pc: 1,
  mwc: 2,
  ranting: 3,
  "anak-ranting": 4,
  lembaga: 5,
  banom: 6,
};

const LEVEL_DISPLAY = {
  pc: "PCNU",
  mwc: "MWCNU",
  ranting: "RANTING",
  "anak-ranting": "ANAK RANTING",
  lembaga: "LEMBAGA",
  banom: "BANOM",
};

const JENIS_KELAMIN_OPTIONS = [
  { value: "laki-laki", label: "Laki-laki" },
  { value: "perempuan", label: "Perempuan" },
];
const STATUS_PERKAWINAN_OPTIONS = [
  { value: "menikah", label: "Menikah" },
  { value: "belum menikah", label: "Belum Menikah" },
  { value: "cerai", label: "Cerai" },
];
const PENDIDIKAN_OPTIONS = [
  { value: "sd", label: "SD" },
  { value: "smp", label: "SMP" },
  { value: "sma/smk", label: "SMA/SMK" },
  { value: "d1", label: "D1" },
  { value: "d2", label: "D2" },
  { value: "d3", label: "D3" },
  { value: "s1", label: "S1" },
  { value: "s2", label: "S2" },
  { value: "s3", label: "S3" },
];

// =========================================================================
// COMPONENT
// =========================================================================
const AnggotaModal = ({
  isOpen,
  onClose,
  editingAnggota,
  organizations,
  allOrganizations,
  jabatans,
  onSuccess,
  canManage,
  userOrgLevel,
  defaultOrgId,
  currentUser,
  userOrganizationId: propUserOrganizationId,
  isRestrictedLevel: propIsRestrictedLevel,
}) => {
  // -----------------------------------------------------------------------
  // 1. ALL HOOKS MUST BE AT THE VERY TOP
  // -----------------------------------------------------------------------
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useAnggota();

  const [mode, setMode] = useState("new");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBiodata, setSelectedBiodata] = useState(null);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    biodata_id: "",
    organization_id: "",
    jabatan_id: "",
    no_anggota: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    status_perkawinan: "",
    pendidikan: "",
    no_hp: "",
    alamat: "",
    deskripsi: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [filteredJabatans, setFilteredJabatans] = useState([]);
  const [loadingJabatans, setLoadingJabatans] = useState(false);

  const fileInputRef = useRef(null);
  const orgDropdownRef = useRef(null);

  // -----------------------------------------------------------------------
  // 2. DERIVED VALUES & HELPERS (No Hooks)
  // -----------------------------------------------------------------------
  const isRestrictedLevel =
    propIsRestrictedLevel ||
    ["mwc", "ranting", "anak-ranting", "lembaga", "banom"].includes(userOrgLevel);
  const isOrgDisabled = isRestrictedLevel;
  const userOrganizationId =
    propUserOrganizationId ||
    currentUser?.organization?.id ||
    currentUser?.organization_id ||
    null;

  const getOrgLevelSlug = (org) => {
    if (!org) return null;
    if (typeof org.level === "string") return org.level;
    if (org.level?.slug) return org.level.slug;
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

  const getOrganizationDisplayName = (org) => {
    if (!org) return "";
    const levelDisplay = LEVEL_DISPLAY[getOrgLevelSlug(org)] || "";
    return levelDisplay ? `${org.nama} (${levelDisplay})` : org.nama;
  };

  const getDefaultOrganizationId = () => {
    if (editingAnggota?.organization_id) return editingAnggota.organization_id.toString();
    if (isRestrictedLevel && userOrganizationId) return userOrganizationId.toString();
    if (defaultOrgId) return defaultOrgId.toString();
    if (getHierarchicalOrganizations.length === 1) return getHierarchicalOrganizations[0].id.toString();
    return "";
  };

  // -----------------------------------------------------------------------
  // 3. MEMOS
  // -----------------------------------------------------------------------
  const getHierarchicalOrganizations = useMemo(() => {
    if (!allOrganizations || allOrganizations.length === 0) return organizations || [];
    let accessibleOrgs =
      isRestrictedLevel && userOrganizationId
        ? [
            allOrganizations.find((org) => org.id === userOrganizationId),
            ...getAllDescendantOrganizations(allOrganizations, userOrganizationId),
          ].filter(Boolean)
        : allOrganizations;

    return accessibleOrgs.sort((a, b) => {
      const orderA = LEVEL_ORDER[getOrgLevelSlug(a)] || 99;
      const orderB = LEVEL_ORDER[getOrgLevelSlug(b)] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [allOrganizations, organizations, isRestrictedLevel, userOrganizationId]);

  const filteredOrganizations = useMemo(() => {
    if (!orgSearchQuery.trim()) return getHierarchicalOrganizations;
    const query = orgSearchQuery.toLowerCase();
    return getHierarchicalOrganizations.filter((org) => {
      const levelDisplay = LEVEL_DISPLAY[getOrgLevelSlug(org)] || "";
      return (
        org.nama.toLowerCase().includes(query) ||
        levelDisplay.toLowerCase().includes(query)
      );
    });
  }, [getHierarchicalOrganizations, orgSearchQuery]);

  const selectedOrgName = useMemo(() => {
    if (!formData.organization_id) return "Pilih Organisasi";
    const org = getHierarchicalOrganizations.find(
      (o) => o.id.toString() === formData.organization_id
    );
    return org ? getOrganizationDisplayName(org) : "Pilih Organisasi";
  }, [formData.organization_id, getHierarchicalOrganizations]);

  // -----------------------------------------------------------------------
  // 4. EFFECTS
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------------------------------
  // 5. HANDLERS & ASYNC FUNCTIONS
  // -----------------------------------------------------------------------
  const filterJabatansByOrganization = async (orgId, preserveJabatanId = null) => {
    if (!orgId) {
      setFilteredJabatans(jabatans);
      if (preserveJabatanId === null) setFormData((prev) => ({ ...prev, jabatan_id: "" }));
      return;
    }
    setLoadingJabatans(true);
    try {
      const selectedOrg = allOrganizations.find((org) => org.id === parseInt(orgId));
      const levelSlug = selectedOrg ? getOrgLevelSlug(selectedOrg) : null;
      if (!levelSlug) {
        setFilteredJabatans(jabatans);
        return;
      }

      const result = await jabatanService.getByLevel(levelSlug);
      setFilteredJabatans(
        result.success && result.data
          ? result.data
          : jabatans.filter(
              (jab) => jab.level === levelSlug || (jab.levels && jab.levels.includes(levelSlug))
            )
      );
    } catch (err) {
      setFilteredJabatans(jabatans);
    } finally {
      setLoadingJabatans(false);
      if (preserveJabatanId === null) setFormData((prev) => ({ ...prev, jabatan_id: "" }));
    }
  };

  const handleSearchBiodata = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await anggotaService.getAll({ search: query, per_page: 10 });
      const itemsArray = Array.isArray(result.data?.data)
        ? result.data.data
        : Array.isArray(result.data)
        ? result.data
        : [];

      const uniqueBiodatas = [];
      const seen = new Set();

      itemsArray.forEach((item) => {
        const bio = item.biodata || item;
        if (bio && bio.id && !seen.has(bio.id)) {
          seen.add(bio.id);
          uniqueBiodatas.push(bio);
        }
      });

      setSearchResults(uniqueBiodatas);
    } catch (err) {
      console.error("Search error:", err);
      error("Gagal", "Terjadi kesalahan saat mencari data");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectExisting = (biodata) => {
    setSelectedBiodata(biodata);
    setFormData((prev) => ({
      ...prev,
      biodata_id: biodata.id.toString(),
      no_anggota: biodata.no_anggota || "",
      nama: biodata.nama || "",
      tempat_lahir: biodata.tempat_lahir || "",
      tanggal_lahir: formatDateForInput(biodata.tanggal_lahir),
      jenis_kelamin: biodata.jenis_kelamin || "",
      status_perkawinan: biodata.status_perkawinan || "",
      pendidikan: biodata.pendidikan || "",
      no_hp: biodata.no_hp || "",
      alamat: biodata.alamat || "",
      deskripsi: biodata.deskripsi || "",
      is_active: biodata.is_active ?? true,
    }));
    setFotoPreview(getFotoUrl(biodata.foto));
    setFormErrors((prev) => ({ ...prev, existing_biodata: "" }));
  };

  useEffect(() => {
    if (editingAnggota) {
      setMode("edit");
      const orgId = editingAnggota.organization_id?.toString() || "";
      const currentJabatanId = editingAnggota.jabatan_id?.toString() || "";
      const bio = editingAnggota.biodata || editingAnggota;

      setFormData({
        biodata_id: editingAnggota.biodata_id?.toString() || "",
        organization_id: orgId,
        jabatan_id: currentJabatanId,
        no_anggota: bio.no_anggota || editingAnggota.no_anggota || "",
        nama: bio.nama || editingAnggota.nama || "",
        tempat_lahir: bio.tempat_lahir || editingAnggota.tempat_lahir || "",
        tanggal_lahir: formatDateForInput(bio.tanggal_lahir || editingAnggota.tanggal_lahir),
        jenis_kelamin: bio.jenis_kelamin || editingAnggota.jenis_kelamin || "",
        status_perkawinan: bio.status_perkawinan || editingAnggota.status_perkawinan || "",
        pendidikan: bio.pendidikan || editingAnggota.pendidikan || "",
        no_hp: bio.no_hp || editingAnggota.no_hp || "",
        alamat: bio.alamat || editingAnggota.alamat || "",
        deskripsi: bio.deskripsi || editingAnggota.deskripsi || "",
        is_active: bio.is_active ?? editingAnggota.is_active ?? true,
      });

      if (orgId) filterJabatansByOrganization(orgId, currentJabatanId);
      const fotoUrl = bio.foto || editingAnggota.foto;
      setFotoPreview(getFotoUrl(fotoUrl));
    } else {
      setMode("new");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBiodata(null);
      setFotoFile(null);
      setFotoPreview(null);
      setFormErrors({});
      setOrgSearchQuery("");

      const defaultOrg = getDefaultOrganizationId();
      setFormData({
        biodata_id: "",
        organization_id: defaultOrg,
        jabatan_id: "",
        no_anggota: "",
        nama: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        jenis_kelamin: "",
        status_perkawinan: "",
        pendidikan: "",
        no_hp: "",
        alamat: "",
        deskripsi: "",
        is_active: true,
      });

      if (defaultOrg) {
        filterJabatansByOrganization(defaultOrg);
      } else {
        setFilteredJabatans(jabatans);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAnggota, isOpen, organizations, allOrganizations, jabatans]);

  // -----------------------------------------------------------------------
  // 6. EARLY RETURN (MUST BE AFTER ALL HOOKS)
  // -----------------------------------------------------------------------
  if (!isOpen) return null;

  // -----------------------------------------------------------------------
  // 7. FORM HANDLERS (No Hooks)
  // -----------------------------------------------------------------------
  const validateForm = () => {
    const errors = {};
    if (!formData.organization_id) errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.jabatan_id) errors.jabatan_id = "Jabatan wajib dipilih";

    if (mode === "new" || mode === "edit") {
      if (!formData.no_anggota || formData.no_anggota.trim() === "") errors.no_anggota = "Nomor anggota wajib diisi";
      if (!formData.nama || formData.nama.trim() === "") errors.nama = "Nama anggota wajib diisi";
    } else if (mode === "existing") {
      if (!selectedBiodata) errors.existing_biodata = "Silakan pilih anggota dari hasil pencarian";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      error("Error", "Ukuran file maksimal 2MB");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      error("Error", "Format file harus JPG, JPEG, PNG, atau WEBP");
      e.target.value = "";
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      error("Validasi Gagal", "Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    setSubmitting(true);

    const submitData = new FormData();
    submitData.append("organization_id", parseInt(formData.organization_id));
    submitData.append("jabatan_id", parseInt(formData.jabatan_id));
    submitData.append("is_active", formData.is_active ? "true" : "false");

    if (mode === "existing" && selectedBiodata) {
      submitData.append("biodata_id", selectedBiodata.id);
    } else {
      submitData.append("no_anggota", formData.no_anggota.trim());
      submitData.append("nama", formData.nama.trim());
      if (formData.tempat_lahir) submitData.append("tempat_lahir", formData.tempat_lahir.trim());
      if (formData.tanggal_lahir) submitData.append("tanggal_lahir", formData.tanggal_lahir);
      if (formData.jenis_kelamin) submitData.append("jenis_kelamin", formData.jenis_kelamin);
      if (formData.status_perkawinan) submitData.append("status_perkawinan", formData.status_perkawinan);
      if (formData.pendidikan) submitData.append("pendidikan", formData.pendidikan);
      if (formData.no_hp) submitData.append("no_hp", formData.no_hp);
      if (formData.alamat) submitData.append("alamat", formData.alamat);
      if (formData.deskripsi) submitData.append("deskripsi", formData.deskripsi);
      if (fotoFile) submitData.append("foto", fotoFile);
    }

    const mutationOptions = {
      onSuccess: () => {
        success("Berhasil", editingAnggota ? "Anggota berhasil diperbarui" : "Anggota berhasil ditambahkan");
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        if (err.response?.data?.errors) {
          const formattedErrors = {};
          Object.keys(err.response.data.errors).forEach((key) => {
            formattedErrors[key] = err.response.data.errors[key][0];
          });
          setFormErrors(formattedErrors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error("Gagal", err.response?.data?.message || err.message || "Terjadi kesalahan internal server");
        }
      },
      onSettled: () => setSubmitting(false),
    };

    if (editingAnggota) {
      update({ id: editingAnggota.id, data: submitData }, mutationOptions);
    } else {
      create(submitData, mutationOptions);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "organization_id") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (value) filterJabatansByOrganization(value);
      else {
        setFilteredJabatans(jabatans);
        setFormData((prev) => ({ ...prev, jabatan_id: "" }));
      }
      if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // -----------------------------------------------------------------------
  // 8. JSX RENDER
  // -----------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingAnggota ? "Edit Keanggotaan" : "Tambah Anggota"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingAnggota
                  ? "Ubah data organisasi dan jabatan"
                  : "Pilih organisasi, lalu tentukan data biodata"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={submitting || isCreating || isUpdating}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" /> Penempatan Organisasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SEARCHABLE ORGANIZATION DROPDOWN */}
                <div className="relative" ref={orgDropdownRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Organisasi <span className="text-red-500">*</span>
                  </label>
                  
                  {isOrgDisabled ? (
                    <div className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed flex items-center justify-between">
                      <span>{selectedOrgName}</span>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white flex items-center justify-between cursor-pointer transition-all ${
                          formErrors.organization_id ? "border-red-500" : "border-gray-200 hover:border-emerald-400"
                        }`}
                        onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                      >
                        <span className={`${formData.organization_id ? "text-gray-800" : "text-gray-400"}`}>
                          {selectedOrgName}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOrgDropdownOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isOrgDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Cari nama atau level..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                value={orgSearchQuery}
                                onChange={(e) => setOrgSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredOrganizations.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Organisasi tidak ditemukan
                              </div>
                            ) : (
                              filteredOrganizations.map((org) => (
                                <div
                                  key={org.id}
                                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                                    formData.organization_id === org.id.toString()
                                      ? "bg-emerald-50 text-emerald-700 font-medium"
                                      : "hover:bg-gray-50 text-gray-700"
                                  }`}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, organization_id: org.id.toString() }));
                                    filterJabatansByOrganization(org.id.toString());
                                    setIsOrgDropdownOpen(false);
                                    setOrgSearchQuery("");
                                    if (formErrors.organization_id) setFormErrors((prev) => ({ ...prev, organization_id: "" }));
                                  }}
                                >
                                  <span>{getOrganizationDisplayName(org)}</span>
                                  {formData.organization_id === org.id.toString() && (
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {formErrors.organization_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jabatan_id"
                    value={formData.jabatan_id}
                    onChange={handleChange}
                    disabled={!formData.organization_id || loadingJabatans}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.jabatan_id ? "border-red-500" : "border-gray-200"
                    } ${!formData.organization_id || loadingJabatans ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  >
                    <option value="">
                      {loadingJabatans ? "Memuat..." : !formData.organization_id ? "Pilih organisasi dulu" : "Pilih Jabatan"}
                    </option>
                    {filteredJabatans.map((jab) => (
                      <option key={jab.id} value={jab.id}>
                        {jab.nama}
                      </option>
                    ))}
                  </select>
                  {formErrors.jabatan_id && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.jabatan_id}</p>
                  )}
                </div>
              </div>
            </div>

            {!editingAnggota && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode("new");
                    setSelectedBiodata(null);
                    setSearchQuery("");
                    setSearchResults([]);
                    setFormErrors((prev) => ({ ...prev, existing_biodata: "" }));
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === "new" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <User className={`w-5 h-5 ${mode === "new" ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`font-bold ${mode === "new" ? "text-emerald-700" : "text-gray-700"}`}>
                      Biodata Baru
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Input data pribadi dan keanggotaan dari awal</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === "existing" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <UserCheck className={`w-5 h-5 ${mode === "existing" ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-bold ${mode === "existing" ? "text-blue-700" : "text-gray-700"}`}>
                      Sudah Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Tambah keanggotaan untuk orang yang sudah ada di database</p>
                </button>
              </div>
            )}

            {(mode === "new" || editingAnggota) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Foto Anggota <span className="text-xs font-normal text-gray-500">(Opsional, max 2MB)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {fotoPreview ? (
                      <div className="relative group">
                        <img src={fotoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-300" />
                        <button type="button" onClick={removeFoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="foto-input"
                      />
                      <label
                        htmlFor="foto-input"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-emerald-400 cursor-pointer transition-all text-sm font-medium text-gray-700"
                      >
                        <Image className="w-4 h-4" /> {fotoPreview ? "Ganti Foto" : "Pilih Foto"}
                      </label>
                      {fotoFile && (
                        <p className="text-xs text-emerald-600 mt-1">
                          {fotoFile.name} ({(fotoFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      No. Anggota <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="no_anggota"
                        value={formData.no_anggota}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.no_anggota ? "border-red-500" : "border-gray-200"}`}
                        placeholder="Contoh: 001-PC-2024"
                      />
                    </div>
                    {formErrors.no_anggota && <p className="mt-1 text-xs text-red-500">{formErrors.no_anggota}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${formErrors.nama ? "border-red-500" : "border-gray-200"}`}
                        placeholder="Nama lengkap sesuai KTP"
                      />
                    </div>
                    {formErrors.nama && <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                    <input
                      type="text"
                      name="tempat_lahir"
                      value={formData.tempat_lahir}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="Kota kelahiran"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="tanggal_lahir"
                        value={formData.tanggal_lahir}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                    <select
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      {JENIS_KELAMIN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status Perkawinan</label>
                    <select
                      name="status_perkawinan"
                      value={formData.status_perkawinan}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Pilih Status</option>
                      {STATUS_PERKAWINAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pendidikan Terakhir</label>
                    <select
                      name="pendidikan"
                      value={formData.pendidikan}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Pilih Pendidikan</option>
                      {PENDIDIKAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Telepon</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="no_hp"
                        value={formData.no_hp}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        placeholder="08123456789"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="Alamat lengkap"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Deskripsi <span className="text-xs font-normal text-gray-500">(Opsional)</span>
                    </label>
                    <textarea
                      name="deskripsi"
                      value={formData.deskripsi}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="Catatan tambahan"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "existing" && !editingAnggota && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Cari Anggota (Nama / No. Anggota) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchBiodata(e.target.value)}
                      placeholder="Ketik minimal 3 karakter..."
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${formErrors.existing_biodata ? "border-red-500" : "border-gray-200"}`}
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                  {formErrors.existing_biodata && <p className="mt-1 text-xs text-red-500">{formErrors.existing_biodata}</p>}
                </div>

                {searchResults.length > 0 && !selectedBiodata && (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                    {searchResults.map((bio) => (
                      <button
                        key={bio.id}
                        type="button"
                        onClick={() => handleSelectExisting(bio)}
                        className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                      >
                        {bio.foto ? (
                          <img src={getFotoUrl(bio.foto)} alt={bio.nama} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 shrink-0 bg-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 font-bold text-sm shrink-0 transition-colors">
                            {bio.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 group-hover:text-blue-700 truncate">{bio.nama}</div>
                          <div className="text-xs text-gray-500 truncate">{bio.no_anggota} • {bio.no_hp || "No HP tidak ada"}</div>
                        </div>
                        <UserCheck className="w-5 h-5 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedBiodata && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4 animate-in zoom-in-95 duration-200">
                    {selectedBiodata.foto ? (
                      <img src={getFotoUrl(selectedBiodata.foto)} alt={selectedBiodata.nama} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shrink-0 bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                        {selectedBiodata.nama.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-blue-900 text-base">{selectedBiodata.nama}</h4>
                          <p className="text-sm text-blue-700 font-medium">No. Anggota: {selectedBiodata.no_anggota}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBiodata(null);
                            setSearchQuery("");
                            setSearchResults([]);
                            setFormErrors((prev) => ({ ...prev, existing_biodata: "Silakan pilih anggota dari hasil pencarian" }));
                          }}
                          className="text-blue-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700">Status Aktif</span>
                  <p className="text-xs text-gray-500">Anggota ini dapat berpartisipasi dalam kegiatan organisasi</p>
                </div>
              </label>
            </div>
          </form>
        </div>

        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || isCreating || isUpdating}
            className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || isCreating || isUpdating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all"
          >
            {submitting || isCreating || isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>{editingAnggota ? "Simpan Perubahan" : "Simpan Anggota"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnggotaModal;