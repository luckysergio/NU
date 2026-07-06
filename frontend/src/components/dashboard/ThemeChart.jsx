// src/components/dashboard/ThemeChart.jsx
import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  ChevronDown,
  ChevronUp,
  FolderTree,
  Building2,
  Briefcase,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useThemeChart } from '../../hooks/useThemeChart';

// ✅ Gradient Colors Modern dengan opacity
const GRADIENT_COLORS = [
  { start: '#10B981', end: '#059669' }, // Emerald
  { start: '#3B82F6', end: '#2563EB' }, // Blue
  { start: '#8B5CF6', end: '#7C3AED' }, // Purple
  { start: '#F59E0B', end: '#D97706' }, // Amber
  { start: '#EC4899', end: '#DB2777' }, // Pink
  { start: '#06B6D4', end: '#0891B2' }, // Cyan
  { start: '#EF4444', end: '#DC2626' }, // Red
  { start: '#84CC16', end: '#65A30D' }, // Lime
];

const ThemeChart = ({ themeId, themeName, onClose }) => {
  const [expandedMwc, setExpandedMwc] = useState(null);
  const [chartType, setChartType] = useState('vertical'); // 'vertical' | 'horizontal'

  // ✅ Gunakan hook realtime
  const {
    data: chartData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useThemeChart(themeId);

  const toggleMwcExpand = (mwcId) => {
    setExpandedMwc(expandedMwc === mwcId ? null : mwcId);
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // ✅ Transform data dengan useMemo untuk performa
  const { chartDataMapped, sortedData, stats } = useMemo(() => {
    if (!chartData || !chartData.mwc_data) {
      return { chartDataMapped: [], sortedData: [], stats: { total: 0, active: 0, inactive: 0 } };
    }

    const mwcData = chartData.mwc_data || [];
    
    const mapped = mwcData.map((item, index) => {
      const colorSet = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
      return {
        name: item.mwc_name,
        shortName: item.mwc_name.length > 18 
          ? item.mwc_name.substring(0, 18) + '...' 
          : item.mwc_name,
        fullName: item.mwc_name,
        kegiatan: item.activities_count || 0,
        program: item.work_program_count || 0,
        hasProgram: item.has_work_program || false,
        mwc_id: item.mwc_id,
        work_programs: item.work_programs || [],
        color: colorSet.start,
        gradientEnd: colorSet.end,
        index,
      };
    });

    const sorted = [...mapped].sort((a, b) => b.kegiatan - a.kegiatan);
    
    const totalMwc = mwcData.length;
    const activeMwc = mwcData.filter(m => m.has_work_program).length;
    const totalKegiatan = mwcData.reduce((sum, m) => sum + (m.activities_count || 0), 0);

    return {
      chartDataMapped: mapped,
      sortedData: sorted,
      stats: {
        total: totalMwc,
        active: activeMwc,
        inactive: totalMwc - activeMwc,
        totalKegiatan,
      },
    };
  }, [chartData]);

  // ✅ Custom Tooltip Modern
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-100 min-w-72 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100">
            <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight wrap-break-word">
                {data.fullName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">MWC NU</p>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                Jumlah Kegiatan
              </span>
              <span className="text-base font-bold text-emerald-600">{data.kegiatan}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                Program Kerja
              </span>
              <span className="text-base font-bold text-blue-600">{data.program}</span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                data.hasProgram 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {data.hasProgram ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Aktif
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Belum Ada
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // ✅ Custom Label untuk Bar
  const CustomBarLabel = ({ x, y, width, value }) => {
    if (value === 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#374151"
        textAnchor="middle"
        fontSize={12}
        fontWeight="600"
        className="animate-in fade-in duration-300"
      >
        {value}
      </text>
    );
  };

  // ✅ Loading Skeleton Modern
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="h-96 bg-linear-to-b from-gray-100 to-gray-50 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <p className="text-gray-500 font-medium">Memuat data chart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error State Modern
  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <p className="text-red-600 font-semibold text-lg">Gagal Memuat Data</p>
          <p className="text-red-500 text-sm mt-1">{error?.message || 'Terjadi kesalahan'}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ✅ Empty State Modern
  if (!chartData || !chartData.mwc_data || chartData.mwc_data.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
          <FolderTree className="w-12 h-12 text-gray-400" />
        </div>
        <div>
          <p className="text-gray-700 font-semibold text-lg">Belum Ada Data</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Belum ada MWC yang terdaftar untuk tema ini. Silakan tambahkan program kerja di MWC terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ✅ Header dengan Stats Cards */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
            <FolderTree className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
              {chartData.theme_name || 'Tema'}
            </h3>
            {chartData.theme_period && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Periode: {chartData.theme_period}
              </p>
            )}
          </div>
        </div>

        {/* ✅ Stats Badges */}
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 flex-1 sm:flex-none">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Kegiatan: <span className="text-emerald-600 font-bold">{formatNumber(stats.totalKegiatan)}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex-1 sm:flex-none">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              MWC: <span className="text-blue-600 font-bold">{stats.active}/{stats.total}</span>
            </span>
          </div>

          {/* ✅ Realtime Indicator */}
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span className="text-xs font-medium text-amber-700">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Chart Container dengan Gradient Background */}
      <div className="bg-linear-to-br from-white via-gray-50 to-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-blue-100/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={sortedData}
              margin={{ top: 30, right: 20, left: 10, bottom: 80 }}
              barCategoryGap="20%"
            >
              <defs>
                {GRADIENT_COLORS.map((color, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.start} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color.end} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                strokeOpacity={0.4}
                vertical={false}
              />
              
              <XAxis
                dataKey="shortName"
                angle={-30}
                textAnchor="end"
                height={90}
                tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                interval={0}
              />
              
              <YAxis
                label={{
                  value: 'Jumlah Kegiatan',
                  angle: -90,
                  position: 'insideLeft',
                  style: { 
                    fontSize: 12, 
                    fill: '#6B7280', 
                    fontWeight: 600,
                    textAnchor: 'middle',
                  },
                  offset: 0,
                }}
                tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                width={50}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                wrapperStyle={{ outline: 'none' }}
              />
              
              <Bar
                dataKey="kegiatan"
                name="Jumlah Kegiatan"
                radius={[12, 12, 0, 0]}
                barSize={45}
                label={<CustomBarLabel />}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${entry.index % GRADIENT_COLORS.length})`}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ MWC List Modern */}
      {chartData.mwc_data && chartData.mwc_data.length > 0 && (
        <div className="bg-linear-to-br from-gray-50 to-white rounded-3xl p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Daftar MWC
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {chartData.mwc_data.length} organisasi
              </span>
            </h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {chartData.mwc_data.map((mwc, idx) => {
              const colorSet = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
              const isExpanded = expandedMwc === mwc.mwc_id;
              
              return (
                <div
                  key={mwc.mwc_id}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    mwc.has_work_program
                      ? 'border-emerald-200 bg-linear-to-br from-emerald-50 to-white hover:border-emerald-300'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Status Indicator */}
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                    style={{ background: `radial-gradient(circle, ${colorSet.start} 0%, transparent 70%)` }}
                  ></div>

                  <div className="relative">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight wrap-break-word">
                          {mwc.mwc_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">MWC NU</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        mwc.has_work_program
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {mwc.has_work_program ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Belum
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <Briefcase className="w-3 h-3" />
                          Program
                        </div>
                        <p className="text-lg font-bold text-gray-800">{mwc.work_program_count || 0}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <Activity className="w-3 h-3" />
                          Kegiatan
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{mwc.activities_count || 0}</p>
                      </div>
                    </div>

                    {mwc.work_programs && mwc.work_programs.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleMwcExpand(mwc.mwc_id)}
                          className="w-full text-xs text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-emerald-50 transition-all font-medium"
                        >
                          {isExpanded ? (
                            <>Sembunyikan Program <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Lihat {mwc.work_programs.length} Program <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto animate-in slide-in-from-top duration-200">
                            {mwc.work_programs.map((wp) => (
                              <div 
                                key={wp.id} 
                                className="text-xs text-gray-700 flex items-center gap-2 py-2 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate flex-1 font-medium">{wp.nama_program}</span>
                                <span className="text-gray-400 shrink-0">
                                  {wp.activities_count || 0} kegiatan
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeChart;