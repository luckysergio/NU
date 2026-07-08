// src/pages/program-themes/ProgramThemesDetail.jsx
import React, { useState } from "react";
import {
  Building2,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
} from "lucide-react";

const ProgramThemesDetail = ({
  statistics,
  isSuperAdmin,
  formatDate,
  onOpenActivity,
}) => {
  const [loadingActivities, setLoadingActivities] = useState({});

  const sortedOrganizations = [...(statistics.organizations_status || [])].sort((a, b) => {
    if (a.has_work_program !== b.has_work_program) {
      return a.has_work_program ? -1 : 1;
    }
    return a.nama.localeCompare(b.nama);
  });

  const colSpan = isSuperAdmin ? 9 : 8;

  /**
   * ✅ Handler untuk membuka activity
   * Jika hanya 1 activity → langsung buka detail
   * Jika lebih dari 1 → buka activity pertama (untuk sekarang)
   */
  const handleViewActivities = (org) => {
    const activities = org.activities || [];
    
    if (activities.length === 0) {
      alert('Tidak ada data kegiatan untuk MWC ini');
      return;
    }

    if (activities.length === 1) {
      // Langsung buka detail
      onOpenActivity(activities[0].id);
    } else {
      // Jika lebih dari 1, buka yang pertama untuk sekarang
      // TODO: Implementasi modal list activities
      onOpenActivity(activities[0].id);
    }
  };

  return (
    <tr className="bg-gray-50">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Status Program Kerja per MWC
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-125">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">No</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Nama MWC</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Jumlah Proker</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Jumlah Kegiatan</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedOrganizations.map((org, idx) => {
                  const activitiesCount = org.activities_count || 0;
                  const hasActivities = activitiesCount > 0;
                  const isLoading = loadingActivities[org.id];

                  return (
                    <tr key={org.id} className="hover:bg-gray-100">
                      <td className="text-center px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                      <td className="text-left px-4 py-3 text-sm font-medium text-gray-800">{org.nama}</td>
                      <td className="text-center px-4 py-3 text-sm text-gray-600">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                          org.work_program_count > 0 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {org.work_program_count}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-gray-600">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-xs ${
                          hasActivities
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {activitiesCount}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          org.has_work_program 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      {/* ✅ Kolom Aksi */}
                      <td className="text-center px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol View Activities */}
                          <button
                            onClick={() => handleViewActivities(org)}
                            disabled={!hasActivities || isLoading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={hasActivities ? `Lihat ${activitiesCount} Kegiatan` : 'Tidak ada kegiatan'}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>

                          {/* Tombol Detail Kegiatan (jika hanya 1) */}
                          {activitiesCount === 1 && (
                            <button
                              onClick={() => handleViewActivities(org)}
                              disabled={isLoading}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Detail Kegiatan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {/* Badge jumlah kegiatan */}
                          {activitiesCount > 1 && (
                            <span className="text-xs text-gray-500">
                              ({activitiesCount})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Total:</td>
                  <td className="text-center px-4 py-3 text-sm font-semibold text-emerald-600">
                    {statistics.total_work_programs || 0}
                  </td>
                  <td className="text-center px-4 py-3 text-sm font-semibold text-blue-600">
                    {statistics.total_activities || 0}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ProgramThemesDetail;