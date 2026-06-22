import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { activityService } from "../../services/activityService";
import { activityAttendanceService } from "../../services/activityAttendanceService";
import { organizationService } from "../../services/organization";
import MainLayout from "../../components/layout/MainLayout";
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Square,
  Loader2,
  Building2,
  User,
  Save,
  Calendar,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";

const Attendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser } = useAuth();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State untuk partisipasi organisasi
  const [availableOrganizations, setAvailableOrganizations] = useState([]);
  const [participantOrganizations, setParticipantOrganizations] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk absensi
  const [attendanceData, setAttendanceData] = useState({});
  const [anggotaData, setAnggotaData] = useState({});
  const [feedbackData, setFeedbackData] = useState({});
  const [loadingAnggota, setLoadingAnggota] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [savingFeedback, setSavingFeedback] = useState({});

  const userRole = currentUser?.role?.slug;
  const isSuperAdmin = userRole === "super-admin";
  const userOrgLevel = currentUser?.organization?.level;
  const userOrganizationId = currentUser?.organization?.id;
  const isPC = userOrgLevel === "pc";
  const isMWC = userOrgLevel === "mwc";
  const isRanting = userOrgLevel === "ranting";

  // Check if user has permission to manage attendance
  const canManageAttendance = useCallback(() => {
    if (!activity || !currentUser) return false;
    
    // Super admin can manage all
    if (isSuperAdmin) return true;
    
    // Activity creator can manage
    if (activity.created_by === currentUser.id) return true;
    
    // Organization admin can manage if activity belongs to their organization
    if (currentUser.organization?.id === activity.organization_id) return true;
    
    return false;
  }, [activity, currentUser, isSuperAdmin]);

  // Fetch activity data
  const fetchActivity = useCallback(async () => {
    try {
      const result = await activityService.getById(id);
      if (result.success) {
        setActivity(result.data);
      } else {
        error("Gagal", result.message);
        navigate("/activity-prokers");
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
      error("Gagal", "Terjadi kesalahan saat mengambil data kegiatan");
      navigate("/activity-prokers");
    }
  }, [id, navigate, error]);

  // Fetch available organizations (yang bisa diundang)
  const fetchAvailableOrganizations = useCallback(async () => {
    setLoadingOrganizations(true);
    try {
      const result = await activityAttendanceService.getAvailableOrganizations(id);
      if (result.success) {
        setAvailableOrganizations(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching available organizations:", err);
      error("Gagal", "Gagal mengambil data organisasi yang tersedia");
    } finally {
      setLoadingOrganizations(false);
    }
  }, [id, error]);

  // Fetch participant organizations yang sudah ada
  const fetchParticipantOrganizations = useCallback(async () => {
    try {
      const result = await activityAttendanceService.getParticipants(id);
      if (result.success) {
        const participants = result.data || [];
        setParticipantOrganizations(participants);
        setSelectedParticipantIds(participants.map(p => p.id));
        
        // Load attendance data for each participant
        await fetchAttendanceData(participants);
      }
    } catch (err) {
      console.error("Error fetching participants:", err);
      error("Gagal", "Gagal mengambil data peserta");
    }
  }, [id, error]);

  // Fetch attendance data for all organizations
  const fetchAttendanceData = useCallback(async (organizations) => {
    try {
      const result = await activityAttendanceService.getAttendance(id);
      if (result.success && result.data) {
        const newAttendanceData = {};
        const newAnggotaData = {};
        
        result.data.forEach(orgData => {
          const orgId = orgData.organization_id;
          if (orgData.anggotas) {
            const attendanceMap = {};
            const anggotaMap = {};
            
            orgData.anggotas.forEach(anggota => {
              attendanceMap[anggota.id] = {
                is_present: anggota.is_present || false,
                kritik: anggota.kritik || "",
                saran: anggota.saran || "",
              };
              anggotaMap[anggota.id] = {
                nama: anggota.nama,
                jabatan: anggota.jabatan,
                id: anggota.id,
              };
            });
            
            newAttendanceData[orgId] = attendanceMap;
            newAnggotaData[orgId] = anggotaMap;
          }
        });
        
        setAttendanceData(newAttendanceData);
        setAnggotaData(newAnggotaData);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  }, [id]);

  // Fetch anggota dari suatu organisasi untuk ditampilkan
  const fetchAnggotaByOrganization = useCallback(async (organizationId) => {
    setLoadingAnggota(prev => ({ ...prev, [organizationId]: true }));
    
    try {
      const result = await activityAttendanceService.getAnggotaByOrganization(id, organizationId);
      if (result.success && result.data) {
        const attendanceMap = attendanceData[organizationId] || {};
        const anggotaMap = anggotaData[organizationId] || {};
        
        result.data.forEach(anggota => {
          if (!attendanceMap[anggota.id]) {
            attendanceMap[anggota.id] = {
              is_present: false,
              kritik: "",
              saran: "",
            };
          }
          anggotaMap[anggota.id] = {
            nama: anggota.nama,
            jabatan: anggota.jabatan,
            id: anggota.id,
          };
        });
        
        setAttendanceData(prev => ({ ...prev, [organizationId]: { ...attendanceMap } }));
        setAnggotaData(prev => ({ ...prev, [organizationId]: { ...anggotaMap } }));
      }
    } catch (err) {
      console.error("Error fetching anggota:", err);
      error("Gagal", `Gagal mengambil data anggota untuk organisasi`);
    } finally {
      setLoadingAnggota(prev => ({ ...prev, [organizationId]: false }));
    }
  }, [id, attendanceData, anggotaData, error]);

  // Toggle organization selection
  const toggleOrganization = useCallback((orgId) => {
    setSelectedParticipantIds(prev => {
      if (prev.includes(orgId)) {
        return prev.filter(id => id !== orgId);
      }
      return [...prev, orgId];
    });
  }, []);

  // Toggle all organizations
  const toggleAllOrganizations = useCallback(() => {
    setSelectedParticipantIds(prev => {
      if (prev.length === availableOrganizations.length && availableOrganizations.length > 0) {
        return [];
      }
      return availableOrganizations.map(org => org.id);
    });
  }, [availableOrganizations]);

  // Save participants
  const handleSaveParticipants = useCallback(async () => {
    setLoadingOrganizations(true);
    
    try {
      const result = await activityAttendanceService.addParticipants(id, selectedParticipantIds);
      if (result.success) {
        success("Berhasil", "Data peserta berhasil diperbarui");
        
        // Refresh data
        await fetchParticipantOrganizations();
        await fetchAvailableOrganizations();
        
        // Fetch anggota for new organizations
        const newOrgs = selectedParticipantIds.filter(orgId => 
          !participantOrganizations.some(p => p.id === orgId)
        );
        
        for (const orgId of newOrgs) {
          await fetchAnggotaByOrganization(orgId);
        }
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      console.error("Error saving participants:", err);
      error("Gagal", "Terjadi kesalahan saat menyimpan peserta");
    } finally {
      setLoadingOrganizations(false);
    }
  }, [id, selectedParticipantIds, participantOrganizations, fetchParticipantOrganizations, fetchAvailableOrganizations, fetchAnggotaByOrganization, success, error]);

  // Toggle attendance for an anggota
  const toggleAttendance = useCallback((organizationId, anggotaId) => {
    setAttendanceData(prev => ({
      ...prev,
      [organizationId]: {
        ...prev[organizationId],
        [anggotaId]: {
          ...prev[organizationId]?.[anggotaId],
          is_present: !prev[organizationId]?.[anggotaId]?.is_present,
        },
      },
    }));
  }, []);

  // Toggle all attendance for an organization
  const toggleAllAttendance = useCallback((organizationId) => {
    const anggotas = anggotaData[organizationId] || {};
    const attendance = attendanceData[organizationId] || {};
    const anggotasList = Object.keys(anggotas);
    
    if (anggotasList.length === 0) return;
    
    const allPresent = anggotasList.every(id => attendance[id]?.is_present === true);
    
    setAttendanceData(prev => {
      const newAttendance = { ...prev[organizationId] };
      anggotasList.forEach(anggotaId => {
        newAttendance[anggotaId] = {
          ...newAttendance[anggotaId],
          is_present: !allPresent,
        };
      });
      
      return {
        ...prev,
        [organizationId]: newAttendance,
      };
    });
  }, [anggotaData, attendanceData]);

  // Update feedback for an anggota
  const updateFeedback = useCallback((organizationId, anggotaId, field, value) => {
    setFeedbackData(prev => ({
      ...prev,
      [`${organizationId}_${anggotaId}`]: {
        ...prev[`${organizationId}_${anggotaId}`],
        [field]: value,
      },
    }));
    
    // Also update attendance data
    setAttendanceData(prev => ({
      ...prev,
      [organizationId]: {
        ...prev[organizationId],
        [anggotaId]: {
          ...prev[organizationId]?.[anggotaId],
          [field]: value,
        },
      },
    }));
  }, []);

  // Save feedback
  const handleSaveFeedback = useCallback(async (organizationId, anggotaId) => {
    const feedbackKey = `${organizationId}_${anggotaId}`;
    setSavingFeedback(prev => ({ ...prev, [feedbackKey]: true }));
    
    try {
      const feedback = feedbackData[feedbackKey] || { kritik: "", saran: "" };
      const currentAttendance = attendanceData[organizationId]?.[anggotaId];
      
      const attendances = [{
        anggota_id: parseInt(anggotaId),
        is_present: currentAttendance?.is_present || false,
        kritik: feedback.kritik || null,
        saran: feedback.saran || null,
      }];
      
      const result = await activityAttendanceService.saveAttendance(id, attendances);
      if (result.success) {
        success("Berhasil", "Feedback berhasil disimpan");
        setShowFeedback(prev => ({ ...prev, [feedbackKey]: false }));
        // Clear feedback after saving
        setFeedbackData(prev => {
          const newData = { ...prev };
          delete newData[feedbackKey];
          return newData;
        });
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      console.error("Error saving feedback:", err);
      error("Gagal", "Terjadi kesalahan saat menyimpan feedback");
    } finally {
      setSavingFeedback(prev => ({ ...prev, [feedbackKey]: false }));
    }
  }, [id, attendanceData, feedbackData, success, error]);

  // Save all attendance
  const handleSaveAttendance = useCallback(async () => {
    setSaving(true);
    
    try {
      // Prepare attendance data
      const attendances = [];
      
      for (const org of participantOrganizations) {
        const orgAttendance = attendanceData[org.id] || {};
        const orgFeedback = {};
        
        // Collect feedback for this organization
        Object.keys(orgAttendance).forEach(anggotaId => {
          const feedbackKey = `${org.id}_${anggotaId}`;
          if (feedbackData[feedbackKey]) {
            orgFeedback[anggotaId] = feedbackData[feedbackKey];
          }
        });
        
        for (const [anggotaId, att] of Object.entries(orgAttendance)) {
          const feedback = orgFeedback[anggotaId] || {};
          const isPresent = att.is_present || false;
          
          attendances.push({
            anggota_id: parseInt(anggotaId),
            is_present: isPresent,
            kritik: !isPresent ? (feedback.kritik || att.kritik || null) : null,
            saran: !isPresent ? (feedback.saran || att.saran || null) : null,
          });
        }
      }
      
      if (attendances.length === 0) {
        warning("Peringatan", "Tidak ada data absensi yang akan disimpan");
        setSaving(false);
        return;
      }
      
      const result = await activityAttendanceService.saveAttendance(id, attendances);
      if (result.success) {
        success("Berhasil", "Data absensi berhasil disimpan");
        // Clear feedback data after successful save
        setFeedbackData({});
        // Refresh attendance data
        await fetchParticipantOrganizations();
      } else {
        error("Gagal", result.message);
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      error("Gagal", "Terjadi kesalahan saat menyimpan absensi");
    } finally {
      setSaving(false);
    }
  }, [id, participantOrganizations, attendanceData, feedbackData, fetchParticipantOrganizations, success, error, warning]);

  // Toggle organization expand/collapse
  const toggleExpandOrg = useCallback((orgId) => {
    setExpandedOrgs(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  }, []);

  // Toggle feedback modal
  const toggleFeedback = useCallback((organizationId, anggotaId) => {
    const key = `${organizationId}_${anggotaId}`;
    setShowFeedback(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Initialize feedback data when opening modal
    if (!showFeedback[key]) {
      const currentAtt = attendanceData[organizationId]?.[anggotaId];
      if (currentAtt) {
        setFeedbackData(prev => ({
          ...prev,
          [key]: {
            kritik: currentAtt.kritik || "",
            saran: currentAtt.saran || "",
          },
        }));
      }
    }
  }, [attendanceData, showFeedback]);

  // Filter available organizations by search term
  const filteredAvailableOrgs = availableOrganizations.filter(org =>
    org.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchActivity();
      await fetchParticipantOrganizations();
      await fetchAvailableOrganizations();
      setLoading(false);
    };
    loadData();
  }, [fetchActivity, fetchParticipantOrganizations, fetchAvailableOrganizations]);

  // Permission check
  if (!canManageAttendance() && !loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <X className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">Anda tidak memiliki akses ke halaman ini</p>
            <button
              onClick={() => navigate("/activity-prokers")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Kembali
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!activity) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Kegiatan tidak ditemukan</p>
            <button
              onClick={() => navigate("/activity-prokers")}
              className="mt-4 text-emerald-600 hover:text-emerald-700"
            >
              Kembali
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/activity-prokers")}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Manajemen Absensi
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Kelola kehadiran anggota kegiatan
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveAttendance}
                disabled={saving || participantOrganizations.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Semua Absensi
              </button>
            </div>
          </div>

          {/* Info Kegiatan */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Kegiatan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nama Kegiatan</p>
                    <p className="text-sm font-medium text-gray-800">{activity.nama_kegiatan}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Organisasi Pelaksana</p>
                    <p className="text-sm font-medium text-gray-800">{activity.organization?.nama || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Tanggal Pelaksanaan</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(activity.tanggal_pelaksanaan)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Penanggung Jawab</p>
                    <p className="text-sm font-medium text-gray-800">{activity.penanggung_jawab?.nama || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partisipasi Organisasi */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Undang Organisasi Lain</h2>
                </div>
                {availableOrganizations.length > 0 && (
                  <button
                    onClick={toggleAllOrganizations}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {selectedParticipantIds.length === availableOrganizations.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedParticipantIds.length === availableOrganizations.length ? "Batalkan Semua" : "Pilih Semua"}
                  </button>
                )}
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari organisasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {loadingOrganizations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : filteredAvailableOrgs.length > 0 ? (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <div className="space-y-2">
                    {filteredAvailableOrgs.map((org) => (
                      <label
                        key={org.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipantIds.includes(org.id)}
                          onChange={() => toggleOrganization(org.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{org.nama}</p>
                          {org.level && (
                            <p className="text-xs text-gray-500">{org.level}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <p>Tidak ada organisasi yang tersedia untuk diundang</p>
                </div>
              )}
              
              {(selectedParticipantIds.length !== participantOrganizations.length || 
                (availableOrganizations.length > 0 && selectedParticipantIds.length > 0)) && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveParticipants}
                    disabled={loadingOrganizations}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {loadingOrganizations ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan Partisipasi"}
                  </button>
                </div>
              )}
              
              {participantOrganizations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Organisasi yang Berpartisipasi:</p>
                  <div className="flex flex-wrap gap-2">
                    {participantOrganizations.map((org) => (
                      <span
                        key={org.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700"
                      >
                        {org.nama}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Absensi Anggota */}
          {participantOrganizations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-800">Absensi Anggota</h2>
              </div>
              
              {participantOrganizations.map((org) => (
                <div key={org.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                  {/* Organization Header */}
                  <div 
                    className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleExpandOrg(org.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-gray-800">{org.nama}</h3>
                        <p className="text-xs text-gray-500">{org.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {loadingAnggota[org.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllAttendance(org.id);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Pilih Semua
                        </button>
                      )}
                      {expandedOrgs[org.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Organization Body */}
                  {expandedOrgs[org.id] && (
                    <div className="p-4">
                      {loadingAnggota[org.id] ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                      ) : Object.keys(anggotaData[org.id] || {}).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-150">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">#</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Anggota</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Hadir</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {Object.entries(anggotaData[org.id] || {}).map(([anggotaId, info], index) => {
                                const att = attendanceData[org.id]?.[anggotaId] || { is_present: false };
                                
                                return (
                                  <tr key={anggotaId} className="hover:bg-gray-50 transition-colors">
                                    <td className="text-center px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-gray-800">{info.nama || "-"}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-sm text-gray-600">{info.jabatan || "-"}</span>
                                    </td>
                                    <td className="text-center px-4 py-3">
                                      <button
                                        onClick={() => toggleAttendance(org.id, parseInt(anggotaId))}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                          att.is_present
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                        }`}
                                        aria-label={att.is_present ? "Batalkan kehadiran" : "Tandai hadir"}
                                      >
                                        {att.is_present ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                      </button>
                                    </td>
                                    <td className="text-center px-4 py-3">
                                      {!att.is_present && (
                                        <button
                                          onClick={() => toggleFeedback(org.id, parseInt(anggotaId))}
                                          className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 mx-auto"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          Feedback
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Tidak ada data anggota untuk organisasi ini</p>
                          <button
                            onClick={() => fetchAnggotaByOrganization(org.id)}
                            className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            Muat ulang data
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada organisasi yang berpartisipasi</p>
              <p className="text-sm text-gray-400 mt-1">Silakan undang organisasi terlebih dahulu</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {Object.entries(showFeedback).map(([key, isOpen]) => {
        if (!isOpen) return null;
        const [orgId, anggotaId] = key.split("_");
        const feedback = feedbackData[key] || { kritik: "", saran: "" };
        const isSaving = savingFeedback[key];
        
        return (
          <div key={key} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Kritik & Saran</h3>
                  <button
                    onClick={() => toggleFeedback(parseInt(orgId), parseInt(anggotaId))}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kritik
                    </label>
                    <textarea
                      value={feedback.kritik}
                      onChange={(e) => updateFeedback(parseInt(orgId), parseInt(anggotaId), "kritik", e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Masukkan kritik untuk kegiatan ini..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saran
                    </label>
                    <textarea
                      value={feedback.saran}
                      onChange={(e) => updateFeedback(parseInt(orgId), parseInt(anggotaId), "saran", e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Masukkan saran untuk kegiatan ini..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => toggleFeedback(parseInt(orgId), parseInt(anggotaId))}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleSaveFeedback(parseInt(orgId), parseInt(anggotaId))}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </MainLayout>
  );
};

export default Attendance;