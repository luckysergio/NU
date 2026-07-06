import React, { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import { activityService } from "../../services/activityService";

const ActivityEditModal = ({ isOpen, onClose, activity, onSuccess, modalActions }) => {
  const { success, error } = modalActions;

  const [editFormData, setEditFormData] = useState({ nama_kegiatan: "", tanggal_pelaksanaan: "", total_pengeluaran: "", catatan: "", deskripsi: "", expense_descriptions: [] });
  const [editPhotos, setEditPhotos] = useState([]);
  const [editExpensePhotos, setEditExpensePhotos] = useState([]);
  const [editAttendanceFiles, setEditAttendanceFiles] = useState([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState([]);
  const [editExpensePhotoPreviews, setEditExpensePhotoPreviews] = useState([]);
  const [editAttendanceFileNames, setEditAttendanceFileNames] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      setEditFormData({
        nama_kegiatan: activity.nama_kegiatan || "", tanggal_pelaksanaan: activity.tanggal_pelaksanaan || "",
        total_pengeluaran: activity.total_pengeluaran || "", catatan: activity.catatan || "",
        deskripsi: activity.deskripsi || "", expense_descriptions: activity.expense_descriptions || [],
      });
      setEditPhotos([]); setEditExpensePhotos([]); setEditAttendanceFiles([]);
      setEditPhotoPreviews([]); setEditExpensePhotoPreviews([]); setEditAttendanceFileNames([]);
    }
  }, [isOpen, activity]);

  const formatRupiah = (val) => val ? new Intl.NumberFormat("id-ID").format(parseInt(val.toString().replace(/\D/g, ""))) : "";
  const handleRupiahChange = (e, setter) => setter(e.target.value.replace(/\D/g, ""));

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "photos") { setEditPhotos(p => [...p, ...files]); setEditPhotoPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]); }
    else if (type === "expense_photos") { setEditExpensePhotos(p => [...p, ...files]); setEditExpensePhotoPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]); }
    else if (type === "attendance_files") { setEditAttendanceFiles(p => [...p, ...files]); setEditAttendanceFileNames(p => [...p, ...files.map(f => f.name)]); }
  };

  const handleRemoveFile = (index, type) => {
    if (type === "photos") { URL.revokeObjectURL(editPhotoPreviews[index]); setEditPhotos(p => p.filter((_, i) => i !== index)); setEditPhotoPreviews(p => p.filter((_, i) => i !== index)); }
    else if (type === "expense_photos") { URL.revokeObjectURL(editExpensePhotoPreviews[index]); setEditExpensePhotos(p => p.filter((_, i) => i !== index)); setEditExpensePhotoPreviews(p => p.filter((_, i) => i !== index)); }
    else if (type === "attendance_files") { setEditAttendanceFiles(p => p.filter((_, i) => i !== index)); setEditAttendanceFileNames(p => p.filter((_, i) => i !== index)); }
  };

  const addExpense = () => setEditFormData(p => ({ ...p, expense_descriptions: [...p.expense_descriptions, { description: "", amount: 0 }] }));
  const updateExpense = (idx, field, val) => {
    const upd = [...editFormData.expense_descriptions];
    upd[idx][field] = field === "amount" ? parseInt(val) || 0 : val;
    setEditFormData(p => ({ ...p, expense_descriptions: upd }));
  };
  const removeExpense = (idx) => setEditFormData(p => ({ ...p, expense_descriptions: p.expense_descriptions.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    setEditSubmitting(true);
    const fd = new FormData();
    fd.append("nama_kegiatan", editFormData.nama_kegiatan);
    fd.append("tanggal_pelaksanaan", editFormData.tanggal_pelaksanaan);
    fd.append("total_pengeluaran", editFormData.total_pengeluaran);
    if (editFormData.catatan) fd.append("catatan", editFormData.catatan);
    if (editFormData.deskripsi) fd.append("deskripsi", editFormData.deskripsi);
    fd.append("expense_descriptions", JSON.stringify(editFormData.expense_descriptions));
    editPhotos.forEach(f => fd.append("photos[]", f));
    editExpensePhotos.forEach(f => fd.append("expense_photos[]", f));
    editAttendanceFiles.forEach(f => fd.append("attendance_files[]", f));

    try {
      const result = await activityService.update(activity.id, fd);
      if (result.success) { success("Berhasil", "Kegiatan diperbarui"); onSuccess(); onClose(); }
      else error("Gagal", result.message);
    } catch (err) { error("Gagal", "Terjadi kesalahan"); }
    finally { setEditSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-white">Edit Kegiatan</h2><p className="text-emerald-100 text-sm mt-0.5">Perbarui data kegiatan</p></div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Kegiatan *</label><input type="text" value={editFormData.nama_kegiatan} onChange={(e) => setEditFormData(p => ({ ...p, nama_kegiatan: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal *</label><input type="date" value={editFormData.tanggal_pelaksanaan} onChange={(e) => setEditFormData(p => ({ ...p, tanggal_pelaksanaan: e.target.value }))} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Pengeluaran</label>
            <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={editFormData.total_pengeluaran ? formatRupiah(editFormData.total_pengeluaran) : ""} onChange={(e) => handleRupiahChange(e, v => setEditFormData(p => ({ ...p, total_pengeluaran: v })))} className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2"><label className="block text-sm font-semibold text-gray-700">Rincian Pengeluaran</label><button type="button" onClick={addExpense} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Tambah</button></div>
            {editFormData.expense_descriptions.map((exp, idx) => (
              <div key={idx} className="flex gap-3 mb-2 items-start">
                <input type="text" placeholder="Deskripsi" value={exp.description} onChange={(e) => updateExpense(idx, "description", e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <div className="relative w-40"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Jumlah" value={exp.amount ? formatRupiah(exp.amount) : ""} onChange={(e) => updateExpense(idx, "amount", e.target.value.replace(/\D/g, ""))} className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <button type="button" onClick={() => removeExpense(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label><textarea value={editFormData.catatan} onChange={(e) => setEditFormData(p => ({ ...p, catatan: e.target.value }))} rows="3" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" /></div>

          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Foto Kegiatan Baru</label><input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, "photos")} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl" />
            {editPhotoPreviews.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{editPhotoPreviews.map((prev, idx) => (<div key={idx} className="relative"><img src={prev} alt={`Prev ${idx}`} className="w-20 h-20 object-cover rounded-lg" /><button type="button" onClick={() => handleRemoveFile(idx, "photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>))}</div>}
          </div>

          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Bukti Pengeluaran Baru</label><input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, "expense_photos")} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl" />
            {editExpensePhotoPreviews.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{editExpensePhotoPreviews.map((prev, idx) => (<div key={idx} className="relative"><img src={prev} alt={`Prev ${idx}`} className="w-20 h-20 object-cover rounded-lg" /><button type="button" onClick={() => handleRemoveFile(idx, "expense_photos")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button></div>))}</div>}
          </div>

          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">File Absensi Baru</label><input type="file" accept=".pdf,image/*" multiple onChange={(e) => handleFileChange(e, "attendance_files")} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl" />
            {editAttendanceFileNames.length > 0 && <div className="mt-3 space-y-1">{editAttendanceFileNames.map((name, idx) => (<div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"><span className="text-sm text-gray-600">{name}</span><button type="button" onClick={() => handleRemoveFile(idx, "attendance_files")} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button></div>))}</div>}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">Batal</button>
          <button onClick={handleSubmit} disabled={editSubmitting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
            {editSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityEditModal;