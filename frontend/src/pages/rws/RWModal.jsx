import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { useRWs } from "../../hooks/useRWs";
import { kotaService } from "../../services/kota";
import { kecamatanService } from "../../services/kecamatan";
import { kelurahanService } from "../../services/kelurahan";
import { X, Loader2, Home, Info } from "lucide-react";

const RWModal = ({ isOpen, onClose, editingRw, onSuccess, canManage }) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useRWs();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    kelurahan_id: "",
    nomor: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // ✅ Cascading filter states untuk modal
  const [modalFilterKota, setModalFilterKota] = useState("");
  const [modalFilterKecamatan, setModalFilterKecamatan] = useState("");

  // ✅ Fetch kotas untuk dropdown (cached 24 jam)
  const { data: kotasData, isLoading: isLoadingKotas } = useQuery({
    queryKey: ["kotas-for-rw-modal"],
    queryFn: async () => {
      const result = await kotaService.getAll({ per_page: 100, page: 1 });
      return result.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // ✅ Fetch kecamatans untuk dropdown (cached 24 jam)
  const { data: kecamatansData, isLoading: isLoadingKecamatans } = useQuery({
    queryKey: ["kecamatans-for-rw-modal"],
    queryFn: async () => {
      const result = await kecamatanService.getAll({ per_page: 100, page: 1 });
      return result.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // ✅ Fetch kelurahans untuk dropdown (cached 24 jam)
  const { data: kelurahansData, isLoading: isLoadingKelurahans } = useQuery({
    queryKey: ["kelurahans-for-rw-modal"],
    queryFn: async () => {
      const result = await kelurahanService.getAll({ per_page: 100, page: 1 });
      return result.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const kotas = kotasData || [];
  const allKecamatans = kecamatansData || [];
  const allKelurahans = kelurahansData || [];

  // ✅ Cascading filter: kecamatan by kota
  const kecamatansByKota = useMemo(() => {
    if (!modalFilterKota) return allKecamatans;
    return allKecamatans.filter((k) => k.kota_id === parseInt(modalFilterKota));
  }, [modalFilterKota, allKecamatans]);

  // ✅ Cascading filter: kelurahan by kecamatan
  const kelurahansByKecamatan = useMemo(() => {
    let filtered = allKelurahans;
    if (modalFilterKota) {
      filtered = filtered.filter(
        (kel) => kel.kecamatan?.kota_id === parseInt(modalFilterKota),
      );
    }
    if (modalFilterKecamatan) {
      filtered = filtered.filter(
        (kel) => kel.kecamatan_id === parseInt(modalFilterKecamatan),
      );
    }
    return filtered;
  }, [modalFilterKota, modalFilterKecamatan, allKelurahans]);

  // ✅ Reset cascading filters saat parent berubah
  useEffect(() => {
    setModalFilterKecamatan("");
  }, [modalFilterKota]);

  // ✅ Initialize form data
  useEffect(() => {
    if (editingRw) {
      setFormData({
        kelurahan_id: editingRw.kelurahan_id?.toString() || "",
        nomor: editingRw.nomor || "",
        is_active: editingRw.is_active ?? true,
      });

      // ✅ Set initial cascading filters based on editing RW
      if (editingRw.kelurahan) {
        if (editingRw.kelurahan.kecamatan?.kota_id) {
          setModalFilterKota(
            editingRw.kelurahan.kecamatan.kota_id.toString(),
          );
        }
        if (editingRw.kelurahan.kecamatan_id) {
          setModalFilterKecamatan(
            editingRw.kelurahan.kecamatan_id.toString(),
          );
        }
      }
    } else {
      setFormData({
        kelurahan_id: "",
        nomor: "",
        is_active: true,
      });
      setModalFilterKota("");
      setModalFilterKecamatan("");
    }
    setFormErrors({});
  }, [editingRw, isOpen]);

  if (!isOpen) return null;

  const isLoadingMaster =
    isLoadingKotas || isLoadingKecamatans || isLoadingKelurahans;

  const validateForm = () => {
    const errors = {};
    if (!formData.kelurahan_id) {
      errors.kelurahan_id = "Kelurahan wajib dipilih";
    }
    if (!formData.nomor.trim()) {
      errors.nomor = "Nomor RW wajib diisi";
    } else if (formData.nomor.length > 10) {
      errors.nomor = "Nomor RW maksimal 10 karakter";
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
      kelurahan_id: parseInt(formData.kelurahan_id),
      nomor: formData.nomor.trim(),
      is_active: formData.is_active,
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingRw ? "RW berhasil diperbarui" : "RW baru berhasil dibuat",
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

    if (editingRw) {
      update({ id: editingRw.id, data: submitData }, mutationOptions);
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
                {editingRw ? "Edit RW" : "Tambah RW Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingRw
                  ? "Ubah data RW"
                  : "Isi form berikut untuk menambahkan RW baru"}
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
            {/* Filter Kota */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Filter Kota
              </label>
              <select
                value={modalFilterKota}
                onChange={(e) => setModalFilterKota(e.target.value)}
                disabled={submitting || isCreating || isUpdating || isLoadingMaster}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Semua Kota</option>
                {kotas.map((kota) => (
                  <option key={kota.id} value={kota.id}>
                    {kota.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kecamatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Filter Kecamatan
              </label>
              <select
                value={modalFilterKecamatan}
                onChange={(e) => setModalFilterKecamatan(e.target.value)}
                disabled={
                  !modalFilterKota ||
                  submitting ||
                  isCreating ||
                  isUpdating ||
                  isLoadingMaster
                }
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Semua Kecamatan</option>
                {kecamatansByKota.map((kecamatan) => (
                  <option key={kecamatan.id} value={kecamatan.id}>
                    {kecamatan.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Kelurahan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kelurahan/Desa <span className="text-red-500">*</span>
              </label>
              <select
                name="kelurahan_id"
                value={formData.kelurahan_id}
                onChange={handleChange}
                disabled={
                  submitting || isCreating || isUpdating || isLoadingMaster
                }
                className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.kelurahan_id ? "border-red-500" : "border-gray-200"
                } ${
                  isLoadingMaster
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
                }`}
              >
                <option value="">
                  {isLoadingMaster
                    ? "Memuat data kelurahan..."
                    : "Pilih Kelurahan/Desa"}
                </option>
                {kelurahansByKecamatan.map((kelurahan) => (
                  <option key={kelurahan.id} value={kelurahan.id}>
                    {kelurahan.nama}
                    {kelurahan.kecamatan && (
                      <span className="text-gray-400 text-xs ml-1">
                        ({kelurahan.kecamatan.nama})
                      </span>
                    )}
                  </option>
                ))}
              </select>
              {formErrors.kelurahan_id && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.kelurahan_id}
                </p>
              )}
            </div>

            {/* Nomor RW */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nomor RW <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nomor"
                  value={formData.nomor}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nomor ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: 01, 02, 03"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nomor && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nomor}</p>
              )}
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
                Jika tidak aktif, RW ini tidak akan muncul di pilihan
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold mb-1">Informasi:</p>
                  <ul className="space-y-1">
                    <li>
                      • Gunakan filter kota dan kecamatan untuk mempermudah
                      pencarian kelurahan
                    </li>
                    <li>• Nomor RW harus unik dalam satu kelurahan</li>
                    <li>
                      • RW yang sudah digunakan oleh organisasi Anak Ranting
                      tidak dapat dihapus
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
              <span>{editingRw ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RWModal;