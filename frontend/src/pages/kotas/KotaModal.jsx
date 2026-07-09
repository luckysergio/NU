import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useKotas } from "../../hooks/useKotas";
import { X, Loader2, MapPin, Info } from "lucide-react";

const KotaModal = ({ isOpen, onClose, editingKota, onSuccess, canManage }) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useKotas();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    kode: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editingKota) {
      setFormData({
        nama: editingKota.nama || "",
        kode: editingKota.kode || "",
        is_active: editingKota.is_active ?? true,
      });
    } else {
      setFormData({
        nama: "",
        kode: "",
        is_active: true,
      });
    }
    setFormErrors({});
  }, [editingKota, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama kota wajib diisi";
    }
    if (!formData.kode.trim()) {
      errors.kode = "Kode kota wajib diisi";
    } else if (formData.kode.length > 20) {
      errors.kode = "Kode kota maksimal 20 karakter";
    } else if (!/^[A-Z0-9]+$/i.test(formData.kode)) {
      errors.kode = "Kode kota hanya boleh huruf dan angka";
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
      kode: formData.kode.trim().toUpperCase(),
      is_active: formData.is_active,
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingKota ? "Kota berhasil diperbarui" : "Kota baru berhasil dibuat",
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

    if (editingKota) {
      update({ id: editingKota.id, data: submitData }, mutationOptions);
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
                {editingKota ? "Edit Kota" : "Tambah Kota Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingKota
                  ? "Ubah data kota/kabupaten"
                  : "Isi form berikut untuk menambahkan kota/kabupaten baru"}
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
            {/* Nama Kota */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Kota <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Kota Tangerang, Kabupaten Tangerang"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Kode Kota */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kode Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="kode"
                value={formData.kode}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.kode ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Contoh: 3671, 3201"
                disabled={submitting || isCreating || isUpdating}
              />
              {formErrors.kode && (
                <p className="mt-1 text-xs text-red-500">{formErrors.kode}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Kode unik untuk kota/kabupaten (akan otomatis uppercase)
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
                Jika tidak aktif, kota ini tidak akan muncul di pilihan
              </p>
            </div>

            {/* Preview Data */}
            {formData.nama && formData.kode && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Preview:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formData.nama}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({formData.kode.toUpperCase()})
                  </span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1">
                    <li>• Kode kota harus unik dalam sistem</li>
                    <li>
                      • Kota yang sudah memiliki kecamatan tidak dapat dihapus
                    </li>
                    <li>
                      • Kota yang sudah digunakan oleh organisasi PC tidak dapat
                      dihapus
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
              <span>{editingKota ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KotaModal;