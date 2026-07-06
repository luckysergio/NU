// src/pages/anggotas/AnggotaModal.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useAnggota } from "../../hooks/useAnggota"; // ✅ Import hook
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
  Loader2
} from "lucide-react";

const getFotoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith('http://') || foto.startsWith('https://')) {
    return foto;
  }
  const baseUrl = import.meta.env.VITE_STORAGE_URL || 
                  import.meta.env.VITE_BASE_URL || 
                  'http://localhost:8000';
  const cleanBaseUrl = baseUrl.replace(/\/storage$/, '');
  const cleanPath = foto.replace(/^\/storage\//, '');
  return `${cleanBaseUrl}/storage/${cleanPath}`;
};

const LEVEL_ORDER = {
  pc: 1,
  mwc: 2,
  ranting: 3,
  'anak-ranting': 4,
  lembaga: 5,
  banom: 6,
};

const LEVEL_DISPLAY = {
  pc: 'PCNU',
  mwc: 'MWCNU',
  ranting: 'RANTING',
  'anak-ranting': 'ANAK RANTING',
  lembaga: 'LEMBAGA',
  banom: 'BANOM',
};

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
  const { success, error } = useModal();
  
  // ✅ PERBAIKAN: Gunakan mutation dari hook (sama seperti organizations)
  const { create, update, isCreating, isUpdating } = useAnggota();
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: "",
    jabatan_id: "",
    no_anggota: "",
    nama: "",
    no_hp: "",
    alamat: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [filteredJabatans, setFilteredJabatans] = useState([]);
  const [loadingJabatans, setLoadingJabatans] = useState(false);
  const fileInputRef = useRef(null);

  const isRestrictedLevel = propIsRestrictedLevel || 
    ["mwc", "ranting", "anak-ranting", "lembaga", "banom"].includes(userOrgLevel);
  
  const getUserOrganizationId = () => {
    if (propUserOrganizationId) return propUserOrganizationId;
    if (currentUser?.organization?.id) return currentUser.organization.id;
    if (currentUser?.organization_id) return currentUser.organization_id;
    return null;
  };

  const userOrganizationId = getUserOrganizationId();

  const getOrgLevelSlug = (org) => {
    if (!org) return null;
    if (typeof org.level === "string") return org.level;
    if (org.level?.slug) return org.level.slug;
    return null;
  };

  const getAllDescendantOrganizations = (orgs, parentId) => {
    const result = [];
    const children = orgs.filter(org => org.parent_id === parentId);
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendantOrganizations(orgs, child.id));
    }
    return result;
  };

  const getHierarchicalOrganizations = useMemo(() => {
    if (!allOrganizations || allOrganizations.length === 0) {
      return organizations || [];
    }

    let accessibleOrgs = [];
    
    if (isRestrictedLevel && userOrganizationId) {
      const userOrg = allOrganizations.find(org => org.id === userOrganizationId);
      if (userOrg) {
        const descendants = getAllDescendantOrganizations(allOrganizations, userOrganizationId);
        accessibleOrgs = [userOrg, ...descendants];
      } else {
        accessibleOrgs = allOrganizations;
      }
    } else {
      accessibleOrgs = allOrganizations;
    }

    return accessibleOrgs.sort((a, b) => {
      const levelA = getOrgLevelSlug(a);
      const levelB = getOrgLevelSlug(b);
      
      const orderA = LEVEL_ORDER[levelA] || 99;
      const orderB = LEVEL_ORDER[levelB] || 99;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return (a.nama || '').localeCompare(b.nama || '');
    });
  }, [allOrganizations, organizations, isRestrictedLevel, userOrganizationId]);

  const getDefaultOrganizationId = () => {
    if (editingAnggota && editingAnggota.organization_id) {
      return editingAnggota.organization_id.toString();
    }
    if (isRestrictedLevel && userOrganizationId) {
      return userOrganizationId.toString();
    }
    if (defaultOrgId) {
      return defaultOrgId.toString();
    }
    const hierarchicalOrgs = getHierarchicalOrganizations;
    if (hierarchicalOrgs.length === 1 && hierarchicalOrgs[0]?.id) {
      return hierarchicalOrgs[0].id.toString();
    }
    return "";
  };

  const filterJabatansByOrganization = async (orgId) => {
    if (!orgId) {
      setFilteredJabatans(jabatans);
      return;
    }

    setLoadingJabatans(true);
    try {
      const selectedOrg = allOrganizations.find(org => org.id === parseInt(orgId));
      if (!selectedOrg) {
        setFilteredJabatans(jabatans);
        return;
      }

      const levelSlug = getOrgLevelSlug(selectedOrg);
      if (!levelSlug) {
        setFilteredJabatans(jabatans);
        return;
      }

      const result = await jabatanService.getByLevel(levelSlug);
      if (result.success && result.data) {
        setFilteredJabatans(result.data);
      } else {
        const filtered = jabatans.filter(jab => 
          jab.level === levelSlug || 
          (jab.levels && Array.isArray(jab.levels) && jab.levels.includes(levelSlug))
        );
        setFilteredJabatans(filtered);
      }
    } catch (err) {
      console.error("Error fetching jabatans by level:", err);
      setFilteredJabatans(jabatans);
    } finally {
      setLoadingJabatans(false);
    }
    
    setFormData(prev => ({ ...prev, jabatan_id: "" }));
  };

  const getOrganizationDisplayName = (org) => {
    if (!org) return "";
    const levelDisplay = LEVEL_DISPLAY[getOrgLevelSlug(org)] || '';
    return levelDisplay ? `${org.nama} (${levelDisplay})` : org.nama;
  };

  useEffect(() => {
    if (editingAnggota) {
      const orgId = editingAnggota.organization_id?.toString() || "";
      setFormData({
        organization_id: orgId,
        jabatan_id: editingAnggota.jabatan_id?.toString() || "",
        no_anggota: editingAnggota.no_anggota || "",
        nama: editingAnggota.nama || "",
        no_hp: editingAnggota.no_hp || "",
        alamat: editingAnggota.alamat || "",
        is_active: editingAnggota.is_active ?? true,
      });
      
      if (orgId) {
        filterJabatansByOrganization(orgId);
      }
      
      if (editingAnggota.foto) {
        setFotoPreview(getFotoUrl(editingAnggota.foto));
      } else {
        setFotoPreview(null);
      }
    } else {
      const defaultOrg = getDefaultOrganizationId();
      setFormData({
        organization_id: defaultOrg,
        jabatan_id: "",
        no_anggota: "",
        nama: "",
        no_hp: "",
        alamat: "",
        is_active: true,
      });
      
      if (defaultOrg) {
        filterJabatansByOrganization(defaultOrg);
      } else {
        setFilteredJabatans(jabatans);
      }
      
      setFotoPreview(null);
      setFotoFile(null);
    }
  }, [editingAnggota, organizations, allOrganizations, jabatans]);

  useEffect(() => {
    if (!editingAnggota && !formData.organization_id) {
      const defaultOrg = getDefaultOrganizationId();
      if (defaultOrg) {
        setFormData(prev => ({ ...prev, organization_id: defaultOrg }));
        filterJabatansByOrganization(defaultOrg);
      }
    }
  }, [organizations, allOrganizations, editingAnggota]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.organization_id) errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.jabatan_id) errors.jabatan_id = "Jabatan wajib dipilih";
    if (!formData.nama.trim()) errors.nama = "Nama anggota wajib diisi";
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      error("Error", "Format file harus JPG, JPEG, PNG, atau WEBP");
      e.target.value = "";
      return;
    }

    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================
  // ✅ SUBMIT HANDLER - GUNAKAN MUTATION DARI HOOK
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    const submitData = new FormData();
    submitData.append('organization_id', parseInt(formData.organization_id));
    submitData.append('jabatan_id', parseInt(formData.jabatan_id));
    submitData.append('nama', formData.nama);
    submitData.append('is_active', formData.is_active ? 'true' : 'false');
    
    if (formData.no_anggota) submitData.append('no_anggota', formData.no_anggota);
    if (formData.no_hp) submitData.append('no_hp', formData.no_hp);
    if (formData.alamat) submitData.append('alamat', formData.alamat);
    if (fotoFile) submitData.append('foto', fotoFile);

    console.log('📤 Submitting form data...');

    // ✅ PERBAIKAN: Gunakan mutation dari hook dengan callback pattern
    const mutationOptions = {
      onSuccess: (result) => {
        console.log('✅ Mutation success:', result);
        success("Berhasil", editingAnggota ? "Anggota berhasil diperbarui" : "Anggota baru berhasil dibuat");
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        console.error('❌ Mutation error:', err);
        if (err.response?.data?.errors) {
          const formattedErrors = {};
          Object.keys(err.response.data.errors).forEach(key => {
            formattedErrors[key] = err.response.data.errors[key][0] || err.response.data.errors[key];
          });
          setFormErrors(formattedErrors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error("Gagal", err.response?.data?.message || err.message || "Terjadi kesalahan internal server");
        }
      },
      onSettled: () => {
        setSubmitting(false);
      }
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
      if (value) {
        filterJabatansByOrganization(value);
      } else {
        setFilteredJabatans(jabatans);
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

  const isOrgDisabled = editingAnggota || isRestrictedLevel;

  const getSelectedOrganizationName = () => {
    if (!formData.organization_id) return "";
    const org = getHierarchicalOrganizations.find(o => o.id.toString() === formData.organization_id);
    if (org) return getOrganizationDisplayName(org);
    const allOrg = allOrganizations?.find(o => o.id.toString() === formData.organization_id);
    if (allOrg) return getOrganizationDisplayName(allOrg);
    return "";
  };

  const getRestrictedInfoMessage = () => {
    if (isRestrictedLevel && !editingAnggota) {
      return `Anda hanya dapat menambahkan anggota untuk organisasi di bawah wewenang Anda.`;
    }
    if (isRestrictedLevel && editingAnggota) {
      return "Anda hanya dapat mengedit anggota di organisasi wewenang Anda.";
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingAnggota ? "Edit Anggota" : "Tambah Anggota Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingAnggota ? "Ubah data anggota organisasi" : "Isi form berikut untuk menambahkan anggota baru"}
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

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200 hover:border-emerald-400 transition-all">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Foto Anggota
                <span className="text-xs font-normal text-gray-500 ml-2">(Opsional, max 2MB)</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {fotoPreview ? (
                  <div className="relative group">
                    <img 
                      src={fotoPreview} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={removeFoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
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
                    <Image className="w-4 h-4" />
                    {fotoPreview ? "Ganti Foto" : "Pilih Foto"}
                  </label>
                  {fotoFile && (
                    <p className="text-xs text-emerald-600">
                      File: {fotoFile.name} ({(fotoFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Format: JPG, JPEG, PNG, WEBP • Maks: 2MB
                  </p>
                </div>
              </div>
            </div>

            {getRestrictedInfoMessage() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">{getRestrictedInfoMessage()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Organisasi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  
                  {isOrgDisabled && formData.organization_id ? (
                    <div className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed">
                      <span className="text-gray-700">{getSelectedOrganizationName()}</span>
                    </div>
                  ) : (
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleChange}
                      disabled={isOrgDisabled}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.organization_id ? "border-red-500" : "border-gray-200"
                      } ${isOrgDisabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                    >
                      <option value="">Pilih Organisasi</option>
                      {getHierarchicalOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {getOrganizationDisplayName(org)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {formErrors.organization_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Jabatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="jabatan_id"
                    value={formData.jabatan_id}
                    onChange={handleChange}
                    disabled={!formData.organization_id || loadingJabatans}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.jabatan_id ? "border-red-500" : "border-gray-200"
                    } ${(!formData.organization_id || loadingJabatans) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  >
                    <option value="">
                      {loadingJabatans ? "Memuat jabatan..." : 
                       !formData.organization_id ? "Pilih organisasi terlebih dahulu" : "Pilih Jabatan"}
                    </option>
                    {filteredJabatans.map((jab) => (
                      <option key={jab.id} value={jab.id}>
                        {jab.nama}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.jabatan_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.jabatan_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nomor Anggota
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="no_anggota"
                    value={formData.no_anggota}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Masukkan nomor anggota (opsional)"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  * Kosongkan jika ingin diisi otomatis
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.nama ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                {formErrors.nama && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  No. Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Alamat
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Alamat lengkap anggota"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
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
            {(submitting || isCreating || isUpdating) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnggotaModal;