// src/pages/program-themes/ProgramThemesActivityList.jsx
import React, { useState } from "react";
import {
  Calendar,
  Eye,
  Building2,
  FileText,
  Clock,
  Search,
  X,
  CheckCircle,
} from "lucide-react";

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

const ProgramThemesActivityList = ({
  isOpen,
  mwcName,
  activities,
  onClose,
  onSelectActivity,
  formatDate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // ✅ Filter activities berdasarkan search
  const filteredActivities = (activities || []).filter((activity) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      activity.nama_kegiatan?.toLowerCase().includes(search) ||
      activity.work_program?.nama_program?.toLowerCase().includes(search) ||
      activity.status?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Daftar Kegiatan
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {mwcName} • {activities.length} kegiatan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {activities.length > 3 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kegiatan berdasarkan nama, program, atau status..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm ? "Tidak ada kegiatan yang cocok dengan pencarian" : "Belum ada kegiatan"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-800 mb-2">
                        {activity.nama_kegiatan}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(activity.tanggal_pelaksanaan)}
                        </span>
                        
                        {activity.work_program?.nama_program && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {activity.work_program.nama_program}
                            </span>
                          </>
                        )}

                        {activity.status && (
                          <>
                            <span className="text-gray-300">•</span>
                            {getStatusBadge(activity.status)}
                          </>
                        )}

                        {activity.total_pengeluaran > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Rp {new Intl.NumberFormat("id-ID").format(activity.total_pengeluaran)}
                            </span>
                          </>
                        )}
                      </div>

                      {activity.catatan && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {activity.catatan}
                        </p>
                      )}

                      {/* Info tambahan */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activity.participant_organizations?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {activity.participant_organizations.length} Organisasi
                          </span>
                        )}

                        {activity.attendances?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            {activity.attendances.length} Hadir
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectActivity(activity.id, activity)}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-500">
            Menampilkan {filteredActivities.length} dari {activities.length} kegiatan
          </p>
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

export default ProgramThemesActivityList;