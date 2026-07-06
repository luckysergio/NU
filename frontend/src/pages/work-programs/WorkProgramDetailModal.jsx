import React from "react";
import { X, Briefcase, Building2, Calendar, FolderTree, Layers, Target, Flag, FileText, User, Eye, Edit2 } from "lucide-react";

const WorkProgramDetailModal = ({ isOpen, onClose, program, onViewActivity, onEditActivity, formatDate, formatCurrency, renderStatusBadge }) => {
  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Detail Program Kerja</h2>
              <p className="text-emerald-100 text-sm mt-0.5">Informasi lengkap program</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center border-b border-gray-100 pb-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Briefcase className="w-10 h-10 text-emerald-600" /></div>
            <h3 className="text-xl font-bold text-gray-800">{program.nama_program}</h3>
            <div className="mt-2">{renderStatusBadge(program.status)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-emerald-600" /><p className="text-xs font-medium text-gray-500 uppercase">Organisasi</p></div><p className="text-sm font-semibold text-gray-800">{program.organization?.nama || "-"}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-emerald-600" /><p className="text-xs font-medium text-gray-500 uppercase">Tahun</p></div><p className="text-sm font-semibold text-gray-800">{program.tahun}</p></div>
            <div className="bg-purple-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><FolderTree className="w-4 h-4 text-purple-600" /><p className="text-xs font-medium text-purple-600 uppercase">Tema</p></div><p className="text-sm font-semibold text-gray-800">{program.theme?.nama || "-"}</p></div>
            <div className="bg-blue-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Layers className="w-4 h-4 text-blue-600" /><p className="text-xs font-medium text-blue-600 uppercase">Bidang</p></div><p className="text-sm font-semibold text-gray-800">{program.field?.nama || "-"}</p></div>
            <div className="bg-amber-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-amber-600" /><p className="text-xs font-medium text-amber-600 uppercase">Sasaran</p></div><p className="text-sm font-semibold text-gray-800">{program.target?.nama || "-"}</p></div>
            <div className="bg-green-50 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><Flag className="w-4 h-4 text-green-600" /><p className="text-xs font-medium text-green-600 uppercase">Tujuan</p></div><p className="text-sm font-semibold text-gray-800">{program.goal?.nama || "-"}</p></div>
          </div>

          {program.deskripsi && (
            <div className="bg-gray-50 rounded-xl p-4"><FileText className="w-4 h-4 text-gray-400 mb-2" /><p className="text-sm text-gray-700 leading-relaxed">{program.deskripsi}</p></div>
          )}

          {program.activities && program.activities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-700 border-l-4 border-emerald-500 pl-3">Daftar Kegiatan</h4>
              {program.activities.map((activity) => (
                <div key={activity.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500">{formatDate(activity.tanggal_pelaksanaan)}</span></div>
                      <h5 className="font-semibold text-gray-800 mb-2">{activity.nama_kegiatan}</h5>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.catatan || activity.deskripsi || "-"}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(activity.total_pengeluaran)}</span>
                        <span className="text-xs text-gray-500">PJ: {activity.penanggung_jawab?.nama || "-"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onViewActivity(activity)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" /> Detail</button>
                      <button onClick={() => onEditActivity(activity)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Tutup</button>
        </div>
      </div>
    </div>
  );
};

export default WorkProgramDetailModal;