// src/pages/anggotas/AnggotaDetail.jsx
import React, { useState, useEffect } from 'react';
import { Users, User, Building2, Briefcase, Phone, MapPin, X, CheckCircle, XCircle, IdCard, FileText, Plus } from 'lucide-react';
import CertificateList from './certificate/CertificateList';
import CertificateModal from './certificate/CertificateModal';
import { certificateService } from '../../services/certificate';

const AnggotaDetail = ({ isOpen, onClose, anggota, onEdit, canEdit }) => {
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen && showCertificateModal) {
      loadCategories();
    }
  }, [isOpen, showCertificateModal]);

  const loadCategories = async () => {
    if (categories.length > 0) return; // Skip if already loaded
    
    setLoadingCategories(true);
    try {
      const response = await certificateService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load categories when certificate modal is about to open
  const handleOpenCertificateModal = async () => {
    setEditingCertificate(null);
    setShowCertificateModal(true);
    
    // Load categories if empty
    if (categories.length === 0) {
      await loadCategories();
    }
  };

  if (!isOpen || !anggota) return null;

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

  const getFotoUrl = () => {
    if (!anggota.foto) return null;
    
    if (anggota.foto.startsWith('http://') || anggota.foto.startsWith('https://')) {
      return anggota.foto;
    }
    
    const baseUrl = import.meta.env.VITE_STORAGE_URL || 
                    import.meta.env.VITE_API_URL?.replace('/api', '') || 
                    'http://localhost:8000';
    
    return `${baseUrl}/storage/${anggota.foto}`;
  };

  const fotoUrl = getFotoUrl();

  const handleCertificateSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowCertificateModal(false);
    setEditingCertificate(null);
  };

  const handleCertificateAction = (action, certificate) => {
    if (action === 'edit') {
      setEditingCertificate(certificate);
      setShowCertificateModal(true);
    }
  };

  // Handler untuk refresh categories setelah menambah kategori baru
  const handleCategoryAdded = async (updatedCategories) => {
    if (updatedCategories) {
      setCategories(updatedCategories);
    } else {
      // Refresh categories from API
      try {
        const response = await certificateService.getCategories();
        if (response.success) {
          setCategories(response.data || []);
        }
      } catch (err) {
        console.error('Error refreshing categories:', err);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-5">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>
            
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Detail Anggota
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    Informasi lengkap anggota organisasi
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-5">
              
              {/* Profile Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-gray-100">
                <div className="relative">
                  {fotoUrl ? (
                    <img 
                      src={fotoUrl} 
                      alt={anggota.nama} 
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
                      onError={(e) => {
                        console.error('Foto tidak bisa dimuat:', fotoUrl);
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
                <div className="text-center sm:text-left">
                  <p className="text-xl font-bold text-gray-800">{anggota.nama}</p>
                  {anggota.no_anggota && (
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                      <IdCard className="w-3 h-3" />
                      No. Anggota: {anggota.no_anggota}
                    </p>
                  )}
                  <div className="mt-1">{getStatusBadge(anggota.is_active)}</div>
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
                  value={anggota.no_hp}
                  icon={Phone}
                />
                <DetailRow
                  label="Alamat"
                  value={anggota.alamat}
                  icon={MapPin}
                  multiline
                />
              </div>

              {/* Certificate Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-800">Sertifikat</h3>
                  </div>
                  {canEdit && (
                    <button
                      onClick={handleOpenCertificateModal}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-3 h-3" />
                      Upload Sertifikat
                    </button>
                  )}
                </div>

                <CertificateList
                  key={refreshKey}
                  anggotaId={anggota.id}
                  anggotaName={anggota.nama}
                  canManage={canEdit}
                  onCertificateUpdate={handleCertificateAction}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Tutup
            </button>
            {canEdit && (
              <button
                onClick={onEdit}
                className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Anggota
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setEditingCertificate(null);
        }}
        editingCertificate={editingCertificate}
        anggotaId={anggota.id}
        anggotaName={anggota.nama}
        categories={categories}
        onSuccess={handleCertificateSuccess}
        onCategoryAdded={handleCategoryAdded}
      />
    </>
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

export default AnggotaDetail;