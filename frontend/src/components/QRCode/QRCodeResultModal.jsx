import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Briefcase, 
  Phone, 
  MapPin, 
  IdCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  QrCode, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Calendar
} from 'lucide-react';
import CertificateList from '../../pages/anggotas/certificate/CertificateList';

const QRCodeResultModal = ({ 
  isOpen, 
  onClose, 
  anggota, 
  isLoading,
  error,
  scanResult
}) => {
  const [showCertificates, setShowCertificates] = useState(false);

  if (!isOpen) return null;

  // ✅ Normalisasi Data: Menangani baik objek Anggota tunggal maupun Biodata dengan array 'keanggotaan'
  const biodata = anggota?.biodata || anggota;
  
  // ✅ PERBAIKAN: Status aktif diambil dari biodata, bukan dari anggota
  const isActive = biodata?.is_active ?? true;

  const memberships = anggota?.keanggotaan || (anggota?.organization ? [{
    id: anggota.id,
    organization: anggota.organization,
    jabatan: anggota.jabatan,
    is_active: isActive // Gunakan status aktif dari biodata
  }] : []);

  const biodataId = biodata?.id;

  const getStatusBadge = (isActiveStatus) => {
    if (isActiveStatus) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="w-3 h-3" />
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3" />
        Tidak Aktif
      </span>
    );
  };

  const getFotoUrl = (foto) => {
    if (!foto) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    const baseUrl = import.meta.env.VITE_STORAGE_URL || 
                    import.meta.env.VITE_API_URL?.replace('/api', '') || 
                    'http://localhost:8000';
    return `${baseUrl}/storage/${foto}`;
  };

  const fotoUrl = getFotoUrl(biodata?.foto);

  const toggleCertificates = () => {
    setShowCertificates(!showCertificates);
  };

  const handleCertificateAction = () => {
    // Mode baca-saja untuk hasil scan QR
  };

  const formatTTL = () => {
    if (!biodata.tempat_lahir && !biodata.tanggal_lahir) return null;
    const tempat = biodata.tempat_lahir || '';
    const tanggal = biodata.tanggal_lahir 
      ? new Date(biodata.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '';
    return [tempat, tanggal].filter(Boolean).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className={`relative px-6 py-4 shrink-0 ${
          error ? 'bg-linear-to-r from-red-600 to-red-500' : 
          biodata ? 'bg-linear-to-r from-emerald-600 to-teal-600' : 
          'bg-linear-to-r from-gray-600 to-gray-500'
        }`}>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">
                {error ? 'QR Code Tidak Valid' : 'Hasil Scan QR Code'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-xs mt-1 ml-10">
            {error ? error : 'Informasi anggota berdasarkan QR Code'}
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Mencari data anggota...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">{error}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Pastikan QR Code yang Anda scan adalah milik anggota yang terdaftar
                </p>
                {scanResult && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400">
                      🔍 Hasil scan: <span className="font-mono text-gray-600">{scanResult}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : biodata ? (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="relative">
                    {fotoUrl ? (
                      <img 
                        src={fotoUrl} 
                        alt={biodata.nama} 
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          const fallback = document.createElement('div');
                          fallback.className = 'w-24 h-24 bg-linear-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center shadow-md';
                          fallback.innerHTML = '<svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
                          parent.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-linear-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center shadow-md">
                        <User className="w-10 h-10 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <p className="text-xl font-bold text-gray-800">{biodata.nama}</p>
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-2">
                      {biodata.no_anggota && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                          <IdCard className="w-3 h-3" />
                          {biodata.no_anggota}
                        </span>
                      )}
                      {/* ✅ PERBAIKAN: Menggunakan status dari biodata */}
                      {getStatusBadge(isActive)}
                    </div>
                  </div>
                </div>

                {/* ✅ Daftar Keanggotaan (Bisa lebih dari satu) */}
                {memberships.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Daftar Keanggotaan
                    </h4>
                    <div className="space-y-2">
                      {memberships.map((member, idx) => (
                        <div key={member.id || idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {member.organization?.nama || 'Organisasi Tidak Diketahui'}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {member.jabatan?.nama || 'Tidak ada jabatan'}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {/* ✅ PERBAIKAN: Menampilkan status aktif dari biodata */}
                            {getStatusBadge(isActive)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informasi Pribadi (Biodata) */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Informasi Pribadi
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailRow
                      label="No. Telepon"
                      value={biodata.no_hp || '-'}
                      icon={Phone}
                    />
                    {formatTTL() && (
                      <DetailRow
                        label="Tempat, Tanggal Lahir"
                        value={formatTTL()}
                        icon={Calendar}
                      />
                    )}
                  </div>
                  <DetailRow
                    label="Alamat"
                    value={biodata.alamat || '-'}
                    icon={MapPin}
                    multiline
                  />
                </div>

                {/* Certificate Section */}
                {biodataId && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={toggleCertificates}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-800">Sertifikat</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-xs">
                          {showCertificates ? 'Sembunyikan' : 'Lihat Semua'}
                        </span>
                        {showCertificates ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {showCertificates && (
                      <div className="mt-4">
                        <CertificateList
                          biodataId={biodataId}
                          biodataName={biodata.nama}
                          canManage={false}
                          onCertificateUpdate={handleCertificateAction}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Data tidak ditemukan</p>
                <p className="text-sm text-gray-400 mt-1">
                  QR Code yang di-scan tidak terdaftar dalam sistem
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, icon: Icon, multiline }) => (
  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
        {Icon && <Icon className="w-3 h-3 text-emerald-600" />}
      </div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    {multiline ? (
      <p className="text-sm text-gray-800 leading-relaxed">{value || "-"}</p>
    ) : (
      <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
    )}
  </div>
);

export default QRCodeResultModal;