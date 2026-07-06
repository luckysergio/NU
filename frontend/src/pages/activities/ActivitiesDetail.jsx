import React from "react";
import {
  X,
  Pencil,
  Save,
  Edit,
  Loader2,
  Camera,
  Image as ImageIcon,
  FileCheck,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  formatRupiah,
  getStatusBadge,
  statusOptions,
  MAX_PHOTOS,
} from "../../utils/activityUtils";

const ActivitiesDetail = ({
  isOpen,
  onClose,
  selectedActivity,
  isEditing,
  setIsEditing,
  detailFormData,
  setDetailFormData,
  detailPhotos,
  detailExpensePhotos,
  detailPhotoPreviews,
  detailExpensePhotoPreviews,
  detailDeletedPhotoIds,
  detailDeletedExpensePhotoIds,
  detailSubmitting,
  onSubmit,
  onEditFull,
  onFileChange,
  onRemoveFile,
  onRemoveExistingPhoto,
  onRemoveExistingExpensePhoto,
  getImageUrl,
}) => {
  if (!isOpen || !selectedActivity) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {isEditing ? "Edit informasi kegiatan" : "Informasi lengkap kegiatan"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                  title="Edit Kegiatan"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                  title="Batal Edit"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Informasi Dasar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Nama Kegiatan</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {selectedActivity.nama_kegiatan}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Program Kerja</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedActivity.work_program?.nama_program || "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Organisasi Pelaksana</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedActivity.organization?.nama || "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Penanggung Jawab</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedActivity.penanggung_jawab?.nama || "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pelaksanaan</p>
              <p className="text-sm text-gray-800 mt-1">
                {formatDate(selectedActivity.tanggal_pelaksanaan)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
              <div className="mt-1">{getStatusBadge(selectedActivity.status)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Dibuat Oleh</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedActivity.creator?.name || "-"}
              </p>
            </div>
          </div>

          {/* Deskripsi */}
          {selectedActivity.deskripsi && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Deskripsi</p>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                {selectedActivity.deskripsi}
              </p>
            </div>
          )}

          {/* Keuangan & Dokumentasi */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-md font-semibold text-gray-700">
                Informasi Keuangan & Dokumentasi
              </h3>
              {!isEditing && (
                <span className="text-xs text-gray-400 ml-2">
                  (Klik tombol pensil untuk edit)
                </span>
              )}
            </div>

            {!isEditing ? (
              // View Mode
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Total Pengeluaran</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">
                    {formatCurrency(selectedActivity.total_pengeluaran)}
                  </p>
                </div>

                {selectedActivity.catatan && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Catatan</p>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {selectedActivity.catatan}
                    </p>
                  </div>
                )}

                {/* Photos */}
                {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      <Camera className="w-4 h-4 inline mr-1" /> Foto Kegiatan (
                      {selectedActivity.photos.length}/{MAX_PHOTOS})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedActivity.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={getImageUrl(photo.file_path)}
                            alt={`Kegiatan ${idx + 1}`}
                            className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200"
                            onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense Photos */}
                {selectedActivity.expense_photos && selectedActivity.expense_photos.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                      <ImageIcon className="w-4 h-4 inline mr-1" /> Foto Bukti Pengeluaran
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedActivity.expense_photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={getImageUrl(photo.file_path)}
                            alt={`Bukti ${idx + 1}`}
                            className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-all duration-200"
                            onClick={() => window.open(getImageUrl(photo.file_path), "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                {/* Total Pengeluaran */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Total Pengeluaran
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={
                        detailFormData.total_pengeluaran
                          ? formatRupiah(detailFormData.total_pengeluaran)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setDetailFormData((prev) => ({
                          ...prev,
                          total_pengeluaran: value,
                        }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={detailFormData.catatan}
                    onChange={(e) =>
                      setDetailFormData((prev) => ({
                        ...prev,
                        catatan: e.target.value,
                      }))
                    }
                    rows="3"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Catatan tambahan tentang kegiatan"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Status Kegiatan
                  </label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={detailFormData.status}
                      onChange={(e) =>
                        setDetailFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Existing Photos */}
                {selectedActivity.photos &&
                  selectedActivity.photos.filter((p) => !detailDeletedPhotoIds.includes(p.id))
                    .length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Foto Kegiatan Saat Ini
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {selectedActivity.photos.map((photo) => (
                          !detailDeletedPhotoIds.includes(photo.id) && (
                            <div key={photo.id} className="relative">
                              <img
                                src={getImageUrl(photo.file_path)}
                                alt="Kegiatan"
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveExistingPhoto(photo.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                {/* New Photos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Foto Kegiatan Baru
                    <span className="text-xs text-gray-500 ml-2">
                      (Maksimal {MAX_PHOTOS} foto,{" "}
                      {(selectedActivity.photos?.length || 0) - detailDeletedPhotoIds.length +
                        detailPhotos.length}
                      /{MAX_PHOTOS})
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onFileChange(e, "photos")}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                  {detailPhotoPreviews.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detailPhotoPreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveFile(idx, "photos")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing Expense Photos */}
                {selectedActivity.expense_photos &&
                  selectedActivity.expense_photos.filter(
                    (p) => !detailDeletedExpensePhotoIds.includes(p.id)
                  ).length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Foto Bukti Pengeluaran Saat Ini
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {selectedActivity.expense_photos.map((photo) => (
                          !detailDeletedExpensePhotoIds.includes(photo.id) && (
                            <div key={photo.id} className="relative">
                              <img
                                src={getImageUrl(photo.file_path)}
                                alt="Bukti Pengeluaran"
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => onRemoveExistingExpensePhoto(photo.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                {/* New Expense Photos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Foto Bukti Pengeluaran Baru
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onFileChange(e, "expense_photos")}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                  />
                  {detailExpensePhotoPreviews.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detailExpensePhotoPreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Expense Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveFile(idx, "expense_photos")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Tutup
          </button>
          {isEditing ? (
            <button
              onClick={onSubmit}
              disabled={detailSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              {detailSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onEditFull(selectedActivity)}
              className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Lengkap
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesDetail;