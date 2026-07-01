// src/pages/dashboard/Dashboard.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../contexts/ModalContext";
import MainLayout from "../components/layout/MainLayout";
import {
  useDashboard,
  useRefreshDashboard,
  useThemeChart,
  useRefreshThemeChart,
} from "../hooks/useDashboard";
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
  Briefcase,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";

// Level configuration
const LEVEL_CONFIG = {
  mwc: { label: "MWC", icon: Library, color: "bg-emerald-600" },
  ranting: { label: "Ranting", icon: Store, color: "bg-green-600" },
  anak_ranting: { label: "Anak Ranting", icon: Home, color: "bg-emerald-500" },
  lembaga: { label: "Lembaga", icon: Banknote, color: "bg-green-500" },
  banom: { label: "Banom", icon: Users, color: "bg-teal-600" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error, success } = useModal();
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Hooks
  const { 
    data: dashboardData, 
    isLoading, 
    refetch,
    isConnected,
    eventCount,
  } = useDashboard();
  
  const refreshMutation = useRefreshDashboard();
  const [currentThemeId, setCurrentThemeId] = useState(null);
  const { data: chartData, isLoading: chartLoading } = useThemeChart(currentThemeId);
  const refreshChartMutation = useRefreshThemeChart();

  // Get active themes
  const activeThemes = dashboardData?.programs || [];
  const totalActivePrograms = activeThemes.length;
  const totalActiveActivities = activeThemes.reduce(
    (sum, p) => sum + (p.total_kegiatan || 0),
    0
  );

  // Set current theme id when data loaded
  useEffect(() => {
    if (activeThemes.length > 0 && !currentThemeId) {
      setCurrentThemeId(activeThemes[0]?.theme_id);
    }
  }, [activeThemes, currentThemeId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard...');
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Navigation
  const nextTheme = useCallback(() => {
    if (activeThemes.length > 0) {
      const newIndex = (selectedThemeIndex + 1) % activeThemes.length;
      setSelectedThemeIndex(newIndex);
      setCurrentThemeId(activeThemes[newIndex]?.theme_id);
    }
  }, [activeThemes, selectedThemeIndex]);

  const prevTheme = useCallback(() => {
    if (activeThemes.length > 0) {
      const newIndex = (selectedThemeIndex - 1 + activeThemes.length) % activeThemes.length;
      setSelectedThemeIndex(newIndex);
      setCurrentThemeId(activeThemes[newIndex]?.theme_id);
    }
  }, [activeThemes, selectedThemeIndex]);

  // Refresh handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshMutation.mutateAsync();
      success("Berhasil", "Dashboard berhasil di-refresh");
    } catch (err) {
      error("Error", err.message || "Gagal refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshMutation, success, error]);

  const handleRefreshChart = useCallback(async () => {
    if (!currentThemeId) return;
    try {
      await refreshChartMutation.mutateAsync(currentThemeId);
      success("Berhasil", "Chart berhasil di-refresh");
    } catch (err) {
      error("Error", err.message || "Gagal refresh chart");
    }
  }, [currentThemeId, refreshChartMutation, success, error]);

  // Stats
  const { organizations, members } = dashboardData || {};

  const stats = [
    {
      title: "Total Organisasi",
      value: organizations?.total?.toLocaleString() || "0",
      icon: Building2,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-500",
    },
    {
      title: "Total Anggota Aktif",
      value: members?.total?.toLocaleString() || "0",
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

  const currentTheme = activeThemes[selectedThemeIndex] || null;

  // Loading
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
              <p className="text-green-100">
                Selamat datang di Sistem Manajemen Organisasi Nahdlatul Ulama
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-green-200">
                <Globe className="w-4 h-4" />
                <span>Nahdlatul Ulama • Rahmatan Lil Alamin</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                isConnected ? 'bg-white/20' : 'bg-red-500/30'
              }`}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
                <span className="text-xs text-white">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
                {eventCount > 0 && (
                  <span className="text-xs text-green-200">
                    ({eventCount})
                  </span>
                )}
              </div>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-all ${
                  autoRefresh 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-white/60'
                }`}
              >
                Auto {autoRefresh ? '✓' : '✗'}
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || refreshMutation.isPending}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center gap-2 backdrop-blur-sm disabled:opacity-50"
              >
                {isRefreshing || refreshMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

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
                Total: {organizations?.total?.toLocaleString() || 0}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(LEVEL_CONFIG).map(([key, config]) => {
              const count = organizations?.[key] || 0;
              const Icon = config.icon;
              return (
                <div
                  key={key}
                  className={`${config.color} rounded-xl p-4 text-center text-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-default`}
                >
                  <div className="flex justify-center mb-2 opacity-90">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm opacity-90">{config.label}</p>
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
            <div className="flex items-center gap-2">
              {activeThemes.length > 1 && (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedThemeIndex + 1} / {activeThemes.length}
                  </span>
                  <button
                    onClick={prevTheme}
                    disabled={chartLoading}
                    className="p-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={nextTheme}
                    disabled={chartLoading}
                    className="p-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4 text-green-600" />
                  </button>
                </>
              )}
              <button
                onClick={handleRefreshChart}
                disabled={chartLoading}
                className="p-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                title="Refresh chart"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {activeThemes.length > 0 && currentTheme ? (
            <ThemeChart
              themeId={currentTheme.theme_id}
              themeName={currentTheme.theme}
              onClose={() => {}}
            />
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

        {/* Footer Status */}
        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Status: <span className={isConnected ? 'text-green-600 font-medium' : 'text-red-600'}>
              {isConnected ? 'Terhubung Real-time' : 'Terputus'}
            </span></span>
            {eventCount > 0 && (
              <span>Update diterima: {eventCount}</span>
            )}
            <span>Auto-refresh: {autoRefresh ? '✓' : '✗'}</span>
          </div>
          <span>Data selalu fresh • Real-time updates</span>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;