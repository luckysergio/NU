// src/components/certificate/CertificateList.jsx
import React, { useState, useEffect } from 'react';
import { useModal } from '../../../contexts/ModalContext';
import { certificateService } from '../../../services/certificate';
import {
  FileText,
  Download,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  File,
  FolderOpen,
  User
} from 'lucide-react';

const CertificateList = ({ 
  anggotaId, 
  anggotaName,
  canManage = true,
  onCertificateUpdate 
}) => {
  const { success, error, warning } = useModal();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [categories, setCategories] = useState([]);

  const loadCertificates = async () => {
    if (!anggotaId) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await certificateService.getByAnggota(anggotaId);
      if (response.success) {
        setCertificates(response.data || []);
      } else {
        setErrorMessage(response.message || 'Gagal memuat sertifikat');
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
      setErrorMessage(err.response?.data?.message || 'Gagal memuat sertifikat');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await certificateService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadCertificates();
    loadCategories();
  }, [anggotaId]);

  const handleDownload = async (certificate) => {
    try {
      await certificateService.download(certificate.id);
      success('Berhasil', 'File sertifikat sedang diunduh');
    } catch (err) {
      error('Gagal', err.message || 'Gagal mengunduh file');
    }
  };

  const handleDelete = async (certificate) => {
    warning(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus sertifikat "${certificate.nama}"?`,
      async () => {
        try {
          await certificateService.delete(certificate.id);
          success('Berhasil', 'Sertifikat berhasil dihapus');
          await loadCertificates();
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
    const isActive = certificate.category?.is_active !== false;
    
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="w-3 h-3" />
          Tidak Aktif
        </span>
      );
    }
    
    // Check if expired
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Memuat sertifikat...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700">{errorMessage}</p>
        <button
          onClick={loadCertificates}
          className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
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
    <div className="space-y-3">
      {certificates.map((cert) => (
        <div 
          key={cert.id} 
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Info */}
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

            {/* Right: Actions */}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleDownload(cert)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      // Will be handled by parent component
                      if (onCertificateUpdate) {
                        onCertificateUpdate('edit', cert);
                      }
                    }}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cert)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CertificateList;