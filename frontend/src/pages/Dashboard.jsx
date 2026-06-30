import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useModal } from "../contexts/ModalContext";
import MainLayout from "../components/layout/MainLayout";
import dashboardService from "../services/dashboardService";
import LoadingSpinner from "../components/common/LoadingSpinner";
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
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useModal();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const result = await dashboardService.getDashboard();
    
    if (result.success) {
      setDashboardData(result.data);
    } else {
      error("Error", result.message || "Gagal mengambil data dashboard");
    }
    
    setLoading(false);
  };

  // Level labels dan icons - HAPUS PC
  const levelLabels = {
    mwc: "MWC",
    ranting: "Ranting",
    anak_ranting: "Anak Ranting",
    lembaga: "Lembaga",
    banom: "Banom",
  };

  const levelIcons = {
    mwc: <Library className="w-5 h-5" />,
    ranting: <Store className="w-5 h-5" />,
    anak_ranting: <Home className="w-5 h-5" />,
    lembaga: <Banknote className="w-5 h-5" />,
    banom: <Users className="w-5 h-5" />,
  };

  // Warna hijau dari halaman login
  const levelColors = {
    mwc: "bg-emerald-600",
    ranting: "bg-green-600",
    anak_ranting: "bg-emerald-500",
    lembaga: "bg-green-500",
    banom: "bg-teal-600",
  };

  // Navigasi chart
  const nextTheme = () => {
    if (activeThemes && activeThemes.length > 0) {
      setSelectedThemeIndex((prev) => (prev + 1) % activeThemes.length);
    }
  };

  const prevTheme = () => {
    if (activeThemes && activeThemes.length > 0) {
      setSelectedThemeIndex((prev) => (prev - 1 + activeThemes.length) % activeThemes.length);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="large" />
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
              onClick={fetchDashboard}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { organizations, members, programs } = dashboardData;

  // ============ PERBAIKAN: SEMUA TEMA AKTIF ============
  // Ambil semua tema yang aktif (dari backend sudah filter is_active = true)
  // Tidak perlu filter total_program > 0
  const activeThemes = programs || [];
  
  // Total kegiatan dari semua tema aktif
  const totalActiveActivities = activeThemes.reduce(
    (sum, p) => sum + (p.total_kegiatan || 0),
    0
  );

  // Total program dari semua tema aktif
  const totalActivePrograms = activeThemes.length;

  // Current theme untuk chart
  const currentTheme = activeThemes?.[selectedThemeIndex] || null;

  // Statistik cards
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
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Refresh
            </button>
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

        {/* Organization Structure - PCNU Kota Tangerang */}
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
            {Object.keys(levelLabels).map((key) => {
              const count = organizations?.[key] || 0;
              const Icon = levelIcons[key];
              return (
                <div
                  key={key}
                  className={`${levelColors[key]} rounded-xl p-4 text-center text-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-default`}
                >
                  <div className="flex justify-center mb-2 opacity-90">
                    {Icon}
                  </div>
                  <p className="font-semibold text-sm opacity-90">{levelLabels[key]}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Section - Semua Tema Aktif */}
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
                  className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={nextTheme}
                  className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-green-600" />
                </button>
              </div>
            )}
          </div>

          {activeThemes && activeThemes.length > 0 ? (
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