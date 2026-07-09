import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useOrganizationTypes } from "../../hooks/useOrganizationTypes";
import { X, Loader2, Tag, Layers, Info } from "lucide-react";

// ✅ Level options untuk tipe organisasi (hanya Lembaga & Banom)
const LEVEL_OPTIONS = [
  { id: 5, name: "LEMBAGA", slug: "lembaga", display: "LEMBAGA" },
  { id: 6, name: "BANOM", slug: "banom", display: "BANOM" },
];

const OrganizationTypeModal = ({
  isOpen,
  onClose,
  editingType,
  onSuccess,
  canManage,
}) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useOrganizationTypes();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organization_level_id: "",
    nama: "",
    deskripsi: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editingType) {
      setFormData({
        organization_level_id:
          editingType.organization_level_id?.toString() || "",
        nama: editingType.nama || "",
        deskripsi: editingType.deskripsi || "",
        is_active: editingType.is_active ?? true,
      });
    } else {
      setFormData({
        organization_level_id: "",
        nama: "",
        deskripsi: "",
        is_active: true,
      });
    }
    setFormErrors({});
  }, [editingType, isOpen]);

  if (!isOpen) return null;

  // Generate preview slug
  const previewSlug = formData.nama
    ? formData.nama
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

  const validateForm = () => {
    const errors = {};
    if (!formData.organization_level_id) {
      errors.organization_level_id = "Level organisasi wajib dipilih";
    }
    if (!formData.nama.trim()) {
      errors.nama = "Nama tipe organisasi wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      error("Validasi Gagal", "Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);

    const submitData = {
      organization_level_id: parseInt(formData.organization_level_id),
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi || null,
      is_active: formData.is_active,
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingType
            ? "Tipe organisasi berhasil diperbarui"
            : "Tipe organisasi baru berhasil dibuat",
        );
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        if (err.response?.data?.errors) {
          const formattedErrors = {};
          Object.keys(err.response.data.errors).forEach((key) => {
            formattedErrors[key] =
              err.response.data.errors[key][0] || err.response.data.errors[key];
          });
          setFormErrors(formattedErrors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error(
            "Gagal",
            err.response?.data?.message ||
              err.message ||
              "Terjadi kesalahan internal server",
          );
        }
      },
      onSettled: () => {
        setSubmitting(false);
      },
    };

    if (editingType) {
      update({ id: editingType.id, data: submitData }, mutationOptions);
    } else {
      create(submitData, mutationOptions);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingType
                  ? "Edit Tipe Organisasi"
                  : "Tambah Tipe Organisasi Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingType
                  ? "Ubah data tipe organisasi"
                  : "Isi form berikut untuk menambahkan tipe organisasi baru"}
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

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Level Organisasi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Level Organisasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="organization_level_id"
                  value={formData.organization_level_id}
                  onChange={handleChange}
                  disabled={submitting || isCreating || isUpdating}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.organization_level_id
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                >
                  <option value="">Pilih Level Organisasi</option>
                  {LEVEL_OPTIONS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.display}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.organization_level_id && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.organization_level_id}
                </p>
              )}
            </div>

            {/* Nama Tipe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Tipe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Lembaga Pendidikan, Banom, Lembaga Sosial"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Deskripsi
              </label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Deskripsi singkat tentang tipe organisasi ini"
                disabled={submitting || isCreating || isUpdating}
              />
              <p className="mt-1 text-xs text-gray-500">
                Deskripsi opsional, menjelaskan tentang tipe organisasi ini
              </p>
            </div>

            {/* Status Aktif */}
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={submitting || isCreating || isUpdating}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Jika tidak aktif, tipe ini tidak akan muncul di pilihan saat
                membuat organisasi
              </p>
            </div>

            {/* Preview Slug */}
            {previewSlug && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Preview Slug
                </p>
                <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full text-center block">
                  {previewSlug}
                </code>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1">
                    <li>
                      • Tipe organisasi hanya untuk level Lembaga dan Banom
                    </li>
                    <li>• Slug akan dibuat otomatis dari nama tipe</li>
                    <li>• Nama tipe harus unik dalam sistem</li>
                    <li>
                      • Tipe yang sudah memiliki organisasi tidak dapat dihapus
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || isCreating || isUpdating}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || isCreating || isUpdating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitting || isCreating || isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>{editingType ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationTypeModal;