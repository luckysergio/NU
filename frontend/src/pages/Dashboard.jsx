// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../contexts/ModalContext";
import { useDashboard } from "../hooks/useDashboard";
import MainLayout from "../components/layout/MainLayout";
import ThemeChart from "../components/dashboard/ThemeChart";
import QRCodeScanner from "../components/QRCode/QRCodeScanner";
import QRCodeResultModal from "../components/QRCode/QRCodeResultModal";
import { anggotaService } from "../services/anggota";
import {
  Building2,
  Users,
  Calendar,
  FolderTree,
  Globe,
  Building,
  Home,
  Library,
  Store,
  Banknote,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  QrCode,
  Briefcase,
  RefreshCw,
  TrendingUp,
  Activity,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error, success, warning } = useModal();

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    refresh,
    toggleRealtime,
    isRealtimeEnabled,
    connectionStatus,
  } = useDashboard();

  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [showScanner, setShowScanner] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [anggotaResult, setAnggotaResult] = useState(null);
  const [searchingAnggota, setSearchingAnggota] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  useEffect(() => {
    setSelectedThemeIndex(0);
  }, [dashboardData?.programs]);

  // =========================================================================
  // USER ROLE & PERMISSIONS
  // =========================================================================
  const userRole = user?.role?.slug;
  const userOrgLevel = user?.organization?.level?.slug || user?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdminPC = userRole === "admin" && userOrgLevel === "pc";
  const isAdminMWC = userRole === "admin" && userOrgLevel === "mwc";
  const isRanting = userRole === "admin" && userOrgLevel === "ranting";
  const isAnakRanting = userRole === "admin" && userOrgLevel === "anak-ranting";

  const isStructuralBelowPC = isAdminMWC || isRanting || isAnakRanting;
  const showChart = isSuperAdmin || isAdminPC;

  const visibleLevels = ['pc', 'mwc', 'ranting', 'anak_ranting', 'lembaga', 'banom'];

  const levelLabels = {
    pc: "PCNU",
    mwc: "MWC",
    ranting: "Ranting",
    anak_ranting: "Anak Ranting",
    lembaga: "Lembaga",
    banom: "Banom",
  };

  const levelIcons = {
    pc: <Building2 className="w-6 h-6" />,
    mwc: <Library className="w-6 h-6" />,
    ranting: <Store className="w-6 h-6" />,
    anak_ranting: <Home className="w-6 h-6" />,
    lembaga: <Banknote className="w-6 h-6" />,
    banom: <Users className="w-6 h-6" />,
  };

  // ✅ Warna serasi dengan Login & Sidebar
  const levelColors = {
    pc: "from-green-700 to-green-800",
    mwc: "from-emerald-600 to-green-700",
    ranting: "from-green-600 to-emerald-600",
    anak_ranting: "from-teal-600 to-green-600",
    lembaga: "from-green-500 to-emerald-500",
    banom: "from-emerald-500 to-teal-500",
  };

  const getLevelCount = (key) => {
    if (!dashboardData) return 0;

    if (dashboardData.totals && dashboardData.totals[key] !== undefined) {
      return dashboardData.totals[key];
    }

    if (dashboardData.statistics && dashboardData.statistics[key] && dashboardData.statistics[key].count !== undefined) {
      return dashboardData.statistics[key].count;
    }

    return 0;
  };

  const nextTheme = () => {
    if (activeThemes && activeThemes.length > 0) {
      setChartLoading(true);
      setSelectedThemeIndex((prev) => (prev + 1) % activeThemes.length);
      setTimeout(() => setChartLoading(false), 300);
    }
  };

  const prevTheme = () => {
    if (activeThemes && activeThemes.length > 0) {
      setChartLoading(true);
      setSelectedThemeIndex((prev) => (prev - 1 + activeThemes.length) % activeThemes.length);
      setTimeout(() => setChartLoading(false), 300);
    }
  };

  const searchAnggotaByNoAnggota = async (noAnggota) => {
    try {
      const response = await anggotaService.getAll({
        search: noAnggota,
        per_page: 1,
      });

      if (response.success && response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }

      const response2 = await anggotaService.getAll({
        no_anggota: noAnggota,
        per_page: 1,
      });

      if (response2.success && response2.data && response2.data.data && response2.data.data.length > 0) {
        return response2.data.data[0];
      }

      return null;
    } catch (err) {
      console.error('Error searching anggota:', err);
      throw err;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setScanResult(decodedText);
    setShowScanner(false);
    setSearchingAnggota(true);
    setSearchError(null);
    setAnggotaResult(null);
    setShowResultModal(true);

    try {
      const result = await searchAnggotaByNoAnggota(decodedText);

      if (result) {
        setAnggotaResult(result);
        setSearchingAnggota(false);
        success('Berhasil', `Anggota dengan No. ${decodedText} ditemukan`);
      } else {
        setSearchError(`Anggota dengan No. "${decodedText}" tidak ditemukan`);
        setSearchingAnggota(false);
        error('Tidak Ditemukan', `Anggota dengan No. "${decodedText}" tidak ditemukan`);
      }
    } catch (err) {
      setSearchError('Terjadi kesalahan saat mencari data anggota.');
      setSearchingAnggota(false);
      error('Error', 'Terjadi kesalahan saat mencari data anggota');
    }
  };

  const handleUploadQR = async (decodedText) => {
    setScanResult(decodedText);
    setShowScanner(false);
    setSearchingAnggota(true);
    setSearchError(null);
    setAnggotaResult(null);
    setShowResultModal(true);

    try {
      const result = await searchAnggotaByNoAnggota(decodedText);

      if (result) {
        setAnggotaResult(result);
        setSearchingAnggota(false);
        success('Berhasil', `Anggota dengan No. ${decodedText} ditemukan`);
      } else {
        setSearchError(`Anggota dengan No. "${decodedText}" tidak ditemukan`);
        setSearchingAnggota(false);
        error('Tidak Ditemukan', `Anggota dengan No. "${decodedText}" tidak ditemukan`);
      }
    } catch (err) {
      setSearchError('Terjadi kesalahan saat mencari data anggota.');
      setSearchingAnggota(false);
      error('Error', 'Terjadi kesalahan saat mencari data anggota');
    }
  };

  const handleScanError = () => {
    error('Error', 'Gagal melakukan scan QR Code. Pastikan QR Code terlihat jelas.');
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);

    if (diff < 5) return 'Baru saja';
    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    return lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const renderRealtimeStatus = () => {
    const statusConfig = {
      connected: {
        icon: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
        text: 'Realtime',
        className: 'bg-green-800/50 text-green-200 border-green-700/50',
        pulse: true,
      },
      connecting: {
        icon: <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />,
        text: 'Menghubungkan...',
        className: 'bg-yellow-800/50 text-yellow-200 border-yellow-700/50',
        pulse: false,
      },
      disconnected: {
        icon: <WifiOff className="w-3.5 h-3.5 text-gray-400" />,
        text: 'Polling',
        className: 'bg-gray-800/50 text-gray-200 border-gray-700/50',
        pulse: false,
      },
      error: {
        icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
        text: 'Error',
        className: 'bg-red-800/50 text-red-200 border-red-700/50',
        pulse: false,
      },
    };

    const status = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <button
        onClick={toggleRealtime}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:scale-105 ${status.className}`}
        style={{ transition: "transform 150ms ease-out" }}
        title={isRealtimeEnabled ? 'Klik untuk matikan realtime' : 'Klik untuk aktifkan realtime'}
      >
        {status.icon}
        <span className="hidden sm:inline">{status.text}</span>
        {status.pulse && isRealtimeEnabled && connectionStatus === 'connected' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
          </span>
        )}
      </button>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Memuat data...</p>
            <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-gray-600 mb-4">{queryError?.message || "Silakan coba lagi"}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
              style={{ transition: "background-color 150ms ease-out" }}
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak Ada Data</h3>
            <p className="text-gray-600">Belum ada data untuk ditampilkan</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalOrganizations = dashboardData.total_organizations || 0;
  const totalMembers = dashboardData.total_members || 0;
  const programs = dashboardData.programs || [];
  const totalThemes = dashboardData.total_themes || 0;

  const activeThemes = programs || [];
  const totalActiveActivities = dashboardData.total_activities || 0;
  const totalActivePrograms = activeThemes.length;
  const currentTheme = activeThemes?.[selectedThemeIndex] || null;
  const totalWorkPrograms = dashboardData.total_work_programs || 0;

  // =========================================================================
  // ✅ STATS CARDS - Lightweight
  // =========================================================================
  const getStats = () => {
    const stats = [
      {
        title: "Total Organisasi",
        value: totalOrganizations.toLocaleString(),
        icon: Building2,
        gradient: "from-green-600 to-emerald-600",
        bgGradient: "from-green-50 to-emerald-50",
        textColor: "text-green-700",
        iconBg: "bg-green-100",
        clickable: false,
      },
      {
        title: "Total Anggota Aktif",
        value: totalMembers.toLocaleString(),
        icon: Users,
        gradient: "from-emerald-600 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        textColor: "text-emerald-700",
        iconBg: "bg-emerald-100",
        clickable: true,
        onClick: () => setShowScanner(true),
      },
    ];

    if (isStructuralBelowPC) {
      stats.push({
        title: "Program Kerja Aktif",
        value: totalWorkPrograms.toString(),
        icon: Briefcase,
        gradient: "from-teal-600 to-cyan-600",
        bgGradient: "from-teal-50 to-cyan-50",
        textColor: "text-teal-700",
        iconBg: "bg-teal-100",
        clickable: false,
      });
    } else {
      stats.push({
        title: "Tema Program Aktif",
        value: totalThemes.toString(),
        icon: FolderTree,
        gradient: "from-green-700 to-emerald-700",
        bgGradient: "from-green-50 to-emerald-50",
        textColor: "text-green-700",
        iconBg: "bg-green-100",
        clickable: false,
      });
    }

    stats.push({
      title: "Total Kegiatan",
      value: totalActiveActivities.toString(),
      icon: Calendar,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50",
      textColor: "text-emerald-700",
      iconBg: "bg-emerald-100",
      clickable: false,
    });

    return stats;
  };

  const stats = getStats();

  const getStructureTitle = () => {
    return "Struktur Organisasi PCNU Kota Tangerang";
  };

  return (
    <>
      <MainLayout>
        <div className="space-y-6">
          {/* ✅ Header Banner - Lightweight, NO blur */}
          <div className="relative overflow-hidden bg-linear-to-r from-green-900 via-green-800 to-green-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-600 rounded-xl shadow-md">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      Selamat Datang, {user?.name || "Administrator"}!
                    </h1>
                    <p className="text-sm text-green-200 mt-0.5">
                      Sistem Manajemen Organisasi Nahdlatul Ulama
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-800/50 rounded-lg border border-green-700/50">
                    <Globe className="w-4 h-4 text-green-300" />
                    <span className="text-xs font-medium text-green-100">Rahmatan Lil Alamin</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-800/50 rounded-lg border border-green-700/50">
                    <Building2 className="w-4 h-4 text-green-300" />
                    <span className="text-xs font-medium text-green-100">PCNU Kota Tangerang</span>
                  </div>

                  {lastUpdated && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-800/50 rounded-lg border border-green-700/50">
                      <RefreshCw className={`w-4 h-4 text-green-300 ${isFetching ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-medium text-green-100">{formatLastUpdated()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {renderRealtimeStatus()}
              </div>
            </div>

            {isFetching && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-800/30 overflow-hidden">
                <div className="h-full bg-green-400 animate-pulse" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>

          {/* ✅ Stats Cards - Lightweight, NO blur, NO complex shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.clickable ? stat.onClick : undefined}
                  className={`
                    group relative overflow-hidden rounded-2xl
                    bg-linear-to-br ${stat.bgGradient}
                    border border-green-100
                    shadow-sm hover:shadow-md
                    ${stat.clickable ? 'cursor-pointer hover:-translate-y-0.5' : ''}
                  `}
                  style={{ transition: "transform 200ms ease-out, box-shadow 200ms ease-out" }}
                >
                  {/* Simple Gradient Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${stat.gradient}`}></div>

                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 mb-1 truncate">
                          {stat.title}
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
                          {stat.value}
                        </p>
                      </div>
                      
                      <div className={`${stat.iconBg} p-3 rounded-xl shadow-sm`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>

                    {stat.clickable && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="font-medium">Klik untuk scan QR Code</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Struktur Organisasi - Lightweight */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="bg-linear-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-xl shadow-sm">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {getStructureTitle()}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Total {totalOrganizations.toLocaleString()} organisasi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {visibleLevels.map((key, index) => {
                  const count = getLevelCount(key);
                  const Icon = levelIcons[key];
                  const gradient = levelColors[key];
                  
                  return (
                    <div
                      key={key}
                      className={`
                        group relative overflow-hidden rounded-xl
                        bg-linear-to-br ${gradient}
                        text-white shadow-sm hover:shadow-md
                        hover:-translate-y-0.5
                      `}
                      style={{ transition: "transform 200ms ease-out, box-shadow 200ms ease-out" }}
                    >
                      <div className="relative p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            {Icon}
                          </div>
                        </div>
                        <p className="font-semibold text-xs mb-1">
                          {levelLabels[key]}
                        </p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ✅ Chart Section - Lightweight */}
          {showChart && (
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
              <div className="bg-linear-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-xl shadow-sm">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Chart Program Kerja per Tema Aktif
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Visualisasi distribusi program kerja
                      </p>
                    </div>
                  </div>

                  {activeThemes && activeThemes.length > 1 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-green-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedThemeIndex + 1} / {activeThemes.length}
                        </span>
                      </div>
                      <button
                        onClick={prevTheme}
                        disabled={chartLoading}
                        className="p-2 bg-white rounded-lg border border-green-200 shadow-sm hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ transition: "background-color 150ms ease-out" }}
                      >
                        <ChevronLeft className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={nextTheme}
                        disabled={chartLoading}
                        className="p-2 bg-white rounded-lg border border-green-200 shadow-sm hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ transition: "background-color 150ms ease-out" }}
                      >
                        <ChevronRight className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {activeThemes && activeThemes.length > 0 ? (
                  <div className="relative">
                    {chartLoading && (
                      <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                          <p className="mt-3 text-sm font-medium text-gray-600">Memuat chart...</p>
                        </div>
                      </div>
                    )}
                    <ThemeChart
                      key={currentTheme?.theme_id}
                      themeId={currentTheme.theme_id}
                      themeName={currentTheme.theme}
                      onClose={() => {}}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderTree className="w-12 h-12 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Belum Ada Tema Program Aktif
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Silakan buat tema program terlebih dahulu untuk melihat visualisasi data
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ✅ Footer - Lightweight */}
          <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-gray-700">
                Aswaja • Moderat & Toleran
              </p>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Nahdlatul Ulama - PCNU Kota Tangerang. All rights reserved.
            </p>
            <p className="text-xs text-green-600 mt-2 font-medium italic">
              "Rahmatan Lil Alamin"
            </p>
          </div>
        </div>
      </MainLayout>

      <QRCodeScanner
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          setScanResult(null);
        }}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onUploadQR={handleUploadQR}
      />

      <QRCodeResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setAnggotaResult(null);
          setSearchError(null);
          setScanResult(null);
        }}
        anggota={anggotaResult}
        isLoading={searchingAnggota}
        error={searchError}
        scanResult={scanResult}
      />
    </>
  );
};

export default Dashboard;