import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { usePermissions } from "../../hooks/usePermissions";
import { activityAttendanceService } from "../../services/activityAttendanceService";
import MainLayout from "../../components/layout/MainLayout";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  UserCheck,
  ArrowLeft,
  Save,
  Building2,
  Plus,
} from "lucide-react";

const Attendance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { success, error, warning } = useModal();
  const permissions = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [attendanceIds, setAttendanceIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [isDetailView, setIsDetailView] = useState(!!id);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });

  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [selectedOrgIds, setSelectedOrgIds] = useState([]);

  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  const user = permissions.user;
  const userRole = user?.role?.slug;
  const canManage = ["super-admin", "admin", "operator"].includes(userRole);

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "draft", label: "Draft" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
  ];

  const fetchActivities = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    const params = {
      page,
      per_page: pagination.per_page,
    };

    if (search.trim()) params.search = search.trim();
    if (filterStatus) params.status = filterStatus;

    const result = await activityAttendanceService.getAll(params);

    if (result.success) {
      const data = result.data;
      setActivities(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
      });
    } else {
      if (result.message) {
        error("Gagal", result.message);
      }
    }

    setLoading(false);
    isFetchingRef.current = false;
  }, [pagination.per_page, search, filterStatus, error]);

  const fetchAttendanceDetail = useCallback(async (activityId) => {
    setLoading(true);
    const result = await activityAttendanceService.getAttendance(activityId);

    if (result.success) {
      const data = result.data;
      
      setSelectedActivity({
        id: data.activity?.id || data.activity_id,
        nama_kegiatan: data.activity?.nama_kegiatan || data.activity_name,
        tanggal_pelaksanaan: data.activity?.tanggal_pelaksanaan || data.activity_date,
        tempat: data.activity?.tempat,
        status: data.activity?.status,
      });
      
      const orgs = data.organizations || [];
      setOrganizations(orgs);
      setSelectedOrganizations(orgs);
      
      const ids = data.attendance_ids || [];
      setAttendanceIds(ids);
      
      const total = data.total_participants || 0;
      const present = data.attended_count || 0;
      
      setAttendanceStats({
        total: total,
        present: present,
        absent: total - present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      });
      
      await fetchAvailableOrganizations(activityId);
      
    } else {
      error("Gagal", result.message || "Gagal mengambil detail absensi");
      navigate("/attendance");
    }

    setLoading(false);
  }, [error, navigate]);

  const fetchAvailableOrganizations = useCallback(async (activityId) => {
    if (!activityId) return;
    
    try {
      const result = await activityAttendanceService.getAvailableOrganizations(activityId);
      if (result.success) {
        setAvailableOrganizations(result.data.available_organizations || []);
        setSelectedOrganizations(result.data.selected_organizations || []);
        setSelectedOrgIds([]);
      }
    } catch (err) {
      console.error('Error fetching available organizations:', err);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchActivities(1);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search, fetchActivities]);

  useEffect(() => {
    if (id) {
      fetchAttendanceDetail(parseInt(id));
    } else {
      fetchActivities(1);
    }
  }, [id, fetchAttendanceDetail, fetchActivities]);

  const handleToggleAttendance = (anggotaId) => {
    if (!canManage) return;

    setAttendanceIds((prev) => {
      const newIds = prev.includes(anggotaId)
        ? prev.filter((id) => id !== anggotaId)
        : [...prev, anggotaId];
      
      const total = attendanceStats.total;
      const present = newIds.length;
      
      setAttendanceStats({
        total: total,
        present: present,
        absent: total - present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      });
      
      return newIds;
    });
  };

  const handleSelectAllOrganization = (orgId) => {
    if (!canManage) return;

    const organization = organizations.find((org) => org.id === orgId);
    if (!organization) return;

    const anggotaIds = (organization.anggotas || []).map((a) => a.id);
    if (anggotaIds.length === 0) return;

    const allSelected = anggotaIds.every((id) => attendanceIds.includes(id));

    let newIds;
    if (allSelected) {
      newIds = attendanceIds.filter((id) => !anggotaIds.includes(id));
    } else {
      newIds = [...attendanceIds];
      anggotaIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
    }

    const total = attendanceStats.total;
    const present = newIds.length;
    
    setAttendanceIds(newIds);
    setAttendanceStats({
      total: total,
      present: present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  };

  const handleSelectAll = () => {
    if (!canManage) return;

    const allAnggotaIds = [];
    organizations.forEach(org => {
      (org.anggotas || []).forEach(anggota => {
        allAnggotaIds.push(anggota.id);
      });
    });

    if (allAnggotaIds.length === 0) return;

    const allSelected = allAnggotaIds.every((id) => attendanceIds.includes(id));
    const newIds = allSelected ? [] : [...allAnggotaIds];

    const total = attendanceStats.total;
    const present = newIds.length;
    
    setAttendanceIds(newIds);
    setAttendanceStats({
      total: total,
      present: present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedActivity || !canManage) {
      if (!canManage) {
        warning("Info", "Anda tidak memiliki izin untuk menyimpan absensi");
      }
      return;
    }

    setSaving(true);
    const result = await activityAttendanceService.saveAttendance(
      selectedActivity.id,
      attendanceIds
    );

    if (result.success) {
      success("Berhasil", "Absensi berhasil disimpan");
      await fetchAttendanceDetail(selectedActivity.id);
    } else {
      error("Gagal", result.message || "Gagal menyimpan absensi");
    }

    setSaving(false);
  };

  const handleToggleOrgSelect = (orgId) => {
    setSelectedOrgIds(prev => {
      if (prev.includes(orgId)) {
        return prev.filter(id => id !== orgId);
      } else {
        return [...prev, orgId];
      }
    });
  };

  const handleSelectAllOrgs = () => {
    const allOrgIds = availableOrganizations.map(org => org.id);
    if (selectedOrgIds.length === allOrgIds.length && allOrgIds.length > 0) {
      setSelectedOrgIds([]);
    } else {
      setSelectedOrgIds(allOrgIds);
    }
  };

  const handleAddSelectedOrganizations = async () => {
    if (!selectedActivity || !canManage || selectedOrgIds.length === 0) {
      if (selectedOrgIds.length === 0) {
        warning("Info", "Pilih minimal satu organisasi");
      }
      return;
    }

    setOrgLoading(true);
    const result = await activityAttendanceService.addParticipants(
      selectedActivity.id,
      selectedOrgIds
    );

    if (result.success) {
      success("Berhasil", `${selectedOrgIds.length} organisasi berhasil ditambahkan`);
      await fetchAttendanceDetail(selectedActivity.id);
      setShowOrgModal(false);
      setSelectedOrgIds([]);
    } else {
      error("Gagal", result.message || "Gagal menambahkan organisasi");
    }
    setOrgLoading(false);
  };

  const handleRemoveOrganization = async (orgId) => {
    if (!selectedActivity || !canManage) return;

    warning(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus organisasi ini dari peserta kegiatan?",
      async () => {
        const result = await activityAttendanceService.removeParticipants(
          selectedActivity.id,
          [orgId]
        );

        if (result.success) {
          success("Berhasil", "Organisasi berhasil dihapus");
          await fetchAttendanceDetail(selectedActivity.id);
        } else {
          error("Gagal", result.message || "Gagal menghapus organisasi");
        }
      }
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
      completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
    };

    const s = statusMap[status] || { label: status || "-", color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const handleBack = () => {
    setIsDetailView(false);
    navigate("/attendance");
    fetchActivities(1);
  };

  const renderListView = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <Calendar className="w-8 h-8 text-emerald-600" />
              Absensi Kegiatan
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola absensi kegiatan organisasi Nahdatul Ulama
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kegiatan berdasarkan nama..."
                  className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => { setSearch(""); setFilterStatus(""); fetchActivities(1); }}
                className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

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
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Kegiatan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={4} className="text-center px-4 py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-10 h-10 text-gray-300" />
                          <p>Tidak ada data kegiatan</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity, index) => {
                      return (
                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-4 py-3 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="font-semibold text-gray-800">{activity.nama_kegiatan}</div>
                            <div className="text-xs text-gray-400">
                              {activity.tanggal_pelaksanaan ? new Date(activity.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              {activity.tempat && ` • ${activity.tempat}`}
                            </div>
                          </td>
                          <td className="text-center px-4 py-3">
                            {getStatusBadge(activity.status)}
                          </td>
                          <td className="text-center px-4 py-3">
                            <button
                              onClick={() => {
                                setIsDetailView(true);
                                navigate(`/attendance/${activity.id}`);
                                fetchAttendanceDetail(activity.id);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Kelola Absensi"
                            >
                              <UserCheck className="w-4 h-4" />
                              Kelola
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.last_page > 1 && !loading && activities.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-500 order-2 sm:order-1">
                  Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                </div>
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => fetchActivities(pagination.current_page - 1)}
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
                          onClick={() => fetchActivities(pageNum)}
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
                    onClick={() => fetchActivities(pagination.current_page + 1)}
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
    );
  };

  const renderDetailView = () => {
    if (!selectedActivity) return null;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-emerald-600" />
              Absensi Kegiatan
            </h1>
            <div className="mt-2">
              <h2 className="text-xl font-semibold text-gray-800">{selectedActivity.nama_kegiatan}</h2>
              <p className="text-sm text-gray-500">
                {selectedActivity.tanggal_pelaksanaan ? new Date(selectedActivity.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                {selectedActivity.tempat && ` • ${selectedActivity.tempat}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <>
                <button
                  onClick={() => setShowOrgModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Peserta
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Absensi
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{attendanceStats.total}</p>
                <p className="text-xs text-gray-500">Total Peserta</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{attendanceStats.present}</p>
                <p className="text-xs text-gray-500">Hadir</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                <p className="text-xs text-gray-500">Tidak Hadir</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{attendanceStats.percentage}%</p>
                <p className="text-xs text-gray-500">Persentase</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Organisasi Peserta</h3>
            <p className="text-xs text-gray-500">
              {selectedOrganizations.length} organisasi terdaftar
            </p>
          </div>
          <div className="p-4">
            {selectedOrganizations.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Belum ada organisasi peserta. Klik "Tambah Peserta" untuk menambahkan.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedOrganizations.map((org) => (
                  <div
                    key={org.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                  >
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span>{org.nama}</span>
                    {canManage && (
                      <button
                        onClick={() => handleRemoveOrganization(org.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Hapus"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  {canManage && (
                    <button
                      onClick={handleSelectAll}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                    >
                      {attendanceStats.present === attendanceStats.total && attendanceStats.total > 0 ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Batal Pilih Semua
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Pilih Semua
                        </>
                      )}
                    </button>
                  )}
                  <span className="text-sm text-gray-500">
                    {attendanceStats.present} orang hadir dari {attendanceStats.total} peserta
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-xs text-gray-500">Hadir</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-200"></div>
                    <span className="text-xs text-gray-500">Belum Hadir</span>
                  </div>
                  {!canManage && (
                    <span className="text-xs text-amber-600">
                      ⚠️ Anda hanya dapat melihat absensi
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {organizations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Tidak ada peserta yang terdaftar untuk kegiatan ini
                  </div>
                ) : (
                  organizations.map((org) => {
                    const anggotaList = org.anggotas || [];
                    const orgAnggotaIds = anggotaList.map((a) => a.id);
                    const orgAttendedCount = orgAnggotaIds.filter((id) => attendanceIds.includes(id)).length;
                    const isOrgAllSelected = orgAnggotaIds.length > 0 && orgAnggotaIds.every((id) => attendanceIds.includes(id));

                    return (
                      <div key={org.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {canManage && (
                              <button
                                onClick={() => handleSelectAllOrganization(org.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                  isOrgAllSelected
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : orgAttendedCount > 0
                                      ? 'bg-yellow-500 border-yellow-500'
                                      : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isOrgAllSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                {!isOrgAllSelected && orgAttendedCount > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-white"></span>
                                )}
                              </button>
                            )}
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-800">{org.nama}</span>
                              <span className="text-xs text-gray-400">
                                ({orgAttendedCount}/{orgAnggotaIds.length})
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {org.level?.display_name || org.level?.nama || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {anggotaList.map((anggota) => {
                            const isPresent = attendanceIds.includes(anggota.id);
                            return (
                              <button
                                key={anggota.id}
                                onClick={() => handleToggleAttendance(anggota.id)}
                                disabled={!canManage}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                                  isPresent
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  isPresent
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {isPresent && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`text-sm ${isPresent ? 'text-gray-800' : 'text-gray-600'}`}>
                                    {anggota.nama}
                                  </div>
                                  {anggota.jabatan?.nama && (
                                    <div className="text-xs text-gray-400">
                                      {anggota.jabatan.nama}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOrgModal = () => {
    if (!showOrgModal) return null;

    const allSelected = selectedOrgIds.length === availableOrganizations.length && availableOrganizations.length > 0;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden">
          <div className="relative bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="relative flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Tambah Organisasi Peserta</h2>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllOrgs}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {availableOrganizations.length} organisasi tersedia
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {selectedOrgIds.length} dipilih
              </span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {availableOrganizations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Tidak ada organisasi yang tersedia untuk ditambahkan.
              </p>
            ) : (
              <div className="space-y-2">
                {availableOrganizations.map((org) => {
                  const isSelected = selectedOrgIds.includes(org.id);
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleToggleOrgSelect(org.id)}
                      className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <Building2 className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="flex-1 text-left">
                        <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {org.nama}
                        </span>
                        {org.level?.display_name && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({org.level.display_name})
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
            <button
              onClick={() => setShowOrgModal(false)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleAddSelectedOrganizations}
              disabled={orgLoading || selectedOrgIds.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {orgLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Tambah {selectedOrgIds.length > 0 ? `(${selectedOrgIds.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {isDetailView ? (
            <>
              {renderDetailView()}
              {renderOrgModal()}
            </>
          ) : (
            renderListView()
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Attendance;