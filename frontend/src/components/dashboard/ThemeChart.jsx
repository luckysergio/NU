// src/components/dashboard/ThemeChart.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useThemeChart, useThemeStatistics } from '../../hooks/useDashboard';

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#047857', '#065F46', '#0B5E42'];

const ThemeChart = ({ themeId, themeName, onClose }) => {
  const [expandedMwc, setExpandedMwc] = useState(null);
  
  // Use hooks
  const { data: chartData, isLoading: chartLoading, error: chartError } = useThemeChart(themeId);
  const { data: statisticsData, isLoading: statsLoading } = useThemeStatistics(themeId);

  const toggleMwcExpand = (mwcId) => {
    setExpandedMwc(expandedMwc === mwcId ? null : mwcId);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  // Loading state
  if (chartLoading || statsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FolderTree className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 font-medium">Memuat data chart...</p>
        <p className="text-sm text-gray-400">Mohon tunggu sebentar</p>
      </div>
    );
  }

  // Error state
  if (chartError) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-500 font-medium">{chartError.message || 'Gagal memuat data'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // No data state
  if (!chartData || chartData.mwc_data?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderTree className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">Belum ada data untuk tema ini</p>
        <p className="text-sm text-gray-400 mt-1">Belum ada MWC yang terdaftar</p>
      </div>
    );
  }

  // Prepare chart data
  const chartDataMapped = chartData.mwc_data.map((item, index) => ({
    name: item.mwc_name.length > 12 ? item.mwc_name.substring(0, 12) + '...' : item.mwc_name,
    fullName: item.mwc_name,
    kegiatan: item.activities_count || 0,
    hasProgram: item.has_work_program || false,
    mwc_id: item.mwc_id,
    work_programs: item.work_programs || [],
    color: COLORS[index % COLORS.length],
  }));

  const sortedData = [...chartDataMapped].sort((a, b) => b.kegiatan - a.kegiatan);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 min-w-64">
          <p className="font-bold text-gray-800 text-base mb-3 border-b border-gray-100 pb-2">
            {data.fullName}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                Jumlah Kegiatan
              </span>
              <span className="text-sm font-bold text-emerald-600">{data.kegiatan}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Status Program</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                data.hasProgram ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {data.hasProgram ? '✅ Ada Program' : '❌ Belum Ada Program'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <FolderTree className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{chartData.theme_name}</h3>
              {chartData.theme_period && (
                <p className="text-sm text-gray-500">Periode: {chartData.theme_period}</p>
              )}
            </div>
          </div>
          {chartData.pc_organization && (
            <p className="text-sm text-gray-500 mt-1 ml-11">
              PC: {chartData.pc_organization.nama}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-gray-700">
              Total Kegiatan: <span className="text-emerald-600 font-bold">{formatNumber(chartData.total_activities)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">
              Total MWC: <span className="text-blue-600 font-bold">{formatNumber(chartData.total_mwc)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              label={{
                value: 'Jumlah Kegiatan',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#6B7280', fontWeight: 500 },
              }}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
            <Bar
              dataKey="kegiatan"
              name="Jumlah Kegiatan"
              radius={[8, 8, 0, 0]}
              barSize={50}
              label={{
                position: 'top',
                formatter: (value) => value > 0 ? value : '',
                style: { fontSize: 11, fontWeight: 600, fill: '#374151' },
              }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics from backend */}
      {statisticsData && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Statistik MWC
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statisticsData.mwc_status?.map((mwc, index) => (
              <div
                key={mwc.mwc_id}
                className={`p-4 rounded-xl border ${
                  mwc.has_work_program
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{mwc.mwc_name}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    mwc.has_work_program
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {mwc.has_work_program ? '✅ Aktif' : '⏳ Belum'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>Program: {mwc.work_program_count}</span>
                  <span>Kegiatan: {mwc.activities_count}</span>
                </div>
                {mwc.work_programs?.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleMwcExpand(mwc.mwc_id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      {expandedMwc === mwc.mwc_id ? (
                        <>Sembunyikan <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Lihat Program <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                    {expandedMwc === mwc.mwc_id && (
                      <div className="mt-2 space-y-1">
                        {mwc.work_programs.map((wp) => (
                          <div key={wp.id} className="text-xs text-gray-600 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-gray-400" />
                            <span>{wp.nama_program}</span>
                            <span className="text-gray-400">•</span>
                            <span>{wp.activities_count} kegiatan</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeChart;