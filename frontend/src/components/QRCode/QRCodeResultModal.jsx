// src/components/QRCode/QRCodeResultModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
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
  ChevronUp
} from 'lucide-react';
import CertificateList from '../../pages/anggotas/certificate/CertificateList';
import { certificateService } from '../../services/certificate';

const QRCodeResultModal = ({ 
  isOpen, 
  onClose, 
  anggota, 
  isLoading,
  error,
  scanResult
}) => {
  const [showCertificates, setShowCertificates] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [certificatesCount, setCertificatesCount] = useState(0);

  // Load certificates when anggota found
  useEffect(() => {
    if (anggota && anggota.id) {
      loadCertificates(anggota.id);
    } else {
      setCertificates([]);
      setCertificatesCount(0);
    }
  }, [anggota]);

  const loadCertificates = async (anggotaId) => {
    setLoadingCertificates(true);
    try {
      const response = await certificateService.getByAnggota(anggotaId);
      if (response.success) {
        const data = response.data || [];
        setCertificates(data);
        setCertificatesCount(data.length);
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
    } finally {
      setLoadingCertificates(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (isActive) => {
    if (isActive) {
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

  const fotoUrl = getFotoUrl(anggota?.foto);

  const toggleCertificates = () => {
    setShowCertificates(!showCertificates);
  };

  // Handler untuk action certificate (download, edit, delete)
  const handleCertificateAction = (action, certificate) => {
    // Untuk QR result, hanya izinkan download
    if (action === 'download') {
      // Download akan ditangani oleh CertificateList
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`relative px-6 py-4 ${
          error ? 'bg-linear-to-r from-red-600 to-red-500' : 
          anggota ? 'bg-linear-to-r from-emerald-600 to-teal-600' : 
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
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
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Tips: Pastikan QR Code berasal dari sistem dan tidak rusak
                    </p>
                  </div>
                )}
              </div>
            ) : anggota ? (
              <div className="space-y-5">
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="relative">
                    {fotoUrl ? (
                      <img 
                        src={fotoUrl} 
                        alt={anggota.nama} 
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
                    <p className="text-xl font-bold text-gray-800">{anggota.nama}</p>
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-1">
                      {anggota.no_anggota && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                          <IdCard className="w-3 h-3" />
                          {anggota.no_anggota}
                        </span>
                      )}
                      {getStatusBadge(anggota.is_active)}
                    </div>
                  </div>
                </div>

                {/* Information Cards */}
                <div className="space-y-3">
                  <DetailRow
                    label="Organisasi"
                    value={anggota.organization?.nama}
                    icon={Building2}
                  />
                  <DetailRow
                    label="Jabatan"
                    value={anggota.jabatan?.nama}
                    icon={Briefcase}
                  />
                  <DetailRow
                    label="No. Telepon"
                    value={anggota.no_hp || '-'}
                    icon={Phone}
                  />
                  <DetailRow
                    label="Alamat"
                    value={anggota.alamat || '-'}
                    icon={MapPin}
                    multiline
                  />
                </div>

                {/* Certificate Section */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={toggleCertificates}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-gray-800">Sertifikat</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {loadingCertificates ? '...' : certificatesCount}
                      </span>
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
                      {loadingCertificates ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Memuat sertifikat...</p>
                        </div>
                      ) : certificates.length > 0 ? (
                        <CertificateList
                          anggotaId={anggota.id}
                          anggotaName={anggota.nama}
                          canManage={false} // Tidak ada edit/delete di QR result
                          onCertificateUpdate={handleCertificateAction}
                        />
                      ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Belum ada sertifikat</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
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
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
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