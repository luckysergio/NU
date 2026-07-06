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
  Zap,
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
  // ✅ PERBAIKAN: Tambah isRanting & isAnakRanting
  // =========================================================================
  const userRole = user?.role?.slug;
  const userOrgLevel = user?.organization?.level?.slug || user?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdminPC = userRole === "admin" && userOrgLevel === "pc";
  const isAdminMWC = userRole === "admin" && userOrgLevel === "mwc";
  const isRanting = userRole === "admin" && userOrgLevel === "ranting";
  const isAnakRanting = userRole === "admin" && userOrgLevel === "anak-ranting";

  // ✅ Helper: Apakah user adalah level struktural bawah (MWC, Ranting, Anak Ranting)
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
    pc: <Building2 className="w-5 h-5" />,
    mwc: <Library className="w-5 h-5" />,
    ranting: <Store className="w-5 h-5" />,
    anak_ranting: <Home className="w-5 h-5" />,
    lembaga: <Banknote className="w-5 h-5" />,
    banom: <Users className="w-5 h-5" />,
  };

  const levelColors = {
    pc: "bg-purple-600",
    mwc: "bg-emerald-600",
    ranting: "bg-green-600",
    anak_ranting: "bg-emerald-500",
    lembaga: "bg-green-500",
    banom: "bg-teal-600",
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
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
        text: 'Realtime',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pulse: true,
      },
      connecting: {
        icon: <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />,
        text: 'Menghubungkan...',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        pulse: false,
      },
      disconnected: {
        icon: <WifiOff className="w-3.5 h-3.5 text-gray-500" />,
        text: 'Polling',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        pulse: false,
      },
      error: {
        icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
        text: 'Error',
        className: 'bg-red-50 text-red-700 border-red-200',
        pulse: false,
      },
    };

    const status = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <button
        onClick={toggleRealtime}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all hover:scale-105 ${status.className}`}
        title={isRealtimeEnabled ? 'Klik untuk matikan realtime' : 'Klik untuk aktifkan realtime'}
      >
        {status.icon}
        <span className="hidden sm:inline">{status.text}</span>
        {status.pulse && isRealtimeEnabled && connectionStatus === 'connected' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data dashboard...</p>
          <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700">Terjadi kesalahan saat memuat data</p>
            <p className="text-sm text-gray-500 mt-1">{queryError?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
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
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700">Tidak ada data</h3>
            <p className="text-gray-500 mt-2">Belum ada data untuk ditampilkan</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Refresh
            </button>
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
  // ✅ PERBAIKAN: Logika card berdasarkan role user
  // =========================================================================
  const getStats = () => {
    const stats = [
      {
        title: "Total Organisasi",
        value: totalOrganizations.toLocaleString(),
        icon: Building2,
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-500",
        clickable: false,
      },
      {
        title: "Total Anggota Aktif",
        value: totalMembers.toLocaleString(),
        icon: Users,
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-500",
        clickable: true,
        onClick: () => setShowScanner(true),
      },
    ];

    // ✅ PERBAIKAN: MWC, Ranting, Anak Ranting → Program Kerja Aktif
    //             PC, Super Admin → Tema Program Aktif
    if (isStructuralBelowPC) {
      stats.push({
        title: "Program Kerja Aktif",
        value: totalWorkPrograms.toString(),
        icon: Briefcase,
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-500",
        clickable: false,
      });
    } else {
      stats.push({
        title: "Tema Program Aktif",
        value: totalThemes.toString(),
        icon: FolderTree,
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
        borderColor: "border-purple-500",
        clickable: false,
      });
    }

    stats.push({
      title: "Total Kegiatan Aktif",
      value: totalActiveActivities.toString(),
      icon: Calendar,
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-500",
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
          <div className="relative overflow-hidden bg-linear-to-r from-green-700 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

            <div className="relative flex items-start sm:items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Sparkles className="w-5 h-5 text-green-200 shrink-0" />
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    Selamat Datang, {user?.name || "Administrator"}!
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-green-100 flex-wrap text-sm">
                  <span>Sistem Manajemen Organisasi Nahdlatul Ulama</span>
                  <span className="hidden sm:inline text-green-300">•</span>
                  <span className="text-xs bg-green-600/30 px-3 py-1 rounded-full">
                    PCNU Kota Tangerang
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-green-200">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>Rahmatan Lil Alamin</span>
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-1.5 text-xs text-green-200">
                      <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isFetching ? 'animate-spin' : ''}`} />
                      <span>Diperbarui: {formatLastUpdated()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {renderRealtimeStatus()}
                <button
                  onClick={() => refresh()}
                  disabled={isFetching}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50"
                  title="Refresh manual"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isFetching && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800/30 overflow-hidden">
                <div className="h-full bg-white/60 animate-pulse" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.clickable ? stat.onClick : undefined}
                  className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border-l-4 ${stat.borderColor} ${stat.clickable ? 'hover:-translate-y-1 cursor-pointer' : ''} relative overflow-hidden`}
                >
                  {isFetching && (
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                  )}

                  <div className="flex items-center justify-between relative">
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs sm:text-sm mb-1 truncate">{stat.title}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full group-hover:scale-110 transition-transform duration-300 shrink-0 ml-2`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  {stat.clickable && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <QrCode className="w-3 h-3 shrink-0" />
                      <span className="truncate">Klik untuk scan QR Code</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-6 bg-green-600 rounded-full shrink-0"></div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  {getStructureTitle()}
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg shrink-0">
                <Building className="w-4 h-4 text-green-700" />
                <span className="text-xs sm:text-sm font-medium text-green-700">
                  Total: {totalOrganizations.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {visibleLevels.map((key) => {
                const count = getLevelCount(key);
                const Icon = levelIcons[key];
                return (
                  <div
                    key={key}
                    className={`${levelColors[key]} rounded-xl p-3 sm:p-4 text-center text-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-default relative overflow-hidden`}
                  >
                    {isFetching && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    )}
                    <div className="flex justify-center mb-2 opacity-90 relative">
                      {Icon}
                    </div>
                    <p className="font-semibold text-xs opacity-90 truncate">{levelLabels[key]}</p>
                    <p className="text-xl sm:text-2xl font-bold relative">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {showChart && (
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <div className="w-1 h-6 bg-green-600 rounded-full shrink-0"></div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                    Chart Program Kerja PCNU Kota Tangerang per Tema Aktif
                  </h2>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium shrink-0">
                    {totalActivePrograms} Tema
                  </span>
                </div>
                {activeThemes && activeThemes.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-gray-500">
                      {selectedThemeIndex + 1} / {activeThemes.length}
                    </span>
                    <button
                      onClick={prevTheme}
                      disabled={chartLoading}
                      className="p-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={nextTheme}
                      disabled={chartLoading}
                      className="p-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                )}
              </div>

              {activeThemes && activeThemes.length > 0 ? (
                <div className="relative">
                  {chartLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                        <p className="mt-2 text-sm text-gray-500">Memuat chart...</p>
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
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderTree className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada tema program aktif</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Silakan buat tema program terlebih dahulu
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-center py-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Nahdlatul Ulama - PCNU Kota Tangerang. All rights reserved.
            </p>
            <p className="text-xs text-green-600 mt-1 font-medium">
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