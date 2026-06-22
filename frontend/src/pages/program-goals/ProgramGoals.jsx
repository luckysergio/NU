import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Flag,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import { useModal } from "../../contexts/ModalContext";
import programGoalService from "../../services/programGoalService";

const ProgramGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGoals, setTotalGoals] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  const { success, error, warning } = useModal();

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
      };
      
      const result = await programGoalService.getProgramGoals(params);

      if (result.success) {
        setGoals(result.data.data || []);
        setTotalPages(result.data.last_page || 1);
        setTotalGoals(result.data.total || 0);
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat mengambil data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, error]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      is_active: true,
    });
    setFormErrors({});
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedGoal(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setModalMode("edit");
    setSelectedGoal(goal);
    setFormData({
      nama: goal.nama,
      is_active: goal.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (goal) => {
    setModalMode("view");
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (goal) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus tujuan program "${goal.nama}"?`,
      async () => {
        setDeletingId(goal.id);
        try {
          const result = await programGoalService.deleteProgramGoal(goal.id);
          if (result.success) {
            success("Berhasil", result.message);
            fetchGoals();
          } else {
            error("Gagal", result.message);
          }
        } catch (err) {
          error("Gagal", "Terjadi kesalahan saat menghapus data");
        } finally {
          setDeletingId(null);
        }
      },
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama tujuan program wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let result;
      if (modalMode === "create") {
        result = await programGoalService.createProgramGoal(formData);
      } else {
        result = await programGoalService.updateProgramGoal(
          selectedGoal.id,
          formData,
        );
      }

      if (result.success) {
        success("Berhasil", result.message);
        setIsModalOpen(false);
        fetchGoals();
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      error("Gagal", "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="w-3 h-3" />
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3" />
        Tidak Aktif
      </span>
    );
  };

  const hasActiveFilters = searchTerm;

  if (loading && goals.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Flag className="w-8 h-8 text-emerald-600" />
                Tujuan Program
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola tujuan program untuk program kerja PC (Pimpinan Cabang)
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Tambah Tujuan
            </button>
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-700">Filter Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Cari tujuan program berdasarkan nama..."
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  />
                </div>

                {/* Items per page */}
                <div>
                  <select
                    value={perPage}
                    onChange={handlePerPageChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </select>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <div>
                    <button
                      onClick={handleResetFilters}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Filter
                    </button>
                  </div>
                )}

                {/* Total count */}
                <div className="flex items-center justify-end">
                  <span className="text-sm text-gray-500">
                    {totalGoals} tujuan ditemukan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Tujuan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {goals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Flag className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data tujuan program</p>
                            <button
                              onClick={handleOpenCreateModal}
                              className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Tambah Tujuan Baru
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      goals.map((goal, index) => (
                        <tr key={goal.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(currentPage - 1) * perPage + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <span className="font-semibold text-gray-800">
                                {goal.nama}
                              </span>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(goal.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenViewModal(goal)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(goal)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Edit"
                                disabled={deletingId === goal.id}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Hapus"
                                disabled={deletingId === goal.id}
                              >
                                {deletingId === goal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Menampilkan {(currentPage - 1) * perPage + 1} -{" "}
                {Math.min(currentPage * perPage, totalGoals)} dari{" "}
                {totalGoals} data
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-md"
                            : "border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === "create" && "Tambah Tujuan Program"}
                    {modalMode === "edit" && "Edit Tujuan Program"}
                    {modalMode === "view" && "Detail Tujuan Program"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {modalMode === "create" && "Isi form berikut untuk menambahkan tujuan program baru"}
                    {modalMode === "edit" && "Ubah data tujuan program"}
                    {modalMode === "view" && "Informasi lengkap tujuan program"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalMode === "view" ? (
                <div className="p-6">
                  {/* Header Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedGoal?.nama}
                    </h3>
                  </div>

                  {/* Information Grid */}
                  <div className="space-y-4">
                    {/* Status Section */}
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
                      <div className="flex justify-center">
                        {getStatusBadge(selectedGoal?.is_active)}
                      </div>
                    </div>

                    {/* Created At Info */}
                    {selectedGoal?.created_at && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat pada</p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(selectedGoal.created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                          {selectedGoal?.updated_at && selectedGoal.updated_at !== selectedGoal.created_at && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Terakhir diupdate</p>
                              <p className="text-xs text-gray-600">
                                {new Date(selectedGoal.updated_at).toLocaleDateString('id-ID')}
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
                  {/* Nama Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nama Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        formErrors.nama ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Masukkan nama tujuan program"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {formErrors.nama && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-3 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Aktif</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Jika tidak aktif, tujuan ini tidak akan muncul di pilihan program kerja
                    </p>
                  </div>

                  {/* Informasi */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-blue-700">
                        <p className="font-semibold mb-1">Informasi:</p>
                        <ul className="space-y-1">
                          <li>• Tujuan program digunakan untuk menentukan target akhir dari program kerja</li>
                          <li>• Hanya tujuan yang aktif yang bisa dipilih untuk program kerja</li>
                          <li>• Tujuan yang sudah memiliki program kerja tidak dapat dihapus</li>
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
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                {modalMode === "view" ? "Tutup" : "Batal"}
              </button>
              {modalMode !== "view" && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : modalMode === "create" ? (
                    "Simpan"
                  ) : (
                    "Update"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProgramGoals;