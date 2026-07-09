import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useRoles } from "../../hooks/useRoles";
import { X, Loader2, Shield, AlertCircle } from "lucide-react";

const RoleModal = ({ isOpen, onClose, editingRole, onSuccess, isSuperAdmin }) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useRoles();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editingRole) {
      setFormData({
        nama: editingRole.nama || "",
      });
    } else {
      setFormData({
        nama: "",
      });
    }
    setFormErrors({});
  }, [editingRole, isOpen]);

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
    if (!formData.nama.trim()) {
      errors.nama = "Nama role wajib diisi";
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
      nama: formData.nama.trim(),
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingRole
            ? "Role berhasil diperbarui"
            : "Role baru berhasil dibuat",
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

    if (editingRole) {
      update({ id: editingRole.id, data: submitData }, mutationOptions);
    } else {
      create(submitData, mutationOptions);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                {editingRole ? "Edit Role" : "Tambah Role Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingRole
                  ? "Ubah data role/hak akses"
                  : "Isi form berikut untuk menambahkan role baru"}
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
            {/* Nama Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Super Admin, Admin, Operator, Anggota"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.nama}
                </p>
              )}
            </div>

            {/* Preview Slug */}
            {previewSlug && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Preview Slug
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full text-center">
                    {previewSlug}
                  </code>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1">
                    <li>• Slug akan dibuat otomatis dari nama role</li>
                    <li>• Nama role harus unik dalam sistem</li>
                    <li>• Role yang sudah digunakan user tidak dapat dihapus</li>
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
              <span>{editingRole ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;