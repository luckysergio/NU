import React, { useState, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Building2,
  Users,
  CheckCircle,
  Download,
  File,
  FileImage,
  FileArchive,
  Info,
  Clock,
  UserCheck,
  FolderOpen,
  Receipt,
} from "lucide-react";
import { getStoragePath } from "../../utils/storageUrl";

const getImageUrl = (path) => (path ? getStoragePath(path) : "");

/**
 * Get icon berdasarkan tipe file
 */
const getFileIcon = (fileType) => {
  const type = fileType?.toLowerCase();
  if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (["doc", "docx"].includes(type)) return <FileText className="w-5 h-5 text-blue-500" />;
  if (["xls", "xlsx"].includes(type)) return <FileArchive className="w-5 h-5 text-green-500" />;
  if (["ppt", "pptx"].includes(type)) return <FileArchive className="w-5 h-5 text-orange-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(type)) return <FileImage className="w-5 h-5 text-purple-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 bytes";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " bytes";
};

/**
 * Get status badge
 */
const getStatusBadge = (status) => {
  const statusMap = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
    completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
  };
  const s = statusMap[status] || { label: status || "-", color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
};

const ActivityDetailModal = ({
  isOpen,
  onClose,
  activity,
  formatDate,
  formatCurrency,
}) => {
  // =========================================================================
  // ✅ SEMUA HOOKS DIPANGGIL DI AWAL (Rules of Hooks)
  // =========================================================================
  const [activeTab, setActiveTab] = useState("detail");

  // Group anggota hadir berdasarkan organisasi partisipan
  const attendanceByOrganization = useMemo(() => {
    if (!activity?.participant_organizations || !activity?.attendances) {
      return [];
    }

    const attendedIds = new Set(
      activity.attendances.map((att) => att.anggota_id)
    );

    return activity.participant_organizations.map((org) => {
      const anggotaHadir = (org.anggotas || []).filter((anggota) =>
        attendedIds.has(anggota.id)
      );

      return {
        organization: org,
        totalAnggota: (org.anggotas || []).length,
        anggotaHadir: anggotaHadir,
        totalHadir: anggotaHadir.length,
      };
    });
  }, [activity]);

  // Statistics
  const stats = useMemo(() => {
    if (!activity) {
      return {
        totalOrganizations: 0,
        totalAnggota: 0,
        totalHadir: 0,
        percentage: 0,
      };
    }

    const totalOrganizations = activity.participant_organizations?.length || 0;
    const totalAnggota = attendanceByOrganization.reduce(
      (sum, org) => sum + org.totalAnggota,
      0
    );
    const totalHadir = activity.attendances?.length || 0;
    const percentage = totalAnggota > 0 ? Math.round((totalHadir / totalAnggota) * 100) : 0;

    return {
      totalOrganizations,
      totalAnggota,
      totalHadir,
      percentage,
    };
  }, [activity, attendanceByOrganization]);

  // ✅ Normalize expense photos
  const expensePhotos = useMemo(() => {
    if (!activity) return [];
    return (
      activity.expense_photos || 
      activity.expensePhotos || 
      activity.bukti_pengeluaran || 
      []
    );
  }, [activity]);

  // =========================================================================
  // ✅ EARLY RETURN SETELAH SEMUA HOOKS DIPANGGIL
  // =========================================================================
  if (!isOpen || !activity) return null;

  // =========================================================================
  // RENDER TABS
  // =========================================================================

  const renderDetailTab = () => (
    <div className="space-y-5">
      {/* Informasi Dasar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <FileText className="w-3 h-3" /> Nama Kegiatan
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {activity.nama_kegiatan}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <FolderOpen className="w-3 h-3" /> Program Kerja
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {activity.work_program?.nama_program || "-"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Tanggal Pelaksanaan
          </p>
          <p className="text-sm text-gray-800 mt-1">
            {formatDate(activity.tanggal_pelaksanaan)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Status
          </p>
          <div className="mt-1">{getStatusBadge(activity.status)}</div>
        </div>
      </div>

      {/* ✅ BARU: Total Pengeluaran + Foto Bukti Pengeluaran */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
          <DollarSign className="w-3 h-3" /> Total Pengeluaran
        </p>
        <p className="text-lg font-bold text-emerald-600">
          {formatCurrency(activity.total_pengeluaran)}
        </p>

        {/* ✅ BARU: Foto Bukti Pengeluaran */}
        {expensePhotos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-3">
              <Receipt className="w-3 h-3" /> Foto Bukti Pengeluaran ({expensePhotos.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {expensePhotos.map((photo, idx) => {
                const filePath = photo.file_path || photo.filePath || photo;
                return (
                  <a
                    key={idx}
                    href={getImageUrl(filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={getImageUrl(filePath)}
                      alt={`Bukti ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity border border-gray-200"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/400?text=No+Image";
                      }}
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Catatan */}
      {activity.catatan && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Catatan
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {activity.catatan}
          </p>
        </div>
      )}

      {/* Rincian Pengeluaran */}
      {activity.expense_descriptions?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Rincian Pengeluaran
          </p>
          <div className="space-y-2">
            {activity.expense_descriptions.map((exp, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0"
              >
                <span className="text-sm text-gray-700">{exp.description}</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foto Kegiatan */}
      {activity.photos?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            Foto Kegiatan ({activity.photos.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {activity.photos.map((p, idx) => {
              const filePath = p.file_path || p.filePath || p;
              return (
                <a
                  key={idx}
                  href={getImageUrl(filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={getImageUrl(filePath)}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/400?text=No+Image";
                    }}
                  />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* File Absensi */}
      {activity.attendance_files?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-600" />
            File Absensi ({activity.attendance_files.length})
          </p>
          <div className="space-y-2">
            {activity.attendance_files.map((att, idx) => {
              const filePath = att.file_path || att.filePath || att;
              return (
                <a
                  key={idx}
                  href={getImageUrl(filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="flex-1 truncate">
                    {att.file_name || att.fileName || `File Absensi ${idx + 1}`}
                  </span>
                  <Download className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderAttendanceTab = () => {
    if (stats.totalOrganizations === 0) {
      return (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Belum ada organisasi partisipan</p>
          <p className="text-sm text-gray-400">
            Tambahkan organisasi peserta untuk melihat absensi
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-600 uppercase">Organisasi</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalOrganizations}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-600 uppercase">Total Peserta</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.totalAnggota}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-600 uppercase">Hadir</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.totalHadir}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-600 uppercase">Persentase</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats.percentage}%</p>
          </div>
        </div>

        {/* Attendance by Organization */}
        <div className="space-y-4">
          {attendanceByOrganization.map((orgData) => (
            <div
              key={orgData.organization.id}
              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Organization Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {orgData.organization.nama}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {orgData.organization.level?.nama || orgData.organization.level?.display_name || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {orgData.totalHadir}/{orgData.totalAnggota}
                    </p>
                    <p className="text-xs text-gray-500">Anggota Hadir</p>
                  </div>
                </div>
              </div>

              {/* Anggota Hadir */}
              <div className="p-4">
                {orgData.totalAnggota === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Organisasi ini belum memiliki data anggota
                    </p>
                  </div>
                ) : orgData.anggotaHadir.length === 0 ? (
                  <div className="text-center py-4">
                    <UserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada anggota yang hadir</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {orgData.anggotaHadir.map((anggota) => (
                      <div
                        key={anggota.id}
                        className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {anggota.nama}
                          </p>
                          {anggota.jabatan?.nama && (
                            <p className="text-xs text-gray-500 truncate">
                              {anggota.jabatan.nama}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => {
    const documents = activity.documents || [];

    if (documents.length === 0) {
      return (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Belum ada dokumen pendukung</p>
          <p className="text-sm text-gray-400">
            Upload dokumen untuk melengkapi kegiatan ini
          </p>
        </div>
      );
    }

    // Group by category
    const groupedDocs = documents.reduce((acc, doc) => {
      const category = doc.category || "lainnya";
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    }, {});

    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Total Dokumen
                </p>
                <p className="text-xs text-gray-500">
                  {documents.length} dokumen diupload
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {documents.length}
            </p>
          </div>
        </div>

        {/* Documents by Category */}
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 capitalize flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              {category === "lainnya" ? "Lainnya" : category}
              <span className="text-xs text-gray-400">({docs.length})</span>
            </h3>
            <div className="space-y-2">
              {docs.map((doc) => {
                const filePath = doc.file_path || doc.filePath || "";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-colors"
                  >
                    {/* Icon */}
                    <div className="shrink-0">
                      {getFileIcon(doc.file_type || doc.fileType)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {doc.name || doc.file_name || doc.fileName || "Dokumen"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size || doc.fileSize)}
                        </span>
                        {doc.category && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full capitalize">
                              {doc.category}
                            </span>
                          </>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-gray-600 mt-1 italic truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {/* Download Button */}
                    <a
                      href={getImageUrl(filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ✅ HEADER: Centered tanpa tombol X */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10 shrink-0">
          <div className="flex justify-center items-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
              <p className="text-emerald-100 text-sm mt-0.5 truncate max-w-md">
                {activity.nama_kegiatan}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("detail")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "detail"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Detail
              </div>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "attendance"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Absensi
                {stats.totalHadir > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    {stats.totalHadir}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "documents"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Dokumen
                {(activity.documents?.length || 0) > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    {activity.documents?.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "detail" && renderDetailTab()}
          {activeTab === "attendance" && renderAttendanceTab()}
          {activeTab === "documents" && renderDocumentsTab()}
        </div>

        {/* ✅ FOOTER: Hanya tombol Tutup, tanpa Edit */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;