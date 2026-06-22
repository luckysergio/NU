import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { userDeviceService } from "../../services/userDevice";
import MainLayout from "../../components/layout/MainLayout";
import {
  Smartphone,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";

const UserDevices = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  // Check if user is Super Admin
  const isSuperAdmin = currentUser?.role?.slug === "super-admin";

  const fetchDevices = async (page = 1) => {
    setLoading(true);
    const params = {
      page,
      search: search || undefined,
      per_page: pagination.per_page,
    };

    const result = await userDeviceService.getAll(params);

    if (result.success) {
      setDevices(result.data);
      setPagination({
        current_page: result.meta.current_page,
        last_page: result.meta.last_page,
        per_page: result.meta.per_page,
        total: result.meta.total,
      });
    } else {
      error("Gagal", result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchDevices(1);
  }, [search]);

  const handleSearch = () => {
    fetchDevices(1);
  };

  const handleReset = () => {
    setSearch("");
    fetchDevices(1);
  };

  const handleViewDetail = async (id) => {
    const result = await userDeviceService.getById(id);
    if (result.success) {
      setSelectedDevice(result.data);
      setShowDetail(true);
    } else {
      error("Gagal", result.message);
    }
  };

  const handleDelete = (device) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus perangkat dari user ${device.user?.name}?`,
      async () => {
        const result = await userDeviceService.delete(device.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchDevices(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const handleDeleteAllUserDevices = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteAllDevices = async () => {
    const result = await userDeviceService.deleteByUser(selectedUserId);
    if (result.success) {
      success("Berhasil", result.message);
      fetchDevices(pagination.current_page);
      setShowDeleteUserModal(false);
    } else {
      error("Gagal", result.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBrowserBadge = (browser) => {
    const browserLower = browser?.toLowerCase() || "";
    if (browserLower.includes("chrome")) return "bg-red-100 text-red-700";
    if (browserLower.includes("firefox")) return "bg-orange-100 text-orange-700";
    if (browserLower.includes("safari")) return "bg-blue-100 text-blue-700";
    if (browserLower.includes("edge")) return "bg-teal-100 text-teal-700";
    if (browserLower.includes("opera")) return "bg-pink-100 text-pink-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Smartphone className="w-8 h-8 text-emerald-600" />
                Manajemen Perangkat User
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola perangkat yang digunakan user untuk login
              </p>
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
                    placeholder="Cari berdasarkan device, browser, platform, atau IP address..."
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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Perangkat</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Browser</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Platform</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Login Terakhir</th>
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
                    ) : devices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Tidak ada data perangkat user
                        </td>
                      </tr>
                    ) : (
                      devices.map((device, index) => (
                        <tr key={device.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-800">
                                {device.user?.name || "-"}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {device.user?.email || "-"}
                              </div>
                              {device.user?.role && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Role: {device.user.role.nama}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {device.device || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBrowserBadge(device.browser)}`}>
                              {device.browser || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {device.platform || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {device.ip_address || "-"}
                            </code>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(device.last_login_at)}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(device.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(device)}
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
                      onClick={() => fetchDevices(pagination.current_page - 1)}
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
                            onClick={() => fetchDevices(pageNum)}
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
                      onClick={() => fetchDevices(pagination.current_page + 1)}
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

      {/* Modal Detail Perangkat - Simplified */}
      {showDetail && selectedDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Detail Perangkat</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Informasi lengkap perangkat user</p>
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
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Informasi User</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nama Lengkap</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{selectedDevice.user?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-700 mt-1 break-all">{selectedDevice.user?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedDevice.user?.role?.nama || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID Perangkat</p>
                    <p className="text-sm font-mono text-gray-700 mt-1">#{selectedDevice.id}</p>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Spesifikasi Perangkat</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Tipe Perangkat</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedDevice.device || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Browser</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedDevice.browser || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Platform / OS</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedDevice.platform || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alamat IP</p>
                    <code className="text-sm font-mono text-gray-800 mt-1 block">{selectedDevice.ip_address || "-"}</code>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Riwayat Aktivitas</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Login Terakhir</p>
                    <p className="text-sm text-gray-800 mt-1">{formatDate(selectedDevice.last_login_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Perangkat Terdaftar</p>
                    <p className="text-sm text-gray-800 mt-1">{formatDate(selectedDevice.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* User Agent */}
              {selectedDevice.user_agent && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Agent String</p>
                  <p className="text-xs font-mono text-gray-600 break-all bg-white p-2 rounded-lg border border-gray-100">
                    {selectedDevice.user_agent}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowDetail(false);
                  handleDelete(selectedDevice);
                }}
                className="px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Perangkat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Perangkat User */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="relative bg-linear-to-r from-red-600 to-red-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Konfirmasi Hapus</h2>
              <p className="text-red-100 text-sm mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Apakah Anda yakin ingin menghapus <strong>semua perangkat</strong> dari user{" "}
                <strong>{selectedUserName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                User akan perlu login ulang di semua perangkat setelah tindakan ini.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteAllDevices}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserDevices;