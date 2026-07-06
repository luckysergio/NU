import React, { useState, useEffect } from "react";
import { X, Loader2, Building2 } from "lucide-react";
import workProgramService from "../../services/workProgramService";

const WorkProgramFormModal = ({
  isOpen,
  onClose,
  mode,
  selectedProgram,
  initialThemeId,
  masterData,
  userContext,
  onSuccess,
  modalActions,
}) => {
  const {
    organizations,
    themes,
    fields,
    targets,
    goals,
    availableThemeOptions,
  } = masterData;
  const {
    isMWC,
    isRestrictedLevel,
    shouldAutoSelectOrg,
    userOrganizationId,
    userOrganizationName,
  } = userContext;
  const { success, error } = modalActions;

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultOrganizationId = () => {
    if (selectedProgram?.organization_id)
      return selectedProgram.organization_id.toString();
    if (isRestrictedLevel && userOrganizationId)
      return userOrganizationId.toString();
    if (shouldAutoSelectOrg && userOrganizationId)
      return userOrganizationId.toString();
    if (organizations.length === 1 && organizations[0]?.id)
      return organizations[0].id.toString();
    return "";
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && selectedProgram) {
        setFormData({
          organization_id: selectedProgram.organization_id?.toString() || "",
          theme_id: selectedProgram.theme_id?.toString() || "",
          field_id: selectedProgram.field_id?.toString() || "",
          target_id: selectedProgram.target_id?.toString() || "",
          goal_id: selectedProgram.goal_id?.toString() || "",
          nama_program: selectedProgram.nama_program,
          deskripsi: selectedProgram.deskripsi || "",
          tahun: selectedProgram.tahun,
          status: selectedProgram.status,
        });
      } else {
        setFormData({
          organization_id: getDefaultOrganizationId(),
          theme_id: initialThemeId ? initialThemeId.toString() : "",
          field_id: "",
          target_id: "",
          goal_id: "",
          nama_program: "",
          deskripsi: "",
          tahun: new Date().getFullYear(),
          status: "draft",
        });
      }
      setFormErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, selectedProgram, initialThemeId]);

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
    if (!orgId) errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.field_id) errors.field_id = "Bidang wajib dipilih";
    if (!formData.target_id) errors.target_id = "Sasaran wajib dipilih";
    if (!formData.goal_id) errors.goal_id = "Tujuan wajib dipilih";
    if (!formData.nama_program?.trim())
      errors.nama_program = "Nama program wajib diisi";
    if (!formData.tahun) errors.tahun = "Tahun wajib diisi";

    if (isMWC && formData.theme_id && mode === "create") {
      const isAvailable = availableThemeOptions.some(
        (t) => t.id === parseInt(formData.theme_id),
      );
      if (!isAvailable) errors.theme_id = "Tema ini sudah digunakan.";
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
    }
    if (!validateForm()) return;
    setIsSubmitting(true);
    if (!submitData.theme_id) submitData.theme_id = null;

    try {
      let result;
      if (mode === "create") {
        result = await workProgramService.createWorkProgram(submitData);
      } else {
        result = await workProgramService.updateWorkProgram(
          selectedProgram.id,
          submitData,
        );
      }

      if (result.success) {
        success("Berhasil", result.message);

        // ✅ PERBAIKAN: Kirim data program yang baru dibuat ke parent
        // agar parent bisa melakukan optimistic update (hapus tema dari list)
        if (typeof onSuccess === "function") {
          onSuccess({
            theme_id: submitData.theme_id,
            organization_id: submitData.organization_id,
            id: result.data?.id,
          });
        }

        onClose();
      } else {
        error("Gagal", result.message || "Terjadi kesalahan");
      }
    } catch (err) {
      error("Gagal", err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === "create" ? "Tambah" : "Edit"} Program Kerja
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {mode === "create"
                  ? "Isi form untuk program baru"
                  : "Ubah data program"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nama Program <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nama_program}
              onChange={(e) =>
                setFormData({ ...formData, nama_program: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                formErrors.nama_program ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Masukkan nama program"
              disabled={isSubmitting}
            />
            {formErrors.nama_program && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.nama_program}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Organisasi <span className="text-red-500">*</span>
            </label>
            {(shouldAutoSelectOrg || isRestrictedLevel) &&
            userOrganizationId ? (
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />{" "}
                {userOrganizationName || "Organisasi Anda"}
              </div>
            ) : (
              <select
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    organization_id: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.organization_id
                    ? "border-red-500"
                    : "border-gray-200"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih Organisasi</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.nama}
                  </option>
                ))}
              </select>
            )}
            {formErrors.organization_id && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.organization_id}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tema{" "}
                <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <select
                value={formData.theme_id}
                onChange={(e) =>
                  setFormData({ ...formData, theme_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              >
                <option value="">Pilih Tema</option>
                {(isMWC ? availableThemeOptions : themes).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
              {formErrors.theme_id && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.theme_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tahun <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.tahun}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tahun: parseInt(e.target.value),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.tahun ? "border-red-500" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Bidang <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.field_id}
                onChange={(e) =>
                  setFormData({ ...formData, field_id: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.field_id ? "border-red-500" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih Bidang</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sasaran <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.target_id}
                onChange={(e) =>
                  setFormData({ ...formData, target_id: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.target_id ? "border-red-500" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih Sasaran</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.goal_id}
                onChange={(e) =>
                  setFormData({ ...formData, goal_id: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.goal_id ? "border-red-500" : "border-gray-200"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih Tujuan</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSubmitting}
              >
                <option value="draft">Draft</option>
                <option value="aktif">Aktif</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) =>
                setFormData({ ...formData, deskripsi: e.target.value })
              }
              rows="3"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
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

export default WorkProgramFormModal;