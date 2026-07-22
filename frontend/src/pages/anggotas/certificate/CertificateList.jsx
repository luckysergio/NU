import React, { useState, useEffect } from 'react';
import { useCertificatesByBiodata, useCertificateCategories } from '../../../hooks/useCertificate';
import { useModal } from '../../../contexts/ModalContext';
import { certificateService } from '../../../services/certificate';
import {
  FileText, Download, Trash2, Edit, Calendar, Clock,
  AlertCircle, CheckCircle, XCircle, File, FolderOpen, Eye, X
} from 'lucide-react';

const CertificateList = ({ 
  biodataId, 
  biodataName,
  canManage = true,
  onCertificateUpdate,
  refreshTrigger 
}) => {
  const { success, error, warning } = useModal();
  const [previewCertificate, setPreviewCertificate] = useState(null);

  // ✅ Menggunakan hook yang sudah diupdate ke biodata
  const { 
    data: certificates = [], 
    isLoading, 
    isError, 
    error: queryError,
    refetch: refetchCertificates
  } = useCertificatesByBiodata(biodataId);

  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useCertificateCategories();

  useEffect(() => {
    if (refreshTrigger) {
      refetchCertificates();
    }
  }, [refreshTrigger, refetchCertificates]);

  const handleDownload = async (certificate) => {
    try {
      await certificateService.download(certificate.id);
      success('Berhasil', 'File sertifikat sedang diunduh');
    } catch (err) {
      error('Gagal', err.message || 'Gagal mengunduh file');
    }
  };

  const handlePreview = (certificate) => {
    setPreviewCertificate(certificate);
  };

  const handleDelete = async (certificate) => {
    warning(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus sertifikat "${certificate.nama}"?`,
      async () => {
        try {
          await certificateService.delete(certificate.id);
          success('Berhasil', 'Sertifikat berhasil dihapus');
          await refetchCertificates();
          if (onCertificateUpdate) onCertificateUpdate();
        } catch (err) {
          error('Gagal', err.message || 'Gagal menghapus sertifikat');
        }
      }
    );
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.nama || 'Tidak diketahui';
  };

  const getStatusBadge = (certificate) => {
    const category = categories.find(c => c.id === certificate.certificate_category_id);
    const isActive = category?.is_active !== false;
    
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="w-3 h-3" />
          Tidak Aktif
        </span>
      );
    }
    
    if (certificate.tanggal_expired) {
      const expiredDate = new Date(certificate.tanggal_expired);
      const now = new Date();
      if (expiredDate < now) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            Kadaluarsa
          </span>
        );
      }
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" />
        Aktif
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700">{queryError?.message || 'Gagal memuat sertifikat'}</p>
        <button onClick={() => refetchCertificates()} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Belum ada sertifikat</p>
        <p className="text-sm text-gray-400 mt-1">
          {canManage ? 'Klik "Upload Sertifikat" untuk menambahkan' : 'Tidak ada sertifikat yang tersedia'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="font-semibold text-gray-800 truncate">{cert.nama}</h4>
                  {getStatusBadge(cert)}
                </div>
                
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <FolderOpen className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Kategori:</span>
                    <span className="font-medium">{getCategoryName(cert.certificate_category_id)}</span>
                  </div>
                  
                  {cert.nomor_sertifikat && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <File className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">No:</span>
                      <span className="font-mono text-sm">{cert.nomor_sertifikat}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Terbit:</span>
                    <span>{formatDate(cert.tanggal_terbit)}</span>
                  </div>
                  
                  {cert.tanggal_expired && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Expired:</span>
                      <span>{formatDate(cert.tanggal_expired)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                <button onClick={() => handlePreview(cert)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110" title="Lihat Sertifikat">
                  <Eye className="w-4 h-4" />
                </button>

                <button onClick={() => handleDownload(cert)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                
                {canManage && (
                  <>
                    <button onClick={() => onCertificateUpdate && onCertificateUpdate('edit', cert)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cert)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewCertificate && (
        <CertificatePreviewModal
          certificate={previewCertificate}
          onClose={() => setPreviewCertificate(null)}
          onDownload={() => handleDownload(previewCertificate)}
        />
      )}
    </>
  );
};

const CertificatePreviewModal = ({ certificate, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (certificate?.file) {
      const url = certificateService.getFileUrl(certificate.file);
      setFileUrl(url);
      setLoading(false);
    }
  }, [certificate]);

  if (!certificate) return null;

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const ext = getFileExtension(certificate.file || '');
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">{certificate.nama}</h3>
              <p className="text-emerald-100 text-sm mt-0.5">
                {certificate.nomor_sertifikat ? `No: ${certificate.nomor_sertifikat}` : 'Preview Sertifikat'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button onClick={() => window.open(fileUrl, '_blank')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                Buka di Tab Baru
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl overflow-hidden">
              {isPdf ? (
                <div className="w-full h-125">
                  <iframe src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`} className="w-full h-full" title={certificate.nama} onError={() => setError('Gagal memuat PDF')} />
                </div>
              ) : isImage ? (
                <div className="flex items-center justify-center p-4">
                  <img src={fileUrl} alt={certificate.nama} className="max-w-full max-h-125 object-contain rounded-lg" onError={() => setError('Gagal memuat gambar')} />
                </div>
              ) : (
                <div className="text-center py-20">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">File tidak dapat dipreview</p>
                  <p className="text-sm text-gray-400 mt-1">Ekstensi: .{ext || 'unknown'}</p>
                  <button onClick={onDownload} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium">
            Tutup
          </button>
          <button onClick={onDownload} className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Sertifikat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateList;