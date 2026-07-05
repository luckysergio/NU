import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useActivityLogs } from "../../hooks/useActivityLogs";
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
  Loader2,
} from "lucide-react";

const ActivityLogs = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  
  // State untuk filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  
  // State untuk UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // React Query dengan memoize filters
  const filters = useMemo(() => ({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    module: filterModule || undefined,
    action: filterAction || undefined,
    user_id: filterUser || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }), [page, perPage, debouncedSearch, filterModule, filterAction, filterUser, startDate, endDate]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    delete: deleteLog,
    isDeleting,
    modules,
    isLoadingModules,
    actions,
    isLoadingActions,
    users,
    isLoadingUsers,
  } = useActivityLogs(filters);

  // Data dari response
  const logs = response?.data || [];
  const pagination = response || { current_page: 1, last_page: 1, per_page: 10, total: 0 };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    if (!isFirstLoadRef.current) {
      setPage(1);
    }
    isFirstLoadRef.current = false;
  }, [debouncedSearch, filterModule, filterAction, filterUser, startDate, endDate]);

  const handleSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPage(1);
  }, [search]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setFilterModule("");
    setFilterAction("");
    setFilterUser("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }, []);

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const handleDelete = (log) => {
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus activity log ini?`,
      async () => {
        try {
          const result = await deleteLog(log.id);
          
          if (result?.success === false) {
            error("Gagal", result?.message || "Gagal menghapus activity log");
            return;
          }
          
          success("Berhasil", result?.message || "Activity log berhasil dihapus");
        } catch (err) {
          console.error('Delete error:', err);
          error("Gagal", err?.response?.data?.message || err.message || "Gagal menghapus activity log");
        }
      }
    );
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
      second: "2-digit",
    });
  };

  const getActionBadge = (action) => {
    const actionUpper = (action || '').toUpperCase();
    
    const variants = {
      'CREATE': 'bg-emerald-100 text-emerald-700',
      'UPDATE': 'bg-blue-100 text-blue-700',
      'DELETE': 'bg-red-100 text-red-700',
      'LOGIN': 'bg-purple-100 text-purple-700',
      'LOGOUT': 'bg-gray-100 text-gray-700',
      'VIEW': 'bg-indigo-100 text-indigo-700',
      'EXPORT': 'bg-orange-100 text-orange-700',
      'IMPORT': 'bg-yellow-100 text-yellow-700',
    };
    
    const colorClass = variants[actionUpper] || 'bg-gray-100 text-gray-700';
    
    return (
      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {actionUpper || "-"}
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

  const handlePageChange = (newPage) => {
    if (newPage === page) return;
    setPage(newPage);
  };

  if (isLoading || isLoadingModules || isLoadingActions || isLoadingUsers) {
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

  // Error state
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message || 'Silakan coba lagi'}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Coba Lagi
            </button>
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
                <History className="w-8 h-8 text-emerald-600" />
                Activity Log
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                <span>Monitor dan lihat riwayat aktivitas pengguna dalam sistem</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
              </button>
            </div>
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
                  onKeyPress={handleSearchKeyPress}
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

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      USER
                    </label>
                    <select
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Semua User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
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
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl pointer-events-none">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Memperbarui data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
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
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Tidak ada data activity log
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(page - 1) * perPage + index + 1}
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
                                disabled={isDeleting}
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
              {pagination.last_page > 1 && !isLoading && logs.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(page - 1) * perPage + 1} -{" "}
                    {Math.min(page * perPage, pagination.total)} dari {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                              page === pageNum
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
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pagination.last_page}
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

      {/* Modal Detail Activity Log */}
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
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
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