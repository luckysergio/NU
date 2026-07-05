// src/pages/Dashboard.jsx
import React, { useState } from "react";
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
  
  // State untuk QR Code Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [anggotaResult, setAnggotaResult] = useState(null);
  const [searchingAnggota, setSearchingAnggota] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Ambil role dan level user
  const userRole = user?.role?.slug;
  const userOrgLevel = user?.organization?.level?.slug || user?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdminPC = userRole === "admin" && userOrgLevel === "pc";
  const isAdminMWC = userRole === "admin" && userOrgLevel === "mwc";

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

  const levelKeys = ['pc', 'mwc', 'ranting', 'anak_ranting', 'lembaga', 'banom'];

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

  // Fungsi untuk mencari anggota berdasarkan no_anggota menggunakan service
  const searchAnggotaByNoAnggota = async (noAnggota) => {
    try {
      console.log('🔍 Searching anggota with no_anggota:', noAnggota);
      
      const response = await anggotaService.getAll({ 
        search: noAnggota,
        per_page: 1 
      });
      
      console.log('📡 Response from service:', response);
      
      if (response.success && response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      console.log('🔄 Trying with no_anggota filter...');
      const response2 = await anggotaService.getAll({ 
        no_anggota: noAnggota,
        per_page: 1 
      });
      
      console.log('📡 Response from service (no_anggota filter):', response2);
      
      if (response2.success && response2.data && response2.data.data && response2.data.data.length > 0) {
        return response2.data.data[0];
      }
      
      return null;
    } catch (err) {
      console.error('Error searching anggota:', err);
      throw err;
    }
  };

  // Handler untuk scan QR Code
  const handleScanSuccess = async (decodedText) => {
    console.log('✅ QR Code detected:', decodedText);
    console.log('📝 Type of decodedText:', typeof decodedText);
    console.log('📝 Length:', decodedText?.length);
    
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
      console.error('Error searching anggota:', err);
      setSearchError('Terjadi kesalahan saat mencari data anggota. Silakan coba lagi.');
      setSearchingAnggota(false);
      error('Error', 'Terjadi kesalahan saat mencari data anggota');
    }
  };

  const handleUploadQR = async (decodedText) => {
    console.log('📤 QR Code from upload:', decodedText);
    console.log('📝 Type of decodedText:', typeof decodedText);
    console.log('📝 Length:', decodedText?.length);
    
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
      console.error('Error searching anggota:', err);
      setSearchError('Terjadi kesalahan saat mencari data anggota. Silakan coba lagi.');
      setSearchingAnggota(false);
      error('Error', 'Terjadi kesalahan saat mencari data anggota');
    }
  };

  const handleScanError = (err) => {
    console.error('Scan error:', err);
    error('Error', 'Gagal melakukan scan QR Code. Pastikan QR Code terlihat jelas.');
  };

  const renderRealtimeStatus = () => {
    const statusConfig = {
      connected: {
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        text: 'Terhubung',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      connecting: {
        icon: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
        text: 'Menghubungkan...',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      },
      disconnected: {
        icon: <WifiOff className="w-4 h-4 text-gray-500" />,
        text: 'Terputus',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
      },
      error: {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        text: 'Error koneksi',
        className: 'bg-red-50 text-red-700 border-red-200',
      },
    };

    const status = statusConfig[connectionStatus] || statusConfig.disconnected;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.className}`}>
        {status.icon}
        <span className="text-xs font-medium">{status.text}</span>
        {isRealtimeEnabled && connectionStatus === 'connected' && (
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-1"></span>
        )}
      </span>
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
            <h3 className="text-xl font-semibold text-gray-700">
              Tidak ada data
            </h3>
            <p className="text-gray-500 mt-2">
              Belum ada data untuk ditampilkan
            </p>
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

  const activeThemes = programs || [];
  const totalActiveActivities = activeThemes.reduce(
    (sum, p) => sum + (p.total_kegiatan || 0),
    0
  );
  const totalActivePrograms = activeThemes.length;
  const currentTheme = activeThemes?.[selectedThemeIndex] || null;

  // Hitung total program kerja aktif
  const totalWorkPrograms = dashboardData.total_work_programs || 0;

  // Stat cards - SEMUA ROLE MENAMPILKAN DATA YANG SAMA
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

    // Untuk Admin MWC: tampilkan "Program Kerja Aktif" bukan "Tema Program Aktif"
    if (isAdminMWC) {
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
        value: totalActivePrograms.toString(),
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

  // Tentukan judul struktur organisasi - SEMUA ROLE MENAMPILKAN PCNU KOTA TANGERANG
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
            
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-green-200" />
                  <h1 className="text-2xl font-bold">
                    Selamat Datang, {user?.name || "Administrator"}!
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-green-100 flex-wrap">
                  <span>Selamat datang di Sistem Manajemen Organisasi Nahdlatul Ulama</span>
                  <span className="hidden sm:inline text-green-300">•</span>
                  <span className="text-sm bg-green-600/30 px-3 py-1 rounded-full">
                    PCNU Kota Tangerang
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-green-200">
                  <Globe className="w-4 h-4" />
                  <span>Nahdlatul Ulama • Rahmatan Lil Alamin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - SEMUA ROLE MENAMPILKAN DATA YANG SAMA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.clickable ? stat.onClick : undefined}
                  className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border-l-4 ${stat.borderColor} ${stat.clickable ? 'hover:-translate-y-1 cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  {stat.clickable && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <QrCode className="w-3 h-3" />
                      <span>Klik untuk scan QR Code</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Organization Structure - SEMUA ROLE MENAMPILKAN DATA YANG SAMA */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {getStructureTitle()}
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                <Building className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium text-green-700">
                  Total: {totalOrganizations.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {visibleLevels.map((key) => {
                const count = getLevelCount(key);
                const Icon = levelIcons[key];
                return (
                  <div
                    key={key}
                    className={`${levelColors[key]} rounded-xl p-4 text-center text-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-default`}
                  >
                    <div className="flex justify-center mb-2 opacity-90">
                      {Icon}
                    </div>
                    <p className="font-semibold text-xs opacity-90">{levelLabels[key]}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Section - HANYA untuk Super Admin dan Admin PC */}
          {showChart && (
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Chart Program Kerja per Tema Aktif
                  </h2>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {totalActivePrograms} Tema
                  </span>
                </div>
                {activeThemes && activeThemes.length > 1 && (
                  <div className="flex items-center gap-2">
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

          {/* Footer */}
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

      {/* QR Code Scanner Modal */}
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

      {/* QR Code Result Modal */}
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