import React, { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import {
  X,
  Save,
  Loader2,
  Camera,
  Image as ImageIcon,
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  FileArchive,
  AlertCircle,
  Paperclip,
  Edit,
  XCircle,
  CheckCircle,
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
  onFileChange,
  onRemoveFile,
  onRemoveExistingPhoto,
  onRemoveExistingExpensePhoto,
  getImageUrl,
  // ✅ Props untuk dokumen
  documents = [],
  onDocumentUpload,
  onDocumentDelete,
  onDocumentDownload,
  isUploadingDocument = false,
}) => {
  const { success, error, warning } = useModal();

  const [editMode, setEditMode] = useState({
    status: false,
    total_pengeluaran: false,
  });

  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [tempData, setTempData] = useState({});

  useEffect(() => {
    if (selectedActivity) {
      setEditMode({
        status: false,
        total_pengeluaran: false,
      });
    }
  }, [selectedActivity]);

  useEffect(() => {
    if (!isOpen) {
      setEditMode({
        status: false,
        total_pengeluaran: false,
      });
      setDocumentName("");
      setDocumentDescription("");
      setPendingFiles([]);
      setTempData({});
    }
  }, [isOpen]);

  if (!isOpen || !selectedActivity) return null;

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================

  const toggleEditMode = (field) => {
    if (editMode[field]) {
      if (tempData[field] !== undefined) {
        setDetailFormData((prev) => ({
          ...prev,
          [field]: tempData[field],
        }));
      }
      setEditMode((prev) => ({ ...prev, [field]: false }));
    } else {
      setTempData((prev) => ({
        ...prev,
        [field]: detailFormData[field],
      }));
      setEditMode((prev) => ({ ...prev, [field]: true }));
    }
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (["pdf"].includes(type)) return <FileText className="w-6 h-6 text-red-500" />;
    if (["doc", "docx"].includes(type)) return <FileText className="w-6 h-6 text-blue-500" />;
    if (["xls", "xlsx"].includes(type)) return <FileArchive className="w-6 h-6 text-green-500" />;
    if (["ppt", "pptx"].includes(type)) return <FileArchive className="w-6 h-6 text-orange-500" />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(type)) return <FileImage className="w-6 h-6 text-purple-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const getPendingFileIcon = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return getFileIcon(extension);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 bytes";
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " bytes";
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 10) {
      warning("Peringatan", "Maksimal 10 file per upload");
      e.target.value = "";
      return;
    }

    setPendingFiles(files);
    e.target.value = "";
  };

  const handleRemovePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearPendingFiles = () => {
    setPendingFiles([]);
    setDocumentName("");
    setDocumentDescription("");
  };

  const handleConfirmUpload = async () => {
    if (!documentName.trim()) {
      warning("Peringatan", "Nama dokumen wajib diisi");
      return;
    }

    if (pendingFiles.length === 0) {
      warning("Peringatan", "Pilih dokumen terlebih dahulu");
      return;
    }

    if (!onDocumentUpload) {
      error("Error", "Handler upload tidak tersedia. Silakan refresh halaman.");
      return;
    }

    const formData = new FormData();
    pendingFiles.forEach((file) => {
      formData.append("documents[]", file);
    });
    formData.append("name", documentName);
    if (documentDescription) {
      formData.append("description", documentDescription);
    }

    try {
      const result = await onDocumentUpload(formData);

      if (result === undefined || result?.success === true) {
        success("Berhasil", `${pendingFiles.length} dokumen berhasil diupload`);
        setPendingFiles([]);
        setDocumentName("");
        setDocumentDescription("");
      } else {
        error("Gagal", result?.message || "Upload dokumen gagal");
      }
    } catch (err) {
      console.error('Upload error:', err);
      error("Error", err?.message || "Terjadi kesalahan saat upload dokumen");
    }
  };

  const handleDeleteDocument = (documentId, documentName) => {
    if (!onDocumentDelete) {
      error("Error", "Handler delete tidak tersedia");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus dokumen "${documentName}"?`,
      async () => {
        try {
          const result = await onDocumentDelete(documentId);
          if (result === undefined || result?.success === true) {
            success("Berhasil", "Dokumen berhasil dihapus");
          } else {
            error("Gagal", result?.message || "Gagal menghapus dokumen");
          }
        } catch (err) {
          console.error('Delete error:', err);
          error("Error", err?.message || "Terjadi kesalahan saat menghapus dokumen");
        }
      }
    );
  };

  const handleDownloadDocument = (documentId, documentName) => {
    if (!onDocumentDownload) {
      error("Error", "Handler download tidak tersedia");
      return;
    }

    try {
      onDocumentDownload(documentId, documentName);
    } catch (err) {
      console.error('Download error:', err);
      error("Error", err?.message || "Terjadi kesalahan saat download dokumen");
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                Informasi lengkap dan dokumentasi kegiatan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* SECTION 1: INFORMASI DASAR */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Nama Kegiatan</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{selectedActivity.nama_kegiatan}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Program Kerja</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.work_program?.nama_program || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Organisasi Pelaksana</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.organization?.nama || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Penanggung Jawab</p>
                  {/* ✅ PERBAIKAN: Mengambil nama dari relasi biodata dengan fallback */}
                  <p className="text-sm text-gray-800 mt-1">
                    {selectedActivity.penanggung_jawab?.biodata?.nama || selectedActivity.penanggung_jawab?.nama || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pelaksanaan</p>
                  <p className="text-sm text-gray-800 mt-1">{formatDate(selectedActivity.tanggal_pelaksanaan)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Dibuat Oleh</p>
                  <p className="text-sm text-gray-800 mt-1">{selectedActivity.creator?.name || "-"}</p>
                </div>
              </div>

              {selectedActivity.deskripsi && (
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Deskripsi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedActivity.deskripsi}</p>
                </div>
              )}
            </div>

            {/* SECTION 2: STATUS */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Status Kegiatan
                </h3>
                <button
                  onClick={() => toggleEditMode("status")}
                  className={`p-2 rounded-lg transition-all ${
                    editMode.status ? "bg-gray-200 text-gray-700" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                  title={editMode.status ? "Batal" : "Edit Status"}
                >
                  {editMode.status ? <XCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </button>
              </div>

              {editMode.status ? (
                <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Status</label>
                  <select
                    value={detailFormData.status}
                    onChange={(e) => setDetailFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  {getStatusBadge(detailFormData.status || selectedActivity.status)}
                </div>
              )}
            </div>

            {/* SECTION 4: FOTO KEGIATAN */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Foto Kegiatan
                <span className="text-xs text-gray-400 font-normal">
                  ({(selectedActivity.photos?.length || 0) - detailDeletedPhotoIds.length + detailPhotos.length}/{MAX_PHOTOS})
                </span>
              </h3>

              {selectedActivity.photos &&
                selectedActivity.photos.filter((p) => !detailDeletedPhotoIds.includes(p.id)).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Foto Saat Ini</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedActivity.photos.map((photo) => (
                        !detailDeletedPhotoIds.includes(photo.id) && (
                          <div key={photo.id} className="relative group">
                            <img
                              src={getImageUrl(photo.file_path)}
                              alt="Kegiatan"
                              className="w-full h-28 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveExistingPhoto(photo.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                              title="Hapus foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Foto Baru</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onFileChange(e, "photos")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: JPG, JPEG, PNG, WEBP • Maks: 5MB per foto</p>

                {detailPhotoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detailPhotoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-300"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveFile(idx, "photos")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: NOMINAL PENGELUARAN */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-600" />
                  Nominal Pengeluaran
                </h3>
                <button
                  onClick={() => toggleEditMode("total_pengeluaran")}
                  className={`p-2 rounded-lg transition-all ${
                    editMode.total_pengeluaran ? "bg-gray-200 text-gray-700" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                  title={editMode.total_pengeluaran ? "Batal" : "Edit Nominal"}
                >
                  {editMode.total_pengeluaran ? <XCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </button>
              </div>

              {editMode.total_pengeluaran ? (
                <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Pengeluaran</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input
                      type="text"
                      value={detailFormData.total_pengeluaran ? formatRupiah(detailFormData.total_pengeluaran) : ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setDetailFormData((prev) => ({ ...prev, total_pengeluaran: value }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(detailFormData.total_pengeluaran || selectedActivity.total_pengeluaran)}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 6: BUKTI PENGELUARAN */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Bukti Pengeluaran
              </h3>

              {selectedActivity.expense_photos &&
                selectedActivity.expense_photos.filter((p) => !detailDeletedExpensePhotoIds.includes(p.id)).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bukti Saat Ini</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedActivity.expense_photos.map((photo) => (
                        !detailDeletedExpensePhotoIds.includes(photo.id) && (
                          <div key={photo.id} className="relative group">
                            <img
                              src={getImageUrl(photo.file_path)}
                              alt="Bukti Pengeluaran"
                              className="w-full h-28 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveExistingExpensePhoto(photo.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                              title="Hapus bukti"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Bukti Baru</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onFileChange(e, "expense_photos")}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: JPG, JPEG, PNG, WEBP • Maks: 5MB per foto</p>

                {detailExpensePhotoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detailExpensePhotoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt={`Expense Preview ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-300"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveFile(idx, "expense_photos")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 7: DOKUMEN */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                Dokumen Pendukung
                <span className="text-xs text-gray-400 font-normal">({documents.length} dokumen)</span>
              </h3>

              {/* Upload Form */}
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-dashed border-emerald-300 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <Upload className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">Upload Dokumen Baru</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Isi nama & keterangan, pilih file, lalu klik "Upload" untuk konfirmasi
                    </p>
                  </div>
                </div>

                {/* Nama Dokumen */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Nama Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Contoh: Proposal Kegiatan, Laporan Keuangan, dll"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    disabled={isUploadingDocument}
                  />
                </div>

                {/* Keterangan Dokumen */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Keterangan Dokumen <span className="text-xs text-gray-400">(Opsional)</span>
                  </label>
                  <textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    placeholder="Keterangan singkat tentang dokumen..."
                    rows="2"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm resize-none"
                    disabled={isUploadingDocument}
                  />
                </div>

                {/* File Input */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Pilih File <span className="text-red-500">*</span>
                  </label>
                  <label className="block">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-emerald-400 rounded-lg cursor-pointer hover:bg-emerald-50 transition-all">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        {pendingFiles.length > 0
                          ? `${pendingFiles.length} file dipilih (klik untuk ganti)`
                          : "Klik untuk Pilih Dokumen (Multiple)"}
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileSelect}
                      disabled={isUploadingDocument}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preview Pending Files */}
                {pendingFiles.length > 0 && (
                  <div className="mb-3 bg-white rounded-lg border-2 border-amber-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        File Siap Diupload ({pendingFiles.length})
                      </p>
                      <button
                        type="button"
                        onClick={handleClearPendingFiles}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        disabled={isUploadingDocument}
                      >
                        <XCircle className="w-3 h-3" />
                        Batal
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {pendingFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg"
                        >
                          <div className="shrink-0">
                            {getPendingFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingFile(idx)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded transition-all"
                            disabled={isUploadingDocument}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="mb-3 flex items-start gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <p>
                    Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, WEBP •
                    Maks: 10MB per file • Maks: 10 file per upload
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    disabled={isUploadingDocument || pendingFiles.length === 0 || !documentName.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    {isUploadingDocument ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload {pendingFiles.length > 0 ? `${pendingFiles.length} File` : "Dokumen"}</span>
                      </>
                    )}
                  </button>

                  {pendingFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearPendingFiles}
                      disabled={isUploadingDocument}
                      className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all disabled:opacity-50"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Documents List */}
              {documents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Dokumen yang Sudah Diupload
                  </p>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                    >
                      <div className="shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {doc.name || doc.file_name}
                        </p>

                        {doc.description && (
                          <p className="text-xs text-gray-600 mt-0.5 italic">
                            {doc.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </span>
                          {doc.uploaded_at && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(doc.uploaded_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc.id, doc.name || doc.file_name)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id, doc.name || doc.file_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Paperclip className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belum ada dokumen yang diupload</p>
                  <p className="text-xs text-gray-400 mt-1">Upload dokumen untuk melengkapi kegiatan ini</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER - Sticky */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Tutup
          </button>
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
        </div>
      </div>
    </div>
  );
};

export default ActivitiesDetail;