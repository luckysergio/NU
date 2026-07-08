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
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useThemeChart } from '../../hooks/useThemeChart';

// ✅ Green Gradient Palette
const GREEN_THEME_GRADIENTS = [
  { start: '#059669', end: '#047857' },
  { start: '#10B981', end: '#059669' },
  { start: '#047857', end: '#065F46' },
  { start: '#14B8A6', end: '#0D9488' },
  { start: '#22C55E', end: '#16A34A' },
  { start: '#0D9488', end: '#0F766E' },
  { start: '#16A34A', end: '#15803D' },
  { start: '#065F46', end: '#064E3B' },
];

// ✅ Minimal Performance Styles
const performanceStyles = `
  .smooth-scroll {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  .smooth-scroll::-webkit-scrollbar {
    width: 6px;
  }
  
  .smooth-scroll::-webkit-scrollbar-track {
    background: rgba(20, 83, 45, 0.1);
  }
  
  .smooth-scroll::-webkit-scrollbar-thumb {
    background: #10B981;
    border-radius: 3px;
  }
  
  .smooth-scroll::-webkit-scrollbar-thumb:hover {
    background: #059669;
  }
  
  .smooth-scroll {
    scrollbar-width: thin;
    scrollbar-color: #10B981 rgba(20, 83, 45, 0.1);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
`;

const ThemeChart = ({ themeId, themeName, onClose }) => {
  const [expandedMwc, setExpandedMwc] = useState(null);

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

  // ✅ Transform data dengan useMemo
  const { sortedData, stats } = useMemo(() => {
    if (!chartData || !chartData.mwc_data) {
      return { sortedData: [], stats: { total: 0, active: 0, inactive: 0, totalKegiatan: 0 } };
    }

    const mwcData = chartData.mwc_data || [];
    
    const mapped = mwcData.map((item, index) => {
      const colorSet = GREEN_THEME_GRADIENTS[index % GREEN_THEME_GRADIENTS.length];
      return {
        name: item.mwc_name,
        shortName: item.mwc_name.length > 20 
          ? item.mwc_name.substring(0, 20) + '...' 
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
      sortedData: sorted,
      stats: {
        total: totalMwc,
        active: activeMwc,
        inactive: totalMwc - activeMwc,
        totalKegiatan,
      },
    };
  }, [chartData]);

  // ✅ Custom Tooltip - Lightweight
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-green-100 min-w-65 animate-fadeIn">
          <div className="flex items-start gap-3 mb-3 pb-3 border-b border-green-100">
            <div className="p-2 bg-green-600 rounded-lg shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight wrap-break-word">
                {data.fullName}
              </p>
              <p className="text-xs text-green-600 mt-0.5 font-medium">MWC NU</p>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                Jumlah Kegiatan
              </span>
              <span className="text-lg font-bold text-green-600">
                {data.kegiatan}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                Program Kerja
              </span>
              <span className="text-lg font-bold text-teal-600">
                {data.program}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2.5 border-t border-green-100">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                data.hasProgram 
                  ? 'bg-green-500 text-white' 
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
        fill="#059669"
        textAnchor="middle"
        fontSize={12}
        fontWeight="700"
      >
        {value}
      </text>
    );
  };

  // ✅ Loading Skeleton - Lightweight
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-5 bg-green-100 rounded w-48"></div>
              <div className="h-3 bg-green-50 rounded w-36"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-green-100 rounded-lg w-32"></div>
            <div className="h-10 bg-green-100 rounded-lg w-28"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm">
          <div className="h-100 bg-green-50 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
              <p className="text-gray-600 font-medium">Memuat data chart...</p>
              <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error State - Lightweight
  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h3 className="text-red-600 font-bold text-lg mb-2">Gagal Memuat Data</h3>
          <p className="text-red-500 text-sm max-w-md mx-auto">
            {error?.message || 'Terjadi kesalahan saat memuat data'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
          style={{ transition: "background-color 150ms ease-out" }}
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ✅ Empty State - Lightweight
  if (!chartData || !chartData.mwc_data || chartData.mwc_data.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FolderTree className="w-12 h-12 text-green-500" />
        </div>
        <div>
          <h3 className="text-gray-700 font-bold text-lg mb-2">Belum Ada Data</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Belum ada MWC yang terdaftar untuk tema ini. Silakan tambahkan program kerja di MWC terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{performanceStyles}</style>
      
      <div className="space-y-5">
        {/* ✅ Header dengan Stats Cards - Lightweight */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-xl shadow-sm">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                {chartData.theme_name || 'Tema'}
              </h3>
              {chartData.theme_period && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-green-500" />
                  Periode: {chartData.theme_period}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Stats Badges - Lightweight */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 flex-1 sm:flex-none">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Kegiatan: <span className="text-green-600 font-bold">{formatNumber(stats.totalKegiatan)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200 flex-1 sm:flex-none">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                MWC Aktif: <span className="text-teal-600 font-bold">{stats.active}/{stats.total}</span>
              </span>
            </div>

            {isFetching && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-xs font-semibold text-amber-700">Updating...</span>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Chart Container - Lightweight */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-green-100 shadow-sm">
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={sortedData}
                margin={{ top: 30, right: 20, left: 10, bottom: 80 }}
                barCategoryGap="25%"
              >
                <defs>
                  {GREEN_THEME_GRADIENTS.map((color, index) => (
                    <linearGradient key={index} id={`greenGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color.start} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={color.end} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#D1FAE5" 
                  strokeOpacity={0.6}
                  vertical={false}
                />
                
                <XAxis
                  dataKey="shortName"
                  angle={-35}
                  textAnchor="end"
                  height={90}
                  tick={{ fontSize: 11, fill: '#059669', fontWeight: 600 }}
                  axisLine={{ stroke: '#A7F3D0', strokeWidth: 2 }}
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
                      fill: '#059669', 
                      fontWeight: 700,
                      textAnchor: 'middle',
                    },
                    offset: 5,
                  }}
                  tick={{ fontSize: 11, fill: '#059669', fontWeight: 600 }}
                  axisLine={{ stroke: '#A7F3D0', strokeWidth: 2 }}
                  tickLine={false}
                  width={55}
                />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
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
                      fill={`url(#greenGradient-${entry.index % GREEN_THEME_GRADIENTS.length})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ MWC List - Lightweight */}
        {chartData.mwc_data && chartData.mwc_data.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Daftar MWC
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                  {chartData.mwc_data.length} organisasi
                </span>
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {chartData.mwc_data.map((mwc, idx) => {
                const colorSet = GREEN_THEME_GRADIENTS[idx % GREEN_THEME_GRADIENTS.length];
                const isExpanded = expandedMwc === mwc.mwc_id;
                
                return (
                  <div
                    key={mwc.mwc_id}
                    className={`
                      group relative overflow-hidden rounded-xl
                      border-2
                      ${mwc.has_work_program
                        ? 'border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                    style={{ transition: "border-color 200ms ease-out, box-shadow 200ms ease-out" }}
                  >
                    {/* Simple Gradient Top Border */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ 
                        background: mwc.has_work_program 
                          ? `linear-gradient(90deg, ${colorSet.start}, ${colorSet.end})`
                          : '#E5E7EB'
                      }}
                    ></div>

                    <div className="relative p-4 pt-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm leading-tight wrap-break-word">
                            {mwc.mwc_name}
                          </p>
                          <p className="text-xs text-green-600 mt-0.5 font-semibold">MWC NU</p>
                        </div>
                        <span className={`
                          text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0
                          ${mwc.has_work_program
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                          }
                        `}>
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

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2.5 border border-green-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-semibold">
                            <Briefcase className="w-3 h-3 text-green-500" />
                            Program
                          </div>
                          <p className="text-xl font-bold text-gray-800">
                            {mwc.work_program_count || 0}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-green-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-semibold">
                            <Activity className="w-3 h-3 text-teal-500" />
                            Kegiatan
                          </div>
                          <p className="text-xl font-bold text-green-600">
                            {mwc.activities_count || 0}
                          </p>
                        </div>
                      </div>

                      {/* Expandable Work Programs */}
                      {mwc.work_programs && mwc.work_programs.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleMwcExpand(mwc.mwc_id)}
                            className="
                              w-full text-xs text-green-600 hover:text-green-700 
                              flex items-center justify-center gap-1 py-2 
                              rounded-lg hover:bg-green-50
                              font-semibold 
                              border border-green-200 hover:border-green-300
                            "
                            style={{ transition: "background-color 150ms ease-out, border-color 150ms ease-out" }}
                          >
                            {isExpanded ? (
                              <>Sembunyikan Program <ChevronUp className="w-3.5 h-3.5" /></>
                            ) : (
                              <>Lihat {mwc.work_programs.length} Program <ChevronDown className="w-3.5 h-3.5" /></>
                            )}
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto smooth-scroll pr-1">
                              {mwc.work_programs.map((wp) => (
                                <div 
                                  key={wp.id} 
                                  className="
                                    text-xs text-gray-700 flex items-center gap-2 
                                    py-2 px-2.5 rounded-lg 
                                    bg-green-50
                                    border border-green-100
                                  "
                                >
                                  <Briefcase className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <span className="truncate flex-1 font-medium">{wp.nama_program}</span>
                                  <span className="text-xs font-bold text-green-600 bg-white px-1.5 py-0.5 rounded-full shrink-0">
                                    {wp.activities_count || 0}
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
    </>
  );
};

export default ThemeChart;