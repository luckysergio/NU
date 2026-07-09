import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { useKecamatans } from "../../hooks/useKecamatans";
import { kotaService } from "../../services/kota";
import { X, Loader2, Map, Info } from "lucide-react";

const KecamatanModal = ({
  isOpen,
  onClose,
  editingKecamatan,
  onSuccess,
  canManage,
}) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useKecamatans();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    kota_id: "",
    nama: "",
    kode: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // ✅ Fetch kotas untuk dropdown (cached 24 jam)
  const { data: kotasData, isLoading: isLoadingKotas } = useQuery({
    queryKey: ["kotas-for-kecamatan-modal"],
    queryFn: async () => {
      const result = await kotaService.getAll({ per_page: 100, page: 1 });
      return result.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const kotas = kotasData || [];

  useEffect(() => {
    if (editingKecamatan) {
      setFormData({
        kota_id: editingKecamatan.kota_id?.toString() || "",
        nama: editingKecamatan.nama || "",
        kode: editingKecamatan.kode || "",
        is_active: editingKecamatan.is_active ?? true,
      });
    } else {
      setFormData({
        kota_id: "",
        nama: "",
        kode: "",
        is_active: true,
      });
    }
    setFormErrors({});
  }, [editingKecamatan, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.kota_id) {
      errors.kota_id = "Kota/Kabupaten wajib dipilih";
    }
    if (!formData.nama.trim()) {
      errors.nama = "Nama kecamatan wajib diisi";
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
      kota_id: parseInt(formData.kota_id),
      nama: formData.nama.trim(),
      kode: formData.kode.trim() || null,
      is_active: formData.is_active,
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingKecamatan
            ? "Kecamatan berhasil diperbarui"
            : "Kecamatan baru berhasil dibuat",
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

    if (editingKecamatan) {
      update(
        { id: editingKecamatan.id, data: submitData },
        mutationOptions,
      );
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
                {editingKecamatan ? "Edit Kecamatan" : "Tambah Kecamatan Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingKecamatan
                  ? "Ubah data kecamatan"
                  : "Isi form berikut untuk menambahkan kecamatan baru"}
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
            {/* Pilih Kota */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kota/Kabupaten <span className="text-red-500">*</span>
              </label>
              <select
                name="kota_id"
                value={formData.kota_id}
                onChange={handleChange}
                disabled={submitting || isCreating || isUpdating || isLoadingKotas}
                className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.kota_id ? "border-red-500" : "border-gray-200"
                } ${
                  isLoadingKotas ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              >
                <option value="">
                  {isLoadingKotas ? "Memuat data kota..." : "Pilih Kota/Kabupaten"}
                </option>
                {kotas.map((kota) => (
                  <option key={kota.id} value={kota.id}>
                    {kota.nama}
                  </option>
                ))}
              </select>
              {formErrors.kota_id && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.kota_id}
                </p>
              )}
            </div>

            {/* Nama Kecamatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Kecamatan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Cipondoh, Ciledug, dll"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Kode Kecamatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kode Kecamatan
              </label>
              <input
                type="text"
                name="kode"
                value={formData.kode}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Contoh: 367101, 320101"
                disabled={submitting || isCreating || isUpdating}
              />
              <p className="mt-1 text-xs text-gray-500">
                Kode unik untuk kecamatan (opsional)
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
                Jika tidak aktif, kecamatan ini tidak akan muncul di pilihan
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1">
                    <li>• Nama kecamatan harus unik dalam satu kota</li>
                    <li>
                      • Kecamatan yang sudah digunakan oleh organisasi MWC tidak
                      dapat dihapus
                    </li>
                    <li>
                      • Kecamatan yang sudah memiliki kelurahan tidak dapat
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
              <span>{editingKecamatan ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KecamatanModal;