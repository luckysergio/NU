import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Receipt,
  Image as ImageIcon,
  Paperclip,
  Download,
  File,
  FileImage,
  FileArchive,
  Users,
  UserCheck,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  FolderOpen,
  Building2,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { activityService } from "../../services/activityService";
import { getStoragePath } from "../../utils/storageUrl";

const getImageUrl = (path) => (path ? getStoragePath(path) : "");

const getFileIcon = (fileType) => {
  const type = fileType?.toLowerCase();
  if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (["doc", "docx"].includes(type)) return <FileText className="w-5 h-5 text-blue-500" />;
  if (["xls", "xlsx"].includes(type)) return <FileArchive className="w-5 h-5 text-green-500" />;
  if (["ppt", "pptx"].includes(type)) return <FileArchive className="w-5 h-5 text-orange-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(type)) return <FileImage className="w-5 h-5 text-purple-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 bytes";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " bytes";
};

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

const ProgramThemesDetailActivity = ({
  isOpen,
  activityId,
  activityData,
  onClose,
  formatDate,
  error,
}) => {
  const [activity, setActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    if (!isOpen) {
      setActivity(null);
      setActiveTab("detail");
      return;
    }

    if (activityData) {
      setActivity(activityData);
      return;
    }

    if (activityId) {
      const fetchActivity = async () => {
        setIsLoading(true);
        try {
          const result = await activityService.getById(activityId);
          if (result.success) {
            setActivity(result.data);
          } else {
            error("Gagal", result.message || "Gagal memuat detail kegiatan");
            onClose();
          }
        } catch (err) {
          console.error('Load activity error:', err);
          error("Gagal", err?.response?.data?.message || err?.message || "Terjadi kesalahan");
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      fetchActivity();
    }
  }, [isOpen, activityId, activityData, error, onClose]);

  // ✅ PERBAIKAN: Group anggota hadir berdasarkan organisasi partisipan (berbasis biodata_id)
  const attendanceByOrganization = useMemo(() => {
    if (!activity?.participant_organizations || !activity?.attendances) {
      return [];
    }

    // Kumpulkan semua biodata_id yang hadir
    const attendedBiodataIds = new Set(
      activity.attendances
        .filter((att) => att.anggota)
        .map((att) => att.anggota.biodata_id || att.anggota_id)
        .filter(Boolean)
    );

    return activity.participant_organizations.map((org) => {
      // Filter anggota yang hadir berdasarkan biodata_id
      const anggotaHadir = (org.anggotas || []).filter((anggota) => {
        const biodataId = anggota.biodata_id || anggota.biodata?.id;
        return biodataId && attendedBiodataIds.has(biodataId);
      });

      // Hitung total anggota unik di organisasi ini (berbasis biodata_id)
      const uniqueBiodataIdsInOrg = new Set(
        (org.anggotas || [])
          .map((a) => a.biodata_id || a.biodata?.id)
          .filter(Boolean)
      );

      return {
        organization: org,
        totalAnggota: uniqueBiodataIdsInOrg.size,
        anggotaHadir: anggotaHadir,
        totalHadir: anggotaHadir.length,
      };
    });
  }, [activity]);

  // ✅ PERBAIKAN: Statistics berbasis biodata_id unik secara global
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
    
    // 1. Kumpulkan semua biodata_id unik dari semua organisasi partisipan
    const allUniqueBiodataIds = new Set();
    activity.participant_organizations?.forEach((org) => {
      (org.anggotas || []).forEach((anggota) => {
        const biodataId = anggota.biodata_id || anggota.biodata?.id;
        if (biodataId) {
          allUniqueBiodataIds.add(biodataId);
        }
      });
    });

    // 2. Kumpulkan semua biodata_id yang hadir
    const attendedBiodataIdsGlobal = new Set(
      (activity.attendances || [])
        .filter((att) => att.anggota)
        .map((att) => att.anggota.biodata_id || att.anggota_id)
        .filter(Boolean)
    );

    // 3. Hitung total hadir yang unik (hanya yang ada di daftar peserta)
    let globalTotalHadir = 0;
    allUniqueBiodataIds.forEach((id) => {
      if (attendedBiodataIdsGlobal.has(id)) {
        globalTotalHadir++;
      }
    });

    const totalAnggotaUnique = allUniqueBiodataIds.size;
    const percentage = totalAnggotaUnique > 0 ? Math.round((globalTotalHadir / totalAnggotaUnique) * 100) : 0;

    return {
      totalOrganizations,
      totalAnggota: totalAnggotaUnique,
      totalHadir: globalTotalHadir,
      percentage,
    };
  }, [activity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-white">Detail Kegiatan</h2>
              {activity && (
                <p className="text-emerald-100 text-sm mt-0.5 truncate max-w-md mx-auto">
                  {activity.nama_kegiatan}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Memuat detail kegiatan...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && activity && (
          <>
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

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Detail Tab */}
              {activeTab === "detail" && (
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

                  {/* Total Pengeluaran + Foto Bukti */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                      <DollarSign className="w-3 h-3" /> Total Pengeluaran
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(activity.total_pengeluaran || 0)}
                    </p>

                    {/* Foto Bukti Pengeluaran */}
                    {activity.expense_photos?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-3">
                          <Receipt className="w-3 h-3" /> Foto Bukti Pengeluaran ({activity.expense_photos.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {activity.expense_photos.map((photo, idx) => {
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
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === "attendance" && (
                <div className="space-y-5">
                  {activity.participant_organizations?.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-semibold text-blue-600 uppercase">Organisasi</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-700">
                            {stats.totalOrganizations}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-purple-600" />
                            <p className="text-xs font-semibold text-purple-600 uppercase">Total Peserta (Unik)</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-700">
                            {stats.totalAnggota}
                          </p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs font-semibold text-emerald-600 uppercase">Hadir</p>
                          </div>
                          <p className="text-2xl font-bold text-emerald-700">
                            {stats.totalHadir}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <p className="text-xs font-semibold text-orange-600 uppercase">Persentase</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-700">
                            {stats.percentage}%
                          </p>
                        </div>
                      </div>

                      {/* Attendance by Organization */}
                      <div className="space-y-4">
                        {attendanceByOrganization.map((orgData) => (
                          <div
                            key={orgData.organization.id}
                            className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
                          >
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
                                  {orgData.anggotaHadir.map((anggota) => {
                                    // ✅ Fallback aman untuk mengambil nama dari accessor atau nested biodata
                                    const nama = anggota.nama || anggota.biodata?.nama || "Tanpa Nama";
                                    const jabatanNama = anggota.jabatan?.nama || "-";

                                    return (
                                      <div
                                        key={anggota.biodata_id || anggota.id} // ✅ Gunakan biodata_id sebagai key
                                        className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg"
                                      >
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">
                                            {nama}
                                          </p>
                                          {jabatanNama !== "-" && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {jabatanNama}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Belum ada organisasi partisipan</p>
                      <p className="text-sm text-gray-400">
                        Tambahkan organisasi peserta untuk melihat absensi
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-5">
                  {activity.documents?.length > 0 ? (
                    <>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                Total Dokumen
                              </p>
                              <p className="text-xs text-gray-500">
                                {activity.documents.length} dokumen diupload
                              </p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-emerald-600">
                            {activity.documents.length}
                          </p>
                        </div>
                      </div>

                      {/* Group by category */}
                      {(() => {
                        const groupedDocs = activity.documents.reduce((acc, doc) => {
                          const category = doc.category || "lainnya";
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(doc);
                          return acc;
                        }, {});

                        return Object.entries(groupedDocs).map(([category, docs]) => (
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
                                    <div className="shrink-0">
                                      {getFileIcon(doc.file_type || doc.fileType)}
                                    </div>

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
                        ));
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Belum ada dokumen pendukung</p>
                      <p className="text-sm text-gray-400">
                        Upload dokumen untuk melengkapi kegiatan ini
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
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

export default ProgramThemesDetailActivity;