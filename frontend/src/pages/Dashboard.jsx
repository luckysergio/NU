import React from "react";
import { useAuth } from "../hooks/useAuth";
import MainLayout from "../components/layout/MainLayout";
import {
  Building2,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Globe,
  Heart,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  // Statistik cards data
  const stats = [
    {
      title: "Total Organisasi",
      value: "156",
      icon: Building2,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
    },
    {
      title: "Total Anggota",
      value: "12,845",
      icon: Users,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Kegiatan Aktif",
      value: "48",
      icon: Calendar,
      bgColor: "bg-teal-100",
      textColor: "text-teal-600",
    },
    {
      title: "Program Unggulan",
      value: "24",
      icon: Award,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
    },
  ];

  // Quick actions data
  const quickActions = [
    {
      title: "Manajemen Organisasi",
      description: "Kelola data organisasi NU",
      icon: Building2,
      path: "/organizations",
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      title: "Manajemen Pengurus",
      description: "Kelola data pengurus",
      icon: Users,
      path: "/members",
      color: "bg-green-50 text-green-600 hover:bg-green-100",
    },
    {
      title: "Laporan Kegiatan",
      description: "Lihat laporan kegiatan",
      icon: FileText,
      path: "/reports",
      color: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    },
    {
      title: "Program NU",
      description: "Kelola program unggulan",
      icon: Heart,
      path: "/programs",
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      title: "Organisasi baru terdaftar",
      description: "PCNU Kota Tangerang telah terdaftar",
      time: "5 menit yang lalu",
      icon: Building2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: 2,
      title: "Pengurus baru ditambahkan",
      description: "KH. Ahmad Zaki ditambahkan sebagai Ketua",
      time: "1 jam yang lalu",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: 3,
      title: "Kegiatan NU Care",
      description: "Bakti sosial di 3 kecamatan",
      time: "3 jam yang lalu",
      icon: Heart,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      id: 4,
      title: "Program unggulan",
      description: "Pesantren Ramadan 2025 dimulai",
      time: "5 jam yang lalu",
      icon: Award,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-linear-to-r from-emerald-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-center">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-center">
                Selamat Datang, {user?.name || "Administrator"}!
              </h1>
              <p className="text-emerald-100 text-center">
                Selamat datang di Sistem Manajemen Organisasi Nahdatul Ulama
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-200">
                <Globe className="w-4 h-4" />
                <span>Nahdatul Ulama • Rahmatan Lil Alamin</span>
              </div>
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
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border-l-4 border-emerald-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% dari bulan lalu</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              Akses Cepat
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => console.log("Navigate to:", action.path)}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all ${action.color}`}
                  >
                    <Icon className="w-5 h-5 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              Aktivitas Terbaru
            </h2>
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`${activity.bgColor} p-2 rounded-full`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.description}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Organization Structure Preview */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
            Struktur Organisasi NU
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">PBNU</h3>
              </div>
              <p className="text-xs text-gray-500">
                Pengurus Besar Nahdatul Ulama
              </p>
              <p className="text-sm text-gray-700 mt-2">1 Organisasi</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">PWNU</h3>
              </div>
              <p className="text-xs text-gray-500">
                Pengurus Wilayah Nahdatul Ulama
              </p>
              <p className="text-sm text-gray-700 mt-2">34 Organisasi</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-gray-800">PCNU</h3>
              </div>
              <p className="text-xs text-gray-500">
                Pengurus Cabang Nahdatul Ulama
              </p>
              <p className="text-sm text-gray-700 mt-2">514+ Organisasi</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Nahdatul Ulama. All rights
            reserved.
          </p>
          <p className="text-xs text-emerald-600 mt-1">"Rahmatan Lil Alamin"</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;