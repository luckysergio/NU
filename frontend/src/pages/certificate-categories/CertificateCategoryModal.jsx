// src/pages/certificate-categories/CertificateCategoryModal.jsx
import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { certificateCategoryService } from "../../services/certificateCategory";
import { X, Loader2, Award, Info } from "lucide-react";

const CertificateCategoryModal = ({
  isOpen,
  onClose,
  editingCategory,
  onSuccess,
}) => {
  const { success, error } = useModal();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // Reset form when modal opens or editing category changes
  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setFormData({
          nama: editingCategory.nama || "",
          deskripsi: editingCategory.deskripsi || "",
          is_active: editingCategory.is_active ?? true,
        });
      } else {
        setFormData({
          nama: "",
          deskripsi: "",
          is_active: true,
        });
      }
      setFormErrors({});
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama kategori wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let result;
      if (editingCategory) {
        result = await certificateCategoryService.update(
          editingCategory.id,
          formData
        );
      } else {
        result = await certificateCategoryService.create(formData);
      }

      if (result?.success) {
        success("Berhasil", result.message || "Data berhasil disimpan");
        onClose();
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 300);
        }
      } else {
        if (result?.errors) {
          const formattedErrors = {};
          Object.keys(result.errors).forEach((key) => {
            formattedErrors[key] = result.errors[key][0] || result.errors[key];
          });
          setFormErrors(formattedErrors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error("Gagal", result?.message || "Terjadi kesalahan");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response?.data?.errors) {
        const formattedErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          formattedErrors[key] =
            err.response.data.errors[key][0] ||
            err.response.data.errors[key];
        });
        setFormErrors(formattedErrors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
      } else {
        error(
          "Error",
          err.response?.data?.message || err.message || "Terjadi kesalahan"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Generate slug preview
  const generateSlug = (text) => {
    if (!text) return "-";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingCategory
                  ? "Edit Kategori Sertifikat"
                  : "Tambah Kategori Sertifikat"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingCategory
                  ? "Ubah data kategori sertifikat"
                  : "Isi form berikut untuk menambahkan kategori sertifikat baru"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nama Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Sertifikat Umum, Sertifikat Khusus"
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Slug akan dibuat otomatis dari nama kategori
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Deskripsi
                <span className="text-xs font-normal text-gray-500 ml-1">
                  (Opsional)
                </span>
              </label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                  formErrors.deskripsi ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Deskripsi kategori sertifikat (opsional)"
              />
            </div>

            {/* Status Aktif */}
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 font-medium">Aktif</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Jika tidak aktif, kategori ini tidak akan muncul di pilihan
              </p>
            </div>

            {/* Preview Slug */}
            {formData.nama && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Preview Slug:
                </p>
                <code className="text-sm text-emerald-600 font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 block">
                  {generateSlug(formData.nama)}
                </code>
              </div>
            )}

            {/* Informasi */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Kategori yang aktif akan muncul di form sertifikat</li>
                    <li>Kategori yang memiliki sertifikat tidak dapat dihapus</li>
                    <li>Slug digunakan untuk URL yang lebih bersih</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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

export default CertificateCategoryModal;