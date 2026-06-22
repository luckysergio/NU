import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { anggotaService } from "../../services/anggota";
import { Phone, MapPin, Building2, Briefcase, User, X, Info } from "lucide-react";

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

  const isRestrictedLevel = propIsRestrictedLevel || 
    userOrgLevel === "mwc" || 
    userOrgLevel === "ranting" || 
    userOrgLevel === "anak-ranting" ||
    userOrgLevel === "lembaga" || 
    userOrgLevel === "banom";
  
  const getUserOrganizationId = () => {
    if (propUserOrganizationId) return propUserOrganizationId;
    if (currentUser?.organization?.id) return currentUser.organization.id;
    if (currentUser?.organization_id) return currentUser.organization_id;
    return null;
  };

  const userOrganizationId = getUserOrganizationId();

  // Fungsi untuk mendapatkan semua descendant organisasi
  const getAllDescendantOrganizations = (orgs, parentId) => {
    const result = [];
    const children = orgs.filter(org => org.parent_id === parentId);
    
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendantOrganizations(orgs, child.id));
    }
    
    return result;
  };

  // Mendapatkan organisasi yang dapat dipilih untuk form
  const getSelectableOrganizations = () => {
    if (!allOrganizations || allOrganizations.length === 0) {
      return organizations;
    }
    
    if (userOrgLevel === "pc" && userOrganizationId) {
      // PC dapat memilih semua organisasi di bawahnya
      const descendants = getAllDescendantOrganizations(allOrganizations, userOrganizationId);
      const pcOrg = allOrganizations.find(org => org.id === userOrganizationId);
      return pcOrg ? [pcOrg, ...descendants] : descendants;
    }
    
    if (userOrgLevel === "mwc" && userOrganizationId) {
      // MWC dapat memilih MWC sendiri + semua ranting dan anak ranting di bawahnya
      const descendants = getAllDescendantOrganizations(allOrganizations, userOrganizationId);
      const mwcOrg = allOrganizations.find(org => org.id === userOrganizationId);
      return mwcOrg ? [mwcOrg, ...descendants] : descendants;
    }
    
    if (userOrgLevel === "ranting" && userOrganizationId) {
      // Ranting dapat memilih ranting sendiri + semua anak ranting di bawahnya
      const descendants = getAllDescendantOrganizations(allOrganizations, userOrganizationId);
      const rantingOrg = allOrganizations.find(org => org.id === userOrganizationId);
      return rantingOrg ? [rantingOrg, ...descendants] : descendants;
    }
    
    return organizations;
  };

  const getDefaultOrganizationId = () => {
    if (editingAnggota && editingAnggota.organization_id) {
      return editingAnggota.organization_id.toString();
    }
    
    if (isRestrictedLevel && userOrganizationId) {
      return userOrganizationId.toString();
    }
    
    if (defaultOrgId) {
      return defaultOrgId;
    }
    
    const selectableOrgs = getSelectableOrganizations();
    if (selectableOrgs.length === 1 && selectableOrgs[0]?.id) {
      return selectableOrgs[0].id.toString();
    }
    
    return "";
  };

  useEffect(() => {
    if (editingAnggota) {
      setFormData({
        organization_id: editingAnggota.organization_id?.toString() || "",
        jabatan_id: editingAnggota.jabatan_id?.toString() || "",
        no_anggota: editingAnggota.no_anggota || "",
        nama: editingAnggota.nama || "",
        no_hp: editingAnggota.no_hp || "",
        alamat: editingAnggota.alamat || "",
        is_active: editingAnggota.is_active,
      });
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
    }
  }, [editingAnggota, organizations, allOrganizations, defaultOrgId, isRestrictedLevel, userOrganizationId, userOrgLevel]);

  useEffect(() => {
    if (!editingAnggota && !formData.organization_id) {
      const defaultOrg = getDefaultOrganizationId();
      if (defaultOrg) {
        setFormData(prev => ({ ...prev, organization_id: defaultOrg }));
      }
    }
  }, [organizations, allOrganizations, editingAnggota]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.organization_id)
      errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.jabatan_id) errors.jabatan_id = "Jabatan wajib dipilih";
    if (!formData.nama.trim()) errors.nama = "Nama anggota wajib diisi";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let result;

    const submitData = { ...formData };
    
    // Remove no_anggota if empty
    if (!submitData.no_anggota) {
      delete submitData.no_anggota;
    }

    if (editingAnggota) {
      result = await anggotaService.update(editingAnggota.id, submitData);
    } else {
      result = await anggotaService.create(submitData);
    }

    if (result.success) {
      success("Berhasil", result.message);
      onClose();
      onSuccess();
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const isOrgDisabled = editingAnggota || isRestrictedLevel;

  const getSelectedOrganizationName = () => {
    if (!formData.organization_id) return "";
    const org = organizations.find(o => o.id.toString() === formData.organization_id);
    if (org) return `${org.nama} ${org.level?.display_name ? `(${org.level.display_name})` : ''}`;
    
    // If not found in organizations, search in allOrganizations
    const allOrg = allOrganizations?.find(o => o.id.toString() === formData.organization_id);
    if (allOrg) return `${allOrg.nama} ${allOrg.level?.display_name ? `(${allOrg.level.display_name})` : ''}`;
    
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

  const selectableOrganizations = getSelectableOrganizations();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingAnggota ? "Edit Anggota" : "Tambah Anggota Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingAnggota
                  ? "Ubah data anggota organisasi"
                  : "Isi form berikut untuk menambahkan anggota baru"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {getRestrictedInfoMessage() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">{getRestrictedInfoMessage()}</p>
              </div>
            )}

            <div>
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
                    {selectableOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                
                {isOrgDisabled && formData.organization_id && (
                  <input
                    type="hidden"
                    name="organization_id"
                    value={formData.organization_id}
                  />
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
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.jabatan_id ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatans.map((jab) => (
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
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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

            <div>
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

            <div>
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

            <div>
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

            <div className="pt-3 border-t border-gray-100">
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
          </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnggotaModal;