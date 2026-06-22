import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { blockedIpService } from "../../services/blockedIp";
import MainLayout from "../../components/layout/MainLayout";
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  Filter,
  Plus,
  X,
  Save,
} from "lucide-react";

const BlockedIps = () => {
  const navigate = useNavigate();
  const { success, error, warning, confirm } = useModal();
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [formData, setFormData] = useState({
    ip_address: "",
    reason: "",
    minutes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const fetchIps = async (page = 1) => {
    setLoading(true);
    const params = {
      page,
      search: search || undefined,
      per_page: pagination.per_page,
    };

    const result = await blockedIpService.getAll(params);

    if (result.success) {
      setIps(result.data.data);
      setPagination({
        current_page: result.data.current_page,
        last_page: result.data.last_page,
        per_page: result.data.per_page,
        total: result.data.total,
      });
    } else {
      error("Gagal", result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIps();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchIps(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSearch = () => {
    fetchIps(1);
  };

  const handleReset = () => {
    setSearch("");
  };

  const handleViewDetail = async (ip) => {
    const result = await blockedIpService.getById(ip.id);
    if (result.success) {
      setSelectedIp(result.data);
      setShowDetail(true);
    } else {
      error("Gagal", result.message);
    }
  };

  const handleDelete = (ip) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus IP ${ip.ip_address} dari daftar blokir?`,
      async () => {
        const result = await blockedIpService.unblock(ip.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchIps(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const handleToggleActive = (ip) => {
    const action = ip.is_active ? "menonaktifkan" : "mengaktifkan";
    confirm(
      "Konfirmasi",
      `Apakah Anda yakin ingin ${action} blokir IP ${ip.ip_address}?`,
      async () => {
        const result = ip.is_active
          ? await blockedIpService.deactivate(ip.id)
          : await blockedIpService.activate(ip.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchIps(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const handleOpenModal = (ip = null) => {
    if (ip) {
      setModalMode("edit");
      setFormData({
        id: ip.id,
        ip_address: ip.ip_address,
        reason: ip.reason || "",
        minutes: "",
      });
    } else {
      setModalMode("create");
      setFormData({
        ip_address: "",
        reason: "",
        minutes: "",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!formData.ip_address) {
      errors.ip_address = "IP Address wajib diisi";
    } else if (!ipRegex.test(formData.ip_address)) {
      errors.ip_address = "Format IP Address tidak valid";
    }

    if (
      formData.minutes &&
      (formData.minutes < 1 || formData.minutes > 525600)
    ) {
      errors.minutes = "Durasi harus antara 1 menit - 1 tahun";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      ip_address: formData.ip_address,
      reason: formData.reason || null,
      minutes: formData.minutes ? parseInt(formData.minutes) : null,
    };

    let result;
    if (modalMode === "create") {
      result = await blockedIpService.block(data);
    } else {
      result = await blockedIpService.update(formData.id, data);
    }

    if (result.success) {
      success("Berhasil", result.message);
      setShowModal(false);
      fetchIps(pagination.current_page);
    } else {
      error("Gagal", result.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (isActive, blockedUntil) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Nonaktif
        </span>
      );
    }

    if (blockedUntil && new Date(blockedUntil) < new Date()) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Kadaluarsa
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Terblokir
      </span>
    );
  };

  const getRemainingTime = (blockedUntil) => {
    if (!blockedUntil) return "Permanen";
    const until = new Date(blockedUntil);
    const now = new Date();
    if (until < now) return "Kadaluarsa";

    const diff = until - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % 86400000) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % 3600000) / (1000 * 60));

    if (days > 0) return `${days} hari lagi`;
    if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
    return `${minutes} menit lagi`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-8 h-8 text-emerald-600" />
                Blocked IPs
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola daftar IP Address yang diblokir dari akses sistem
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Blokir IP Baru
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Cari berdasarkan IP Address..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cari
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Alasan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Berlaku Hingga</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sisa Waktu</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dibuat</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : ips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Tidak ada data IP terblokir
                        </td>
                      </tr>
                    ) : (
                      ips.map((ip, index) => (
                        <tr key={ip.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-mono text-sm font-medium text-gray-800">
                                {ip.ip_address}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                ID: #{ip.id}
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {ip.reason || "-"}
                            </p>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(ip.is_active, ip.blocked_until)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {ip.blocked_until ? formatDate(ip.blocked_until) : "Permanen"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {ip.is_active ? getRemainingTime(ip.blocked_until) : "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(ip.created_at)}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(ip)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(ip)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => fetchIps(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current_page >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchIps(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                              pagination.current_page === pageNum
                                ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                : "border border-gray-300 hover:bg-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => fetchIps(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit IP - Simplified */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 rounded-t-2xl">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === "create" ? "Blokir IP Baru" : "Edit IP Terblokir"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {modalMode === "create"
                      ? "Tambahkan IP ke daftar blokir"
                      : "Ubah informasi IP terblokir"}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) =>
                    setFormData({ ...formData, ip_address: e.target.value })
                  }
                  placeholder="Contoh: 192.168.1.1"
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.ip_address ? "border-red-500" : "border-gray-200"
                  }`}
                  disabled={modalMode === "edit"}
                />
                {formErrors.ip_address && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.ip_address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Alasan (Opsional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Masukkan alasan memblokir IP ini..."
                  rows="3"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Durasi Blokir (Menit)
                </label>
                <input
                  type="number"
                  value={formData.minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, minutes: e.target.value })
                  }
                  placeholder="Kosongkan untuk permanen"
                  min="1"
                  className={`w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.minutes ? "border-red-500" : "border-gray-200"
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  * Biarkan kosong untuk blokir permanen, atau masukkan durasi dalam menit
                </p>
                {formErrors.minutes && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.minutes}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {modalMode === "create" ? "Blokir IP" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail - Simplified */}
      {showDetail && selectedIp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Detail IP Terblokir</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Informasi lengkap IP yang diblokir</p>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-5">
              <div className={`rounded-xl p-4 ${selectedIp.is_active ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                    <p className={`text-lg font-bold ${selectedIp.is_active ? 'text-red-700' : 'text-gray-700'}`}>
                      {selectedIp.is_active ? "TERBLOKIR" : "NONAKTIF"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informasi IP</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">IP Address</p>
                    <code className="block mt-1 px-3 py-2 bg-white rounded-lg border border-gray-200 font-mono text-sm text-gray-800">
                      {selectedIp.ip_address}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alasan</p>
                    <p className="text-sm text-gray-800 mt-1">{selectedIp.reason || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informasi Waktu</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Berlaku Hingga</p>
                    <p className="text-sm text-gray-800 mt-1">
                      {selectedIp.blocked_until ? formatDate(selectedIp.blocked_until) : "Permanen"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sisa Waktu</p>
                    <p className="text-sm text-gray-800 mt-1">
                      {selectedIp.is_active ? getRemainingTime(selectedIp.blocked_until) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dibuat Pada</p>
                    <p className="text-sm text-gray-800 mt-1">{formatDate(selectedIp.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Terakhir Diupdate</p>
                    <p className="text-sm text-gray-800 mt-1">{formatDate(selectedIp.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetail(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowDetail(false);
                  handleDelete(selectedIp);
                }}
                className="px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus IP
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default BlockedIps;