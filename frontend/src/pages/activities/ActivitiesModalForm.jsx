import React from "react";
import {
  X,
  Briefcase,
  Building2,
  User,
  FileCheck,
  PlusCircle,
  Trash,
  Loader2,
} from "lucide-react";
import { formatRupiah, statusOptions } from "../../utils/activityUtils";

const ActivitiesModalForm = ({
  isOpen,
  onClose,
  editingActivity,
  formData,
  formErrors,
  submitting,
  workPrograms,
  organizations,
  anggotas,
  totalPengeluaran,
  expenseDescriptions,
  catatan,
  photos,
  expensePhotos,
  photoPreviews,
  expensePhotoPreviews,
  existingPhotos,
  existingExpensePhotos,
  isRanting,
  isMWC,
  userOrganizationName,
  onFormChange,
  onTotalPengeluaranChange,
  onCatatanChange,
  onAddExpenseDescription,
  onUpdateExpenseDescription,
  onRemoveExpenseDescription,
  onFileChange,
  onRemoveFile,
  onRemoveExistingPhoto,
  onRemoveExistingExpensePhoto,
  onSubmit,
  getImageUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingActivity
                  ? "Lengkapi data kegiatan"
                  : "Isi form berikut untuk menambahkan kegiatan baru"}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Program Kerja */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Program Kerja <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="work_program_id"
                value={formData.work_program_id}
                onChange={onFormChange}
                className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.work_program_id ? "border-red-500" : "border-gray-200"
                }`}
              >
                <option value="">Pilih Program Kerja</option>
                {workPrograms.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.nama_program}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.work_program_id && (
              <p className="mt-1 text-xs text-red-500">{formErrors.work_program_id}</p>
            )}
          </div>

          {/* Organisasi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Organisasi Pelaksana <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              {isRanting ? (
                <input
                  type="text"
                  value={userOrganizationName || "Memuat..."}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                />
              ) : isMWC ? (
                <select
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={onFormChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.organization_id ? "border-red-500" : "border-gray-200"
                  }`}
                  disabled={!formData.work_program_id}
                >
                  <option value="">Pilih Organisasi Pelaksana</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.nama}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700">
                  {organizations.find((o) => o.id === parseInt(formData.organization_id))
                    ?.nama || "Pilih program kerja terlebih dahulu"}
                </div>
              )}
            </div>
            {formErrors.organization_id && (
              <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>
            )}
          </div>

          {/* Nama Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nama Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_kegiatan"
              value={formData.nama_kegiatan}
              onChange={onFormChange}
              className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                formErrors.nama_kegiatan ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Masukkan nama kegiatan"
            />
            {formErrors.nama_kegiatan && (
              <p className="mt-1 text-xs text-red-500">{formErrors.nama_kegiatan}</p>
            )}
          </div>

          {/* Penanggung Jawab */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Penanggung Jawab <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="penanggung_jawab_id"
                value={formData.penanggung_jawab_id}
                onChange={onFormChange}
                className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  formErrors.penanggung_jawab_id ? "border-red-500" : "border-gray-200"
                }`}
                disabled={!formData.organization_id}
              >
                <option value="">Pilih Penanggung Jawab</option>
                {anggotas.map((anggota) => (
                  <option key={anggota.id} value={anggota.id}>
                    {anggota.nama}{" "}
                    {anggota.jabatan?.nama ? `- ${anggota.jabatan.nama}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.penanggung_jawab_id && (
              <p className="mt-1 text-xs text-red-500">{formErrors.penanggung_jawab_id}</p>
            )}
          </div>

          {/* Tanggal Pelaksanaan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tanggal Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_pelaksanaan"
              value={formData.tanggal_pelaksanaan}
              onChange={onFormChange}
              className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                formErrors.tanggal_pelaksanaan ? "border-red-500" : "border-gray-200"
              }`}
            />
            {formErrors.tanggal_pelaksanaan && (
              <p className="mt-1 text-xs text-red-500">{formErrors.tanggal_pelaksanaan}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Deskripsi Kegiatan
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={onFormChange}
              rows="3"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Deskripsi singkat tentang kegiatan"
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
                name="status"
                value={formData.status}
                onChange={onFormChange}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Edit Mode: Keuangan & Dokumentasi */}
          {editingActivity && (
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-md font-semibold text-gray-700 mb-3">
                Informasi Keuangan & Dokumentasi
              </h3>

              {/* Total Pengeluaran */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Total Pengeluaran
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={totalPengeluaran ? formatRupiah(totalPengeluaran) : ""}
                    onChange={(e) => onTotalPengeluaranChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Rincian Pengeluaran */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Rincian Pengeluaran
                  </label>
                  <button
                    type="button"
                    onClick={onAddExpenseDescription}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tambah Rincian
                  </button>
                </div>
                {expenseDescriptions.map((expense, idx) => (
                  <div key={idx} className="flex gap-3 mb-2 items-start">
                    <input
                      type="text"
                      placeholder="Deskripsi pengeluaran"
                      value={expense.description}
                      onChange={(e) =>
                        onUpdateExpenseDescription(idx, "description", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="relative w-40">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        placeholder="Jumlah"
                        value={expense.amount ? formatRupiah(expense.amount) : ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          onUpdateExpenseDescription(idx, "amount", value);
                        }}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveExpenseDescription(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Catatan */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => onCatatanChange(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Catatan tambahan tentang kegiatan"
                />
              </div>

              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto Kegiatan Saat Ini
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {existingPhotos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={getImageUrl(photo.file_path)}
                          alt="Kegiatan"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveExistingPhoto(photo.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Foto Kegiatan Baru
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onFileChange(e, "photos")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl"
                />
                {photoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photoPreviews.map((preview, idx) => (
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
              {existingExpensePhotos.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto Bukti Pengeluaran Saat Ini
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {existingExpensePhotos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={getImageUrl(photo.file_path)}
                          alt="Bukti Pengeluaran"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveExistingExpensePhoto(photo.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Expense Photos */}
              <div className="mb-4">
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
                {expensePhotoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {expensePhotoPreviews.map((preview, idx) => (
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
              </>
            ) : editingActivity ? (
              "Update"
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesModalForm;