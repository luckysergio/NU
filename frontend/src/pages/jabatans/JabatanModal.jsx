import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useJabatans } from "../../hooks/useJabatans";
import { X, Loader2, Briefcase, Check } from "lucide-react";

const LEVEL_OPTIONS = [
  { slug: "pc", display: "PCNU", color: "purple" },
  { slug: "mwc", display: "MWCNU", color: "blue" },
  { slug: "ranting", display: "RANTING", color: "green" },
  { slug: "anak-ranting", display: "ANAK RANTING", color: "teal" },
  { slug: "lembaga", display: "LEMBAGA", color: "orange" },
  { slug: "banom", display: "BANOM", color: "pink" },
];

const JabatanModal = ({ isOpen, onClose, editingJabatan, onSuccess, canManage }) => {
  const { success, error } = useModal();
  const { create, update, isCreating, isUpdating } = useJabatans();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    selectedLevels: [],
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (editingJabatan) {
      // Determine selected levels from existing data
      let selectedLevels = [];
      if (editingJabatan.level) {
        selectedLevels = [editingJabatan.level];
      } else if (editingJabatan.levels && Array.isArray(editingJabatan.levels)) {
        selectedLevels = editingJabatan.levels;
      }

      setFormData({
        nama: editingJabatan.nama || "",
        deskripsi: editingJabatan.deskripsi || "",
        selectedLevels: selectedLevels,
        is_active: editingJabatan.is_active ?? true,
      });
    } else {
      setFormData({
        nama: "",
        deskripsi: "",
        selectedLevels: [],
        is_active: true,
      });
    }
    setFormErrors({});
  }, [editingJabatan, isOpen]);

  if (!isOpen) return null;

  // Generate preview slug
  const previewSlug = formData.nama
    ? formData.nama
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

  // Process selected levels: if 1 level -> use 'level', if >1 -> use 'levels'
  const processLevels = (selectedLevels) => {
    if (!selectedLevels || selectedLevels.length === 0) {
      return { level: null, levels: null };
    }
    if (selectedLevels.length === 1) {
      return { level: selectedLevels[0], levels: null };
    }
    return { level: null, levels: selectedLevels };
  };

  // Toggle level selection
  const toggleLevel = (slug) => {
    setFormData((prev) => {
      const current = prev.selectedLevels || [];
      if (current.includes(slug)) {
        return { ...prev, selectedLevels: current.filter((s) => s !== slug) };
      } else {
        return { ...prev, selectedLevels: [...current, slug] };
      }
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama jabatan wajib diisi";
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

    // Process levels
    const { level, levels } = processLevels(formData.selectedLevels);

    const submitData = {
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi || null,
      level: level,
      levels: levels,
      is_active: formData.is_active,
    };

    const mutationOptions = {
      onSuccess: (result) => {
        success(
          "Berhasil",
          editingJabatan
            ? "Jabatan berhasil diperbarui"
            : "Jabatan baru berhasil dibuat",
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

    if (editingJabatan) {
      update({ id: editingJabatan.id, data: submitData }, mutationOptions);
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
                {editingJabatan ? "Edit Jabatan" : "Tambah Jabatan Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingJabatan
                  ? "Ubah data jabatan"
                  : "Isi form berikut untuk menambahkan jabatan baru"}
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
            {/* Nama Jabatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Jabatan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Contoh: Ketua, Sekretaris, Bendahara"
                  disabled={submitting || isCreating || isUpdating}
                  autoFocus
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Level Organisasi - Checkbox List */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Level Organisasi
              </label>
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_OPTIONS.map((level) => {
                    const isChecked =
                      formData.selectedLevels?.includes(level.slug) || false;
                    return (
                      <label
                        key={level.slug}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isChecked
                            ? "bg-emerald-50 border-2 border-emerald-400"
                            : "bg-white border-2 border-gray-200 hover:border-emerald-300"
                        }`}
                        onClick={() => toggleLevel(level.slug)}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              {
                                purple: "bg-purple-500",
                                blue: "bg-blue-500",
                                green: "bg-green-500",
                                teal: "bg-teal-500",
                                orange: "bg-orange-500",
                                pink: "bg-pink-500",
                              }[level.color] || "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm text-gray-700">
                            {level.display}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">
                  💡 Pilih 1 level untuk level spesifik, atau pilih lebih dari 1
                  untuk multiple level
                </span>
              </div>
              {formData.selectedLevels && formData.selectedLevels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  <span className="text-xs text-gray-500">Level dipilih:</span>
                  {formData.selectedLevels.map((slug) => {
                    const level = LEVEL_OPTIONS.find((l) => l.slug === slug);
                    return level ? (
                      <span
                        key={slug}
                        className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700"
                      >
                        {level.display}
                      </span>
                    ) : null;
                  })}
                  <span className="text-xs text-gray-400 ml-1">
                    ({formData.selectedLevels.length} level)
                  </span>
                </div>
              )}
              {formData.selectedLevels && formData.selectedLevels.length === 1 && (
                <p className="mt-1 text-xs text-emerald-600">
                  ✓ Akan disimpan sebagai level tunggal
                </p>
              )}
              {formData.selectedLevels && formData.selectedLevels.length > 1 && (
                <p className="mt-1 text-xs text-blue-600">
                  ✓ Akan disimpan sebagai multiple level
                </p>
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
                placeholder="Deskripsi singkat tentang jabatan ini"
                disabled={submitting || isCreating || isUpdating}
              />
              <p className="mt-1 text-xs text-gray-500">Deskripsi opsional</p>
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
              <p className="mt-1 text-xs text-gray-500">
                Jika tidak aktif, jabatan ini tidak akan muncul di pilihan
              </p>
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
              <span>{editingJabatan ? "Update" : "Simpan"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JabatanModal;