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

// ✅ Green Gradient Palette - Modern & Professional
const GREEN_GRADIENTS = [
  { start: '#10B981', end: '#059669' },   // Emerald
  { start: '#14B8A6', end: '#0D9488' },   // Teal
  { start: '#22C55E', end: '#16A34A' },   // Green
  { start: '#84CC16', end: '#65A30D' },   // Lime
  { start: '#34D399', end: '#10B981' },   // Mint
  { start: '#059669', end: '#047857' },   // Dark Emerald
  { start: '#0D9488', end: '#0F766E' },   // Dark Teal
  { start: '#16A34A', end: '#15803D' },   // Dark Green
];

// ✅ CSS untuk smooth scroll & hardware acceleration
const performanceStyles = `
  .gpu-accelerated {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }
  
  .smooth-scroll {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  .smooth-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .smooth-scroll::-webkit-scrollbar-track {
    background: #ECFDF5;
    border-radius: 10px;
  }
  
  .smooth-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #10B981, #059669);
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  
  .smooth-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #059669, #047857);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .gpu-accelerated,
    .smooth-scroll {
      transition: none !important;
      animation: none !important;
    }
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
      const colorSet = GREEN_GRADIENTS[index % GREEN_GRADIENTS.length];
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

  // ✅ Custom Tooltip - Lightweight Design (tanpa backdrop-blur)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border border-emerald-100 min-w-65">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3 pb-3 border-b border-emerald-100">
            <div className="p-2 bg-emerald-500 rounded-lg shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight wrap-break-word">
                {data.fullName}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5 font-medium">MWC NU</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                Jumlah Kegiatan
              </span>
              <span className="text-lg font-bold text-emerald-600">{data.kegiatan}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                Program Kerja
              </span>
              <span className="text-lg font-bold text-teal-600">{data.program}</span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
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
      <div className="space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-100 rounded w-36"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-100 rounded-lg w-32"></div>
            <div className="h-10 bg-gray-100 rounded-lg w-28"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="h-96 bg-linear-to-b from-emerald-50/50 to-gray-50 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Memuat data chart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (isError) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <p className="text-red-600 font-bold text-lg">Gagal Memuat Data</p>
          <p className="text-red-500 text-sm mt-1 max-w-md mx-auto">{error?.message || 'Terjadi kesalahan saat memuat data'}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ✅ Empty State
  if (!chartData || !chartData.mwc_data || chartData.mwc_data.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <FolderTree className="w-12 h-12 text-emerald-500" />
        </div>
        <div>
          <p className="text-gray-700 font-bold text-lg">Belum Ada Data</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Belum ada MWC yang terdaftar untuk tema ini. Silakan tambahkan program kerja di MWC terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Inject Performance Styles */}
      <style>{performanceStyles}</style>
      
      <div className="space-y-5">
        {/* ✅ Header dengan Stats Cards */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                {chartData.theme_name || 'Tema'}
              </h3>
              {chartData.theme_period && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Periode: {chartData.theme_period}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Stats Badges */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200 flex-1 sm:flex-none">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Kegiatan: <span className="text-emerald-600 font-bold">{formatNumber(stats.totalKegiatan)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200 flex-1 sm:flex-none">
              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
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

        {/* ✅ Chart Container - SOLID background (NO backdrop-blur) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm gpu-accelerated">
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={sortedData}
                margin={{ top: 30, right: 20, left: 10, bottom: 80 }}
                barCategoryGap="25%"
              >
                <defs>
                  {GREEN_GRADIENTS.map((color, index) => (
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
                      fill={`url(#greenGradient-${entry.index % GREEN_GRADIENTS.length})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ MWC List - Optimized Cards */}
        {chartData.mwc_data && chartData.mwc_data.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm gpu-accelerated">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Daftar MWC
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {chartData.mwc_data.length} organisasi
                </span>
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {chartData.mwc_data.map((mwc, idx) => {
                const colorSet = GREEN_GRADIENTS[idx % GREEN_GRADIENTS.length];
                const isExpanded = expandedMwc === mwc.mwc_id;
                
                return (
                  <div
                    key={mwc.mwc_id}
                    className={`relative p-4 rounded-xl border-2 transition-colors duration-200 gpu-accelerated ${
                      mwc.has_work_program
                        ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Subtle top border accent */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                      style={{ 
                        background: mwc.has_work_program 
                          ? `linear-gradient(90deg, ${colorSet.start}, ${colorSet.end})`
                          : '#E5E7EB'
                      }}
                    ></div>

                    <div className="relative pt-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm leading-tight wrap-break-word">
                            {mwc.mwc_name}
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5 font-semibold">MWC NU</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                          mwc.has_work_program
                            ? 'bg-emerald-500 text-white'
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

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-semibold">
                            <Briefcase className="w-3 h-3 text-emerald-500" />
                            Program
                          </div>
                          <p className="text-xl font-bold text-gray-800">{mwc.work_program_count || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-semibold">
                            <Activity className="w-3 h-3 text-teal-500" />
                            Kegiatan
                          </div>
                          <p className="text-xl font-bold text-emerald-600">
                            {mwc.activities_count || 0}
                          </p>
                        </div>
                      </div>

                      {/* Expandable Work Programs */}
                      {mwc.work_programs && mwc.work_programs.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleMwcExpand(mwc.mwc_id)}
                            className="w-full text-xs text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-semibold border border-emerald-200"
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
                                  className="text-xs text-gray-700 flex items-center gap-2 py-2 px-2.5 rounded-lg bg-emerald-50 border border-emerald-100"
                                >
                                  <Briefcase className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate flex-1 font-medium">{wp.nama_program}</span>
                                  <span className="text-xs font-bold text-emerald-600 bg-white px-1.5 py-0.5 rounded-full shrink-0">
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