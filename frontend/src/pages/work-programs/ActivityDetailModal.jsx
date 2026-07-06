import React from "react";
import { X, Edit2, Calendar, DollarSign, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { getStoragePath } from "../../utils/storageUrl";

const getImageUrl = (path) => path ? getStoragePath(path) : "";

const ActivityDetailModal = ({ isOpen, onClose, activity, onEdit, formatDate, formatCurrency }) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-white">Detail Kegiatan</h2><p className="text-emerald-100 text-sm mt-0.5">Informasi kegiatan</p></div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-500 uppercase">Nama</p><p className="text-sm font-semibold text-gray-800 mt-1">{activity.nama_kegiatan}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-500 uppercase">Program</p><p className="text-sm text-gray-800 mt-1">{activity.work_program?.nama_program || "-"}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-500 uppercase">Tanggal</p><p className="text-sm text-gray-800 mt-1">{formatDate(activity.tanggal_pelaksanaan)}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-500 uppercase">Pengeluaran</p><p className="text-sm font-semibold text-emerald-600 mt-1">{formatCurrency(activity.total_pengeluaran)}</p></div>
          </div>

          {activity.expense_descriptions?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" />Rincian</p>
              {activity.expense_descriptions.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-sm text-gray-700">{exp.description}</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {activity.photos?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-emerald-600" />Foto Kegiatan</p>
              <div className="grid grid-cols-4 gap-2">
                {activity.photos.map((p, idx) => <img key={idx} src={getImageUrl(p.file_path)} alt={`Photo ${idx}`} className="w-full h-24 object-cover rounded-lg" onError={(e) => e.target.src = "https://placehold.co/400?text=No+Image"} />)}
              </div>
            </div>
          )}

          {activity.attendances?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4 text-emerald-600" />File Absensi</p>
              {activity.attendances.map((att, idx) => (
                <a key={idx} href={getImageUrl(att.file_path)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 bg-white rounded-lg mb-1">
                  <Paperclip className="w-4 h-4" /> {att.file_name || `File ${idx + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">Tutup</button>
          <button onClick={() => { onClose(); onEdit(activity); }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;