import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { activityLogService } from "../../services/activityLog";
import MainLayout from "../../components/layout/MainLayout";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  Filter,
  X,
} from "lucide-react";

const ActivityLogs = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    const params = {
      page,
      search: search || undefined,
      module: filterModule || undefined,
      action: filterAction || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      per_page: pagination.per_page,
    };

    const result = await activityLogService.getAll(params);

    if (result.success) {
      setLogs(result.data.data);
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

  const fetchModules = async () => {
    const result = await activityLogService.getModules();
    if (result.success) {
      setModules(result.data);
    }
  };

  const fetchActions = async () => {
    const result = await activityLogService.getActions();
    if (result.success) {
      setActions(result.data);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchActions();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [search, filterModule, filterAction, startDate, endDate]);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilterModule("");
    setFilterAction("");
    setStartDate("");
    setEndDate("");
  };

  const handleViewDetail = async (log) => {
    const result = await activityLogService.getById(log.id);
    if (result.success) {
      setSelectedLog(result.data);
      setShowDetail(true);
    } else {
      error("Gagal", result.message);
    }
  };

  const handleDelete = (log) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus activity log ini?`,
      async () => {
        const result = await activityLogService.delete(log.id);
        if (result.success) {
          success("Berhasil", result.message);
          fetchLogs(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      }
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadge = (action) => {
    const actionUpper = (action || '').toUpperCase();
    
    if (actionUpper === 'CREATE') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          CREATE
        </span>
      );
    }
    if (actionUpper === 'UPDATE') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          UPDATE
        </span>
      );
    }
    if (actionUpper === 'DELETE') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          DELETE
        </span>
      );
    }
    if (actionUpper === 'LOGIN') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          LOGIN
        </span>
      );
    }
    if (actionUpper === 'LOGOUT') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          LOGOUT
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {action || "-"}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodUpper = (method || '').toUpperCase();
    
    const variants = {
      'GET': 'bg-blue-100 text-blue-700',
      'POST': 'bg-emerald-100 text-emerald-700',
      'PUT': 'bg-amber-100 text-amber-700',
      'PATCH': 'bg-purple-100 text-purple-700',
      'DELETE': 'bg-red-100 text-red-700',
    };
    
    const colorClass = variants[methodUpper] || 'bg-gray-100 text-gray-700';
    
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-semibold ${colorClass}`}>
        {methodUpper || "-"}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <History className="w-8 h-8 text-emerald-600" />
                Activity Log
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor dan lihat riwayat aktivitas pengguna dalam sistem
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Cari berdasarkan modul, aksi, atau deskripsi..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-700">Filter Data</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      MODUL
                    </label>
                    <select
                      value={filterModule}
                      onChange={(e) => setFilterModule(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Modul</option>
                      {modules.map((module) => (
                        <option key={module} value={module}>
                          {module}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      AKSI
                    </label>
                    <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua Aksi</option>
                      {actions.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      TANGGAL MULAI
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      TANGGAL AKHIR
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Modul</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
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
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Tidak ada data activity log
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-800">
                                {log.user?.name || "System"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {log.user?.email || "-"}
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm font-medium text-gray-700">
                              {log.module || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getActionBadge(log.action)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <p className="text-sm text-gray-600 max-w-md truncate">
                              {log.description || "-"}
                            </p>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getMethodBadge(log.method)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(log.created_at)}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(log)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(log)}
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
                      onClick={() => fetchLogs(pagination.current_page - 1)}
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
                            onClick={() => fetchLogs(pageNum)}
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
                      onClick={() => fetchLogs(pagination.current_page + 1)}
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

      {/* Modal Detail Activity Log - Simplified */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Detail Activity Log</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Informasi lengkap aktivitas sistem</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Log</p>
                  <p className="text-sm font-mono text-gray-800 mt-1">#{selectedLog.id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</p>
                  <p className="text-sm text-gray-800 mt-1">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{selectedLog.user?.name || "System"}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user?.email || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</p>
                  <code className="text-sm font-mono text-gray-800 mt-1 block">{selectedLog.ip_address || "-"}</code>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modul</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{selectedLog.module || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</p>
                  <div className="mt-1">{getMethodBadge(selectedLog.method)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</p>
                  <p className="text-sm font-mono text-gray-700 mt-1 break-all">{selectedLog.url || "-"}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</p>
                <p className="text-sm text-gray-800 mt-2 leading-relaxed">{selectedLog.description || "-"}</p>
              </div>

              {selectedLog.model_type && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Model Type</p>
                  <p className="text-sm font-mono text-gray-800 mt-1">{selectedLog.model_type}</p>
                  {selectedLog.model_id && (
                    <p className="text-xs text-gray-500 mt-1">ID: {selectedLog.model_id}</p>
                  )}
                </div>
              )}

              {(selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0) || 
               (selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0) ? (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="bg-gray-700 px-4 py-2">
                    <p className="text-sm font-semibold text-white">Perubahan Data</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                      <div className="bg-red-50/30 p-4">
                        <p className="text-sm font-semibold text-red-700 mb-2">Nilai Lama</p>
                        <pre className="text-xs font-mono text-red-600 overflow-x-auto bg-white p-3 rounded-lg border border-red-200">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                      <div className="bg-green-50/30 p-4">
                        <p className="text-sm font-semibold text-green-700 mb-2">Nilai Baru</p>
                        <pre className="text-xs font-mono text-green-600 overflow-x-auto bg-white p-3 rounded-lg border border-green-200">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User Agent</p>
                <p className="text-xs text-gray-600 break-all font-mono mt-2">{selectedLog.user_agent || "-"}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowDetail(false);
                  handleDelete(selectedLog);
                }}
                className="px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Log
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ActivityLogs;