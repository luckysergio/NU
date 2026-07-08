// src/pages/program-themes/ProgramThemesForm.jsx
import React from "react";
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FolderTree,
  Building2,
  FileText,
  Info,
  User,
} from "lucide-react";

const ProgramThemesForm = ({
  isOpen,
  mode,
  selectedTheme,
  formData,
  setFormData,
  formErrors,
  organizations,
  isSubmitting,
  isCreating,
  isUpdating,
  isSuperAdmin,
  isManualOverride,
  setIsManualOverride,
  onClose,
  onSubmit,
  formatDate,
  getDateStatus,
  getStatusBadgeTheme,
  getAutoStatus,
}) => {
  if (!isOpen) return null;

  const isDisabled = isSubmitting || isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === "create" && "Tambah Tema Program"}
                {mode === "edit" && "Edit Tema Program"}
                {mode === "view" && "Detail Tema Program"}
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                {mode === "create" && "Isi form untuk menambahkan tema program baru"}
                {mode === "edit" && "Ubah data tema program yang sudah ada"}
                {mode === "view" && "Informasi lengkap tema program"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isDisabled}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {mode === "view" ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderTree className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedTheme?.nama}
                </h3>
                {selectedTheme?.periode && (
                  <p className="text-sm text-gray-500 mt-1">
                    Periode: {selectedTheme.periode}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {isSuperAdmin && selectedTheme?.organization && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Organisasi</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedTheme.organization.nama}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deskripsi</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedTheme?.deskripsi || "Tidak ada deskripsi"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tanggal Mulai</p>
                    <p className="text-base font-semibold text-gray-800">
                      {formatDate(selectedTheme?.tanggal_mulai)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tanggal Selesai</p>
                    <p className="text-base font-semibold text-gray-800">
                      {formatDate(selectedTheme?.tanggal_selesai)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status Program</p>
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium ${getDateStatus(selectedTheme?.tanggal_mulai, selectedTheme?.tanggal_selesai).color}`}>
                      {getDateStatus(selectedTheme?.tanggal_mulai, selectedTheme?.tanggal_selesai).label}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status Aktif</p>
                    {getStatusBadgeTheme(selectedTheme?.is_active, selectedTheme)}
                  </div>
                </div>

                {selectedTheme?.statistics && selectedTheme.statistics.organizations_status && selectedTheme.statistics.organizations_status.length > 0 && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Statistik Program Kerja per MWC
                    </p>
                    <div className="space-y-3">
                      {selectedTheme.statistics.organizations_status.map((org, idx) => (
                        <div key={org.id} className="flex items-center justify-between py-2 border-b border-emerald-200 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{org.nama}</p>
                            <p className="text-xs text-gray-500">MWC</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-12.5">
                              <p className="text-xs text-gray-500">Proker</p>
                              <p className={`text-sm font-semibold ${org.work_program_count > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {org.work_program_count}
                              </p>
                            </div>
                            <div className="text-center min-w-15">
                              <p className="text-xs text-gray-500">Kegiatan</p>
                              <p className={`text-sm font-semibold ${org.activities_count > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                {org.activities_count}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                org.has_work_program 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {org.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-emerald-200">
                        <p className="text-sm font-semibold text-gray-700">Total:</p>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-emerald-600">{selectedTheme.statistics.total_work_programs || 0} Proker</p>
                          <p className="text-sm font-semibold text-blue-600">{selectedTheme.statistics.total_activities || 0} Kegiatan</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTheme?.creator && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Dibuat Oleh</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {selectedTheme.creator.name}
                          </p>
                        </div>
                      </div>
                      {selectedTheme?.created_at && (
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Dibuat pada</p>
                          <p className="text-xs text-gray-600">
                            {new Date(selectedTheme.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-5">
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organisasi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                      formErrors.organization_id ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                    }`}
                    disabled={isDisabled}
                  >
                    <option value="">Pilih Organisasi</option>
                    {organizations.filter(org => org.level?.slug === "pc").map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.organization_id && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {formErrors.organization_id}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Tema <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                    formErrors.nama ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                  placeholder="Masukkan nama tema"
                  disabled={isDisabled}
                />
                {formErrors.nama && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {formErrors.nama}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Periode <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  placeholder="Contoh: 2024/2025"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 resize-none bg-white"
                  placeholder="Masukkan deskripsi tema"
                  disabled={isDisabled}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                      formErrors.tanggal_mulai ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                    }`}
                    disabled={isDisabled}
                  />
                  {formErrors.tanggal_mulai && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {formErrors.tanggal_mulai}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                      formErrors.tanggal_selesai ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"
                    }`}
                    disabled={isDisabled}
                  />
                  {formErrors.tanggal_selesai && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {formErrors.tanggal_selesai}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => {
                        setFormData({ ...formData, is_active: e.target.checked });
                        setIsManualOverride(true);
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      disabled={isDisabled}
                    />
                    <span className="text-sm font-semibold text-gray-700">Status Aktif</span>
                  </label>
                  
                  {formData.tanggal_mulai && formData.tanggal_selesai && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className="inline-flex items-center gap-1">
                        {getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai) ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        Otomatis: {getAutoStatus(formData.tanggal_mulai, formData.tanggal_selesai) ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  )}
                </div>
                
                {isManualOverride && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Status sedang diatur secara manual. Centang/hapus centang untuk mengubah.
                    </p>
                  </div>
                )}
                
                {!isManualOverride && formData.tanggal_mulai && formData.tanggal_selesai && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Status diatur otomatis berdasarkan tanggal. Centang kotak untuk mengatur manual.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-semibold mb-1">Informasi:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Status aktif akan diatur otomatis berdasarkan tanggal</li>
                      <li>Anda dapat mengesampingkan status otomatis dengan mencentang/menghapus centang</li>
                      <li>Hanya tema yang aktif yang bisa dipilih untuk program kerja</li>
                      <li>Tema yang sudah memiliki program kerja tidak dapat dihapus</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDisabled}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
          >
            {mode === "view" ? "Tutup" : "Batal"}
          </button>
          {mode !== "view" && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isDisabled}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isDisabled ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                "Simpan"
              ) : (
                "Update"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramThemesForm;