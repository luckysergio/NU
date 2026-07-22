import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { usePermissions } from "../../hooks/usePermissions";
import { activityAttendanceService } from "../../services/activityAttendanceService";
import { QUERY_KEYS } from "../../hooks/useActivityAttendance";
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
  AlertCircle,
  Info,
} from "lucide-react";

const Attendance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { success, error, warning } = useModal();
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [attendanceIds, setAttendanceIds] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedOrgIds, setSelectedOrgIds] = useState([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const searchTimeoutRef = useRef(null);

  const user = permissions.user;
  const userRole = user?.role?.slug;
  const userOrgLevel = user?.organization?.level?.slug || user?.organization?.level;
  
  const canManage = ["super-admin", "admin", "operator"].includes(userRole);
  const isAdminRanting = userRole === "admin" && userOrgLevel === "ranting";
  const isDetailView = !!id;

  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
      status: filterStatus || undefined,
    }),
    [page, perPage, debouncedSearch, filterStatus]
  );

  const {
    data: activitiesResponse,
    isLoading: isLoadingActivities,
    isFetching: isFetchingActivities,
    isError: isErrorActivities,
    error: errorActivities,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: QUERY_KEYS.activities(filters),
    queryFn: async () => {
      const result = await activityAttendanceService.getAll(filters);
      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data kegiatan");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: !isDetailView,
  });

  const activities = activitiesResponse?.data || [];
  const pagination = activitiesResponse || {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };

  const {
    data: attendanceDetail,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    isError: isErrorDetail,
    error: errorDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: QUERY_KEYS.attendanceDetail(id),
    queryFn: async () => {
      const result = await activityAttendanceService.getAttendance(parseInt(id));
      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil detail absensi");
      }
      return result.data;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    enabled: isDetailView && !!id,
  });

  const {
    data: allOrganizationsData,
    isLoading: isLoadingAllOrganizations,
    refetch: fetchAllOrganizations,
  } = useQuery({
    queryKey: QUERY_KEYS.allOrganizations(),
    queryFn: async () => {
      const result = await activityAttendanceService.getAllOrganizations();
      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data organisasi");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    enabled: isAdminRanting && isDetailView && showOrgModal,
  });

  const {
    data: availableOrgsData,
    isLoading: isLoadingAvailableOrgs,
    refetch: refetchAvailableOrgs,
  } = useQuery({
    queryKey: QUERY_KEYS.availableOrganizations(id),
    queryFn: async () => {
      const result = await activityAttendanceService.getAvailableOrganizations(parseInt(id));
      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data organisasi");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled: !isAdminRanting && isDetailView && !!id && showOrgModal,
  });

  const availableOrganizations = useMemo(() => {
    if (isAdminRanting) {
      const allOrgs = allOrganizationsData?.all_organizations || [];
      const selectedOrgIds = attendanceDetail?.organizations?.map(org => org.id) || [];
      return allOrgs.filter(org => !selectedOrgIds.includes(org.id));
    } else {
      return availableOrgsData?.available_organizations || [];
    }
  }, [isAdminRanting, allOrganizationsData, availableOrgsData, attendanceDetail]);

  const selectedOrganizations = attendanceDetail?.organizations || [];

  const filteredAvailableOrganizations = useMemo(() => {
    if (!orgSearch.trim()) return availableOrganizations;
    
    const searchLower = orgSearch.toLowerCase();
    return availableOrganizations.filter(org => 
      org.nama?.toLowerCase().includes(searchLower) ||
      org.level?.nama?.toLowerCase().includes(searchLower)
    );
  }, [availableOrganizations, orgSearch]);

  const saveAttendanceMutation = useMutation({
    mutationFn: ({ activityId, anggotaIds }) =>
      activityAttendanceService.saveAttendance(activityId, anggotaIds),
    
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.attendanceDetail(variables.activityId) });
      const previousData = queryClient.getQueryData(QUERY_KEYS.attendanceDetail(variables.activityId));

      queryClient.setQueryData(QUERY_KEYS.attendanceDetail(variables.activityId), (old) => {
        if (!old) return old;
        return {
          ...old,
          attendance_ids: variables.anggotaIds,
          attended_count: variables.anggotaIds.length,
          attendance_percentage: old.total_participants > 0 
            ? Math.round((variables.anggotaIds.length / old.total_participants) * 100) 
            : 0,
        };
      });

      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.attendanceDetail(variables.activityId), context.previousData);
      }
      error("Gagal", err?.response?.data?.message || err?.message || "Gagal menyimpan absensi");
    },
    
    onSettled: async (data, err, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendanceDetail(variables.activityId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities(filters) });
      await refetchDetail();
      
      if (!err) success("Berhasil", "Absensi berhasil disimpan");
    },
  });

  const addParticipantsMutation = useMutation({
    mutationFn: ({ activityId, organizationIds }) =>
      activityAttendanceService.addParticipants(activityId, organizationIds),
    
    onSettled: async (data, err, variables) => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendanceDetail(variables.activityId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.availableOrganizations(variables.activityId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allOrganizations() });

      await refetchDetail();
      await refetchAvailableOrgs();
      if (isAdminRanting) await fetchAllOrganizations();

      setIsRefreshing(false);
      
      if (!err) {
        success("Berhasil", `${variables.organizationIds.length} organisasi berhasil ditambahkan`);
        setShowOrgModal(false);
        setSelectedOrgIds([]);
        setOrgSearch("");
      } else {
        error("Gagal", err?.response?.data?.message || err?.message || "Gagal menambahkan organisasi");
      }
    },
  });

  const removeParticipantsMutation = useMutation({
    mutationFn: ({ activityId, organizationIds }) =>
      activityAttendanceService.removeParticipants(activityId, organizationIds),
    
    onSettled: async (data, err, variables) => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendanceDetail(variables.activityId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.availableOrganizations(variables.activityId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allOrganizations() });

      await refetchDetail();
      await refetchAvailableOrgs();
      if (isAdminRanting) await fetchAllOrganizations();

      setIsRefreshing(false);
      
      if (!err) success("Berhasil", "Organisasi berhasil dihapus");
      else error("Gagal", err?.response?.data?.message || err?.message || "Gagal menghapus organisasi");
    },
  });

  useEffect(() => {
    if (attendanceDetail?.attendance_ids) {
      setAttendanceIds(attendanceDetail.attendance_ids);
    }
  }, [attendanceDetail]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  const handleSearch = (e) => setSearch(e.target.value);
  const handleFilterStatus = (e) => { setFilterStatus(e.target.value); setPage(1); };
  const handleReset = () => { setSearch(""); setDebouncedSearch(""); setFilterStatus(""); setPage(1); };
  const handlePageChange = (newPage) => { if (newPage === page) return; setPage(newPage); };

  const handleToggleAttendance = (anggotaId) => {
    if (!canManage) return;
    setAttendanceIds((prev) => prev.includes(anggotaId) ? prev.filter((id) => id !== anggotaId) : [...prev, anggotaId]);
  };

  const handleSelectAllOrganization = (orgId) => {
    if (!canManage) return;
    const organization = selectedOrganizations.find((org) => org.id === orgId);
    if (!organization) return;
    const anggotaIds = (organization.anggotas || []).map((a) => a.id);
    if (anggotaIds.length === 0) return;
    const allSelected = anggotaIds.every((id) => attendanceIds.includes(id));

    setAttendanceIds((prev) => {
      if (allSelected) return prev.filter((id) => !anggotaIds.includes(id));
      const newIds = [...prev];
      anggotaIds.forEach((id) => { if (!newIds.includes(id)) newIds.push(id); });
      return newIds;
    });
  };

  const handleSelectAll = () => {
    if (!canManage) return;
    const allAnggotaIds = [];
    selectedOrganizations.forEach((org) => {
      (org.anggotas || []).forEach((anggota) => allAnggotaIds.push(anggota.id));
    });
    if (allAnggotaIds.length === 0) return;
    const allSelected = allAnggotaIds.every((id) => attendanceIds.includes(id));
    setAttendanceIds(allSelected ? [] : allAnggotaIds);
  };

  const handleSaveAttendance = () => {
    if (!attendanceDetail?.activity?.id || !canManage) {
      if (!canManage) warning("Info", "Anda tidak memiliki izin untuk menyimpan absensi");
      return;
    }
    saveAttendanceMutation.mutate({ activityId: attendanceDetail.activity.id, anggotaIds: attendanceIds });
  };

  const handleToggleOrgSelect = (orgId) => {
    setSelectedOrgIds((prev) => prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]);
  };

  const handleSelectAllOrgs = () => {
    const allOrgIds = filteredAvailableOrganizations.map((org) => org.id);
    setSelectedOrgIds(selectedOrgIds.length === allOrgIds.length && allOrgIds.length > 0 ? [] : allOrgIds);
  };

  const handleAddSelectedOrganizations = () => {
    if (!attendanceDetail?.activity?.id || !canManage || selectedOrgIds.length === 0) {
      if (selectedOrgIds.length === 0) warning("Info", "Pilih minimal satu organisasi");
      return;
    }
    addParticipantsMutation.mutate({ activityId: attendanceDetail.activity.id, organizationIds: selectedOrgIds });
  };

  const handleRemoveOrganization = (orgId) => {
    if (!attendanceDetail?.activity?.id || !canManage) return;
    warning("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus organisasi ini dari peserta kegiatan?", () => {
      removeParticipantsMutation.mutate({ activityId: attendanceDetail.activity.id, organizationIds: [orgId] });
    });
  };

  const handleBack = () => navigate("/attendance");
  const handleOpenOrgModal = () => {
    setShowOrgModal(true);
    setSelectedOrgIds([]);
    setOrgSearch("");
    if (isAdminRanting) fetchAllOrganizations();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
      completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
    };
    const s = statusMap[status] || { label: status || "-", color: "bg-gray-100 text-gray-600" };
    return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch { return "-"; }
  };

  const attendanceStats = useMemo(() => {
    if (!attendanceDetail) return { total: 0, present: 0, absent: 0, percentage: 0 };
    const total = attendanceDetail.total_participants || 0;
    const present = attendanceIds.length;
    return { total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [attendanceDetail, attendanceIds]);

  const hasActiveFilters = search || filterStatus;

  const renderListView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="w-8 h-8 text-emerald-600" />
            Absensi Kegiatan
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola absensi kegiatan organisasi Nahdlatul Ulama</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={handleSearch} placeholder="Cari kegiatan berdasarkan nama..." className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200" />
            </div>
            <select value={filterStatus} onChange={handleFilterStatus} className="w-full sm:w-48 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white">
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            {hasActiveFilters && (
              <button onClick={handleReset} className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        {isFetchingActivities && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="text-center"><Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-3" /><p className="text-gray-500">Memperbarui data...</p></div>
          </div>
        )}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${isFetchingActivities ? "opacity-50" : "opacity-100"}`}>
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
                {activities.length === 0 ? (
                  <tr><td colSpan={4} className="text-center px-4 py-8 text-gray-500"><div className="flex flex-col items-center gap-2"><Calendar className="w-10 h-10 text-gray-300" /><p>Tidak ada data kegiatan</p></div></td></tr>
                ) : (
                  activities.map((activity, index) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="text-center px-4 py-3 text-sm text-gray-600">{(page - 1) * perPage + index + 1}</td>
                      <td className="text-center px-4 py-3">
                        <div className="font-semibold text-gray-800">{activity.nama_kegiatan}</div>
                        <div className="text-xs text-gray-400">{formatDate(activity.tanggal_pelaksanaan)}{activity.tempat && ` • ${activity.tempat}`}</div>
                      </td>
                      <td className="text-center px-4 py-3">{getStatusBadge(activity.status)}</td>
                      <td className="text-center px-4 py-3">
                        <button onClick={() => navigate(`/attendance/${activity.id}`)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md" title="Kelola Absensi">
                          <UserCheck className="w-4 h-4" /> Kelola
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.last_page > 1 && !isFetchingActivities && activities.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-500 order-2 sm:order-1">Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, pagination.total)} dari {pagination.total} data</div>
              <div className="flex gap-2 order-1 sm:order-2">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"><ChevronLeft className="w-4 h-4" /></button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let pageNum = pagination.last_page <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pagination.last_page - 2 ? pagination.last_page - 4 + i : page - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1 rounded-lg transition-all duration-200 ${page === pageNum ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md" : "border border-gray-300 hover:bg-white"}`}>{pageNum}</button>
                    );
                  })}
                </div>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === pagination.last_page} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailView = () => {
    if (!attendanceDetail?.activity) return null;
    const allSelected = attendanceStats.present === attendanceStats.total && attendanceStats.total > 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={handleBack} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-emerald-600" />
              Absensi Kegiatan
            </h1>
            <div className="mt-2">
              <h2 className="text-xl font-semibold text-gray-800">{attendanceDetail.activity.nama_kegiatan}</h2>
              <p className="text-sm text-gray-500">{formatDate(attendanceDetail.activity.tanggal_pelaksanaan)}{attendanceDetail.activity.tempat && ` • ${attendanceDetail.activity.tempat}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <>
                <button onClick={handleOpenOrgModal} disabled={isRefreshing} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Tambah Peserta
                </button>
                <button onClick={handleSaveAttendance} disabled={saveAttendanceMutation.isPending || isRefreshing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                  {saveAttendanceMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Absensi</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold text-gray-800">{attendanceStats.total}</p><p className="text-xs text-gray-500">Total Peserta</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold text-emerald-600">{attendanceStats.present}</p><p className="text-xs text-gray-500">Hadir</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl"><XCircle className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p><p className="text-xs text-gray-500">Tidak Hadir</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl"><Clock className="w-5 h-5 text-purple-600" /></div>
              <div><p className="text-2xl font-bold text-purple-600">{attendanceStats.percentage}%</p><p className="text-xs text-gray-500">Persentase</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Organisasi Peserta</h3>
            <p className="text-xs text-gray-500">{selectedOrganizations.length} organisasi terdaftar</p>
          </div>
          <div className="p-4">
            {selectedOrganizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">Belum ada organisasi peserta</p>
                {canManage && (
                  <button onClick={handleOpenOrgModal} disabled={isRefreshing} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50">
                    <Plus className="w-4 h-4" /> Tambah Organisasi
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedOrganizations.map((org) => (
                  <div key={org.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                    <Building2 className="w-3 h-3 text-gray-500" />
                    <span>{org.nama}</span>
                    {canManage && (
                      <button onClick={() => handleRemoveOrganization(org.id)} disabled={isRefreshing} className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50" title="Hapus">
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
          {isFetchingDetail || isRefreshing ? (
            <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  {canManage && (
                    <button onClick={handleSelectAll} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200">
                      {allSelected ? <><XCircle className="w-4 h-4" /> Batal Pilih Semua</> : <><CheckCircle className="w-4 h-4" /> Pilih Semua</>}
                    </button>
                  )}
                  <span className="text-sm text-gray-500">{attendanceStats.present} orang hadir dari {attendanceStats.total} peserta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div><span className="text-xs text-gray-500">Hadir</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200"></div><span className="text-xs text-gray-500">Belum Hadir</span></div>
                  {!canManage && <span className="text-xs text-amber-600 flex items-center gap-1"><Info className="w-3 h-3" /> Anda hanya dapat melihat absensi</span>}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {selectedOrganizations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Tidak ada peserta yang terdaftar untuk kegiatan ini</div>
                ) : (
                  selectedOrganizations.map((org) => {
                    const anggotaList = org.anggotas || [];
                    const orgAnggotaIds = anggotaList.map((a) => a.id);
                    const orgAttendedCount = orgAnggotaIds.filter((id) => attendanceIds.includes(id)).length;
                    const isOrgAllSelected = orgAnggotaIds.length > 0 && orgAnggotaIds.every((id) => attendanceIds.includes(id));

                    return (
                      <div key={org.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {canManage && (
                              <button onClick={() => handleSelectAllOrganization(org.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${isOrgAllSelected ? "bg-emerald-500 border-emerald-500" : orgAttendedCount > 0 ? "bg-yellow-500 border-yellow-500" : "border-gray-300 bg-white"}`}>
                                {isOrgAllSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                {!isOrgAllSelected && orgAttendedCount > 0 && <span className="w-2 h-2 rounded-full bg-white"></span>}
                              </button>
                            )}
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-800">{org.nama}</span>
                              <span className="text-xs text-gray-400">({orgAttendedCount}/{orgAnggotaIds.length})</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{org.level?.nama || org.level?.display_name || "-"}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {anggotaList.map((anggota) => {
                            const nama = anggota.nama || anggota.biodata?.nama || "Tanpa Nama";
                            const jabatanNama = anggota.jabatan?.nama || anggota.jabatan_nama || "-";
                            const isPresent = attendanceIds.includes(anggota.id);
                            
                            return (
                              <button
                                key={anggota.id}
                                onClick={() => handleToggleAttendance(anggota.id)}
                                disabled={!canManage}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${isPresent ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"} ${!canManage ? "cursor-default" : "cursor-pointer"}`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${isPresent ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"}`}>
                                  {isPresent && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`text-sm ${isPresent ? "text-gray-800" : "text-gray-600"}`}>{nama}</div>
                                  {jabatanNama !== "-" && <div className="text-xs text-gray-400">{jabatanNama}</div>}
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

    const allSelected = selectedOrgIds.length === filteredAvailableOrganizations.length && filteredAvailableOrganizations.length > 0;
    const isLoading = isAdminRanting ? isLoadingAllOrganizations : isLoadingAvailableOrgs;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
          
          {/* Header Modal - HIJAU */}
          <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 shrink-0">
            <div className="relative flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Tambah Organisasi Peserta</h2>
                {isAdminRanting && (
                  <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Admin Ranting: Bisa menambahkan organisasi manapun
                  </p>
                )}
              </div>
              <button onClick={() => { setShowOrgModal(false); setSelectedOrgIds([]); setOrgSearch(""); }} disabled={addParticipantsMutation.isPending} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 disabled:opacity-50">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Select All - HIJAU */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={orgSearch} onChange={(e) => setOrgSearch(e.target.value)} placeholder="Cari organisasi..." className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" disabled={addParticipantsMutation.isPending} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAllOrgs} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" disabled={addParticipantsMutation.isPending} />
                <span className="text-sm text-gray-600">
                  {filteredAvailableOrganizations.length} organisasi tersedia
                  {orgSearch && filteredAvailableOrganizations.length !== availableOrganizations.length && <span className="text-xs text-gray-400"> (filtered)</span>}
                </span>
              </div>
              <span className="text-xs text-gray-500">{selectedOrgIds.length} dipilih</span>
            </div>
          </div>

          {/* List Organisasi - HIJAU */}
          <div className="p-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
            ) : filteredAvailableOrganizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{orgSearch ? "Tidak ada organisasi yang cocok dengan pencarian" : "Tidak ada organisasi yang tersedia"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAvailableOrganizations.map((org) => {
                  const isSelected = selectedOrgIds.includes(org.id);
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleToggleOrgSelect(org.id)}
                      disabled={addParticipantsMutation.isPending}
                      className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all duration-200 disabled:opacity-50 ${isSelected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"}`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <Building2 className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-gray-400"}`} />
                      <div className="flex-1 text-left">
                        <span className={`font-medium ${isSelected ? "text-emerald-700" : "text-gray-700"}`}>{org.nama}</span>
                        {(org.level?.nama || org.level?.display_name) && (
                          <span className="text-xs text-gray-400 ml-2">({org.level?.nama || org.level?.display_name})</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Modal - HIJAU */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
            <button onClick={() => { setShowOrgModal(false); setSelectedOrgIds([]); setOrgSearch(""); }} disabled={addParticipantsMutation.isPending} className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50">
              Batal
            </button>
            <button onClick={handleAddSelectedOrganizations} disabled={addParticipantsMutation.isPending || selectedOrgIds.length === 0} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {addParticipantsMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><Plus className="w-4 h-4" /> Tambah {selectedOrgIds.length > 0 ? `(${selectedOrgIds.length})` : ""}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingActivities && !isDetailView) {
    return <MainLayout><div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-center"><Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" /><p className="text-gray-500">Memuat data...</p></div></div></MainLayout>;
  }

  if (isErrorActivities && !isDetailView) {
    return <MainLayout><div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p className="text-gray-700">Terjadi kesalahan saat memuat data</p><p className="text-sm text-gray-500 mt-1">{errorActivities?.message || "Silakan coba lagi"}</p><button onClick={() => refetchActivities()} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Coba Lagi</button></div></div></MainLayout>;
  }

  if (isLoadingDetail && isDetailView) {
    return <MainLayout><div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-center"><Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" /><p className="text-gray-500">Memuat detail absensi...</p></div></div></MainLayout>;
  }

  if (isErrorDetail && isDetailView) {
    return <MainLayout><div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><p className="text-gray-700">Terjadi kesalahan saat memuat data</p><p className="text-sm text-gray-500 mt-1">{errorDetail?.message || "Silakan coba lagi"}</p><button onClick={() => refetchDetail()} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Coba Lagi</button></div></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {isDetailView ? (<>{renderDetailView()}{renderOrgModal()}</>) : renderListView()}
        </div>
      </div>
    </MainLayout>
  );
};

export default Attendance;