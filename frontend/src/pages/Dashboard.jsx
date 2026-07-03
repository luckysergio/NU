import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../contexts/ModalContext";
import { useDashboard } from "../hooks/useDashboard";
import MainLayout from "../components/layout/MainLayout";
import ThemeChart from "../components/dashboard/ThemeChart";
import {
  Building2,
  Users,
  Calendar,
  FolderTree,
  TrendingUp,
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
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useModal();

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

  // Level configuration
  const levelLabels = {
    pc: "PCNU",
    mwc: "MWC",
    ranting: "Ranting",
    'anak-ranting': "Anak Ranting",
    lembaga: "Lembaga",
    banom: "Banom",
  };

  const levelKeys = ['pc', 'mwc', 'ranting', 'anak-ranting', 'lembaga', 'banom'];

  const levelIcons = {
    pc: <Building2 className="w-5 h-5" />,
    mwc: <Library className="w-5 h-5" />,
    ranting: <Store className="w-5 h-5" />,
    'anak-ranting': <Home className="w-5 h-5" />,
    lembaga: <Banknote className="w-5 h-5" />,
    banom: <Users className="w-5 h-5" />,
  };

  const levelColors = {
    pc: "bg-purple-600",
    mwc: "bg-emerald-600",
    ranting: "bg-green-600",
    'anak-ranting': "bg-emerald-500",
    lembaga: "bg-green-500",
    banom: "bg-teal-600",
  };

  // PERBAIKAN: Fungsi getLevelCount - ambil dari dashboardData
  const getLevelCount = (key) => {
    if (!dashboardData) return 0;
    
    // 1. Coba dari totals (data organisasi - paling akurat)
    if (dashboardData.totals && dashboardData.totals[key] !== undefined) {
      return dashboardData.totals[key];
    }
    
    // 2. Coba dari statistics (data organisasi)
    if (dashboardData.statistics && dashboardData.statistics[key] && dashboardData.statistics[key].count !== undefined) {
      return dashboardData.statistics[key].count;
    }
    
    // 3. Coba dari member_statistics (data anggota)
    if (dashboardData.member_statistics && dashboardData.member_statistics[key] && dashboardData.member_statistics[key].count !== undefined) {
      return dashboardData.member_statistics[key].count;
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

  // Loading state
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

  // Error state
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

  // Empty state
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

  // Ambil data langsung dari dashboardData
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

  // Stat cards data
  const stats = [
    {
      title: "Total Organisasi",
      value: totalOrganizations.toLocaleString(),
      icon: Building2,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-500",
    },
    {
      title: "Total Anggota Aktif",
      value: totalMembers.toLocaleString(),
      icon: Users,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-500",
    },
    {
      title: "Tema Program Aktif",
      value: totalActivePrograms.toString(),
      icon: FolderTree,
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      borderColor: "border-purple-500",
    },
    {
      title: "Total Kegiatan Aktif",
      value: totalActiveActivities.toString(),
      icon: Calendar,
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      borderColor: "border-orange-500",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
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
                {renderRealtimeStatus()}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-green-200">
                <Globe className="w-4 h-4" />
                <span>Nahdlatul Ulama • Rahmatan Lil Alamin</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleRealtime}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 backdrop-blur-sm ${
                  isRealtimeEnabled
                    ? 'bg-white/30 hover:bg-white/40'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isRealtimeEnabled ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                {isRealtimeEnabled ? 'Live' : 'Offline'}
              </button>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center gap-2 backdrop-blur-sm"
                disabled={isFetching}
              >
                <TrendingUp className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Status Realtime Banner */}
        {isRealtimeEnabled && connectionStatus === 'connected' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-700">
              <strong>Realtime aktif</strong> — Perubahan data organisasi dan anggota akan muncul secara otomatis.
            </span>
            <button
              onClick={toggleRealtime}
              className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Nonaktifkan
            </button>
          </div>
        )}

        {!isRealtimeEnabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <WifiOff className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Mode offline. Perubahan tidak akan terlihat secara otomatis.
            </span>
            <button
              onClick={toggleRealtime}
              className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Aktifkan Realtime
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border-l-4 ${stat.borderColor} hover:-translate-y-1`}
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
              </div>
            );
          })}
        </div>

        {/* Organization Structure */}
        <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">
                Struktur Organisasi PCNU Kota Tangerang
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
            {levelKeys.map((key) => {
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

        {/* Chart Section */}
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

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Nahdlatul Ulama. All rights reserved.
          </p>
          <p className="text-xs text-green-600 mt-1 font-medium">
            "Rahmatan Lil Alamin"
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;