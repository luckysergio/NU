// src/pages/anggotas/certificate/CertificateModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useCertificateCategories, useCertificatesByAnggota } from '../../../hooks/useCertificate';
import { useModal } from '../../../contexts/ModalContext';
import { certificateService } from '../../../services/certificate';
import { 
  X, 
  FileText, 
  Upload, 
  Calendar, 
  FolderOpen,
  File,
  Trash2,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CertificateModal = ({
  isOpen,
  onClose,
  editingCertificate,
  anggotaId,
  anggotaName,
  onSuccess,
}) => {
  const { success, error } = useModal();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    certificate_category_id: '',
    nama: '',
    nomor_sertifikat: '',
    tanggal_terbit: new Date().toISOString().split('T')[0],
    tanggal_expired: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [existingFile, setExistingFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // State untuk kategori baru
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Menggunakan TanStack Query untuk categories dengan CRUD
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    refetch: refetchCategories,
    createCategory,
    isCreatingCategory,
  } = useCertificateCategories();

  // Get refetch function for certificates
  const { refetch: refetchCertificates } = useCertificatesByAnggota(anggotaId);

  // Reset form when editing certificate changes
  useEffect(() => {
    if (editingCertificate) {
      setFormData({
        certificate_category_id: editingCertificate.certificate_category_id?.toString() || '',
        nama: editingCertificate.nama || '',
        nomor_sertifikat: editingCertificate.nomor_sertifikat || '',
        tanggal_terbit: editingCertificate.tanggal_terbit ? 
          new Date(editingCertificate.tanggal_terbit).toISOString().split('T')[0] : '',
        tanggal_expired: editingCertificate.tanggal_expired ? 
          new Date(editingCertificate.tanggal_expired).toISOString().split('T')[0] : '',
      });
      
      if (editingCertificate.file) {
        const fileUrl = certificateService.getFileUrl(editingCertificate.file);
        setFilePreview(fileUrl);
        setExistingFile(editingCertificate.file);
        setFileName(editingCertificate.file.split('/').pop());
      } else {
        setFilePreview(null);
        setExistingFile(null);
        setFileName('');
      }
    } else {
      setFormData({
        certificate_category_id: '',
        nama: `Sertifikat ${anggotaName || ''}`,
        nomor_sertifikat: '',
        tanggal_terbit: new Date().toISOString().split('T')[0],
        tanggal_expired: '',
      });
      setFile(null);
      setFilePreview(null);
      setFileName('');
      setExistingFile(null);
    }
    setFormErrors({});
    setShowNewCategoryForm(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError('');
  }, [editingCertificate, anggotaName]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!formData.certificate_category_id) {
      errors.certificate_category_id = 'Kategori sertifikat wajib dipilih';
    }
    if (!formData.nama?.trim()) {
      errors.nama = 'Nama sertifikat wajib diisi';
    }
    if (!formData.tanggal_terbit) {
      errors.tanggal_terbit = 'Tanggal terbit wajib diisi';
    }
    if (!file && !existingFile && !editingCertificate) {
      errors.file = 'File sertifikat wajib diupload';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      error('Error', 'Ukuran file maksimal 5MB');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      error('Error', 'Format file tidak didukung. Gunakan: PDF, JPG, JPEG, PNG, DOC, DOCX');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
    setFilePreview(null);
    setExistingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler untuk membuat kategori baru menggunakan TanStack Query
  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Nama kategori wajib diisi');
      return;
    }

    setCategoryError('');

    try {
      const result = await createCategory({ 
        nama: name,
        deskripsi: newCategoryDescription.trim() || null
      });
      
      success('Berhasil', 'Kategori sertifikat berhasil dibuat');
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategoryForm(false);
      
      // Refetch categories untuk mendapatkan data terbaru
      await refetchCategories();
      
      // Cari kategori yang baru dibuat dan pilih otomatis
      const newCategory = categories.find(c => c.nama === name);
      if (newCategory) {
        setFormData(prev => ({
          ...prev,
          certificate_category_id: newCategory.id.toString(),
        }));
      }
    } catch (err) {
      console.error('Error creating category:', err);
      const errorMessage = err.message || 'Gagal membuat kategori';
      setCategoryError(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        anggota_id: anggotaId,
      };

      if (file) {
        submitData.file = file;
      }

      let result;
      if (editingCertificate) {
        result = await certificateService.update(editingCertificate.id, submitData);
      } else {
        result = await certificateService.create(submitData);
      }

      if (result.success) {
        success('Berhasil', result.message);
        onClose();
        
        // REFRESH DATA: Refetch certificates setelah submit
        if (anggotaId) {
          await refetchCertificates();
        }
        
        if (onSuccess) onSuccess();
      } else {
        if (result.errors) {
          setFormErrors(result.errors);
          error('Validasi Gagal', 'Silakan periksa kembali form Anda');
        } else {
          error('Gagal', result.message || 'Terjadi kesalahan');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                          err.message || 
                          'Terjadi kesalahan';
      error('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getFileIcon = () => {
    if (!fileName) return <File className="w-8 h-8 text-gray-400" />;
    
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <File className="w-8 h-8 text-blue-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingCertificate ? 'Edit Sertifikat' : 'Tambah Sertifikat'}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingCertificate 
                  ? 'Ubah data sertifikat anggota' 
                  : `Upload sertifikat untuk ${anggotaName || 'anggota'}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Kategori Sertifikat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kategori Sertifikat <span className="text-red-500">*</span>
              </label>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="certificate_category_id"
                    value={formData.certificate_category_id}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.certificate_category_id ? 'border-red-500' : 'border-gray-200'
                    }`}
                    disabled={showNewCategoryForm || categoriesLoading}
                  >
                    <option value="">{categoriesLoading ? 'Memuat kategori...' : 'Pilih Kategori'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nama}
                      </option>
                    ))}
                  </select>
                </div>
                
                {!showNewCategoryForm ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-1 whitespace-nowrap"
                    title="Tambah Kategori Baru"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Kategori</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                      setCategoryError('');
                    }}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors duration-200"
                    title="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Form tambah kategori baru */}
              {showNewCategoryForm && (
                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Nama Kategori <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setCategoryError('');
                        }}
                        placeholder="Masukkan nama kategori..."
                        className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          categoryError ? 'border-red-500' : 'border-gray-200'
                        }`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Deskripsi (Opsional)
                      </label>
                      <textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Masukkan deskripsi kategori..."
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows="2"
                      />
                    </div>
                    
                    {categoryError && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600">{categoryError}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCreatingCategory ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan Kategori'
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Kategori akan tersimpan dan dapat digunakan untuk sertifikat lainnya
                  </p>
                </div>
              )}

              {formErrors.certificate_category_id && (
                <p className="mt-1 text-xs text-red-500">{formErrors.certificate_category_id}</p>
              )}
            </div>

            {/* Nama Sertifikat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Sertifikat <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.nama ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Masukkan nama sertifikat"
                />
              </div>
              {formErrors.nama && (
                <p className="mt-1 text-xs text-red-500">{formErrors.nama}</p>
              )}
            </div>

            {/* Nomor Sertifikat (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nomor Sertifikat
              </label>
              <div className="relative">
                <File className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="nomor_sertifikat"
                  value={formData.nomor_sertifikat}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Masukkan nomor sertifikat (opsional)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                * Kosongkan jika ingin diisi otomatis
              </p>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tanggal Terbit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="tanggal_terbit"
                    value={formData.tanggal_terbit}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.tanggal_terbit ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {formErrors.tanggal_terbit && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.tanggal_terbit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tanggal Expired
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="tanggal_expired"
                    value={formData.tanggal_expired}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">* Kosongkan jika tidak ada masa berlaku</p>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                File Sertifikat {!editingCertificate && <span className="text-red-500">*</span>}
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-emerald-400 transition-all duration-200">
                {filePreview && !file ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getFileIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                      <p className="text-xs text-gray-500">File tersimpan</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : filePreview && file ? (
                  <div className="relative">
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-h-48 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">{fileName}</p>
                  </div>
                ) : fileName ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getFileIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                      <p className="text-xs text-gray-500">{(file?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="text-center cursor-pointer py-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Klik atau drag file ke sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, JPG, JPEG, PNG, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {formErrors.file && (
                <p className="mt-1 text-xs text-red-500">{formErrors.file}</p>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || isCreatingCategory || categoriesLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {editingCertificate ? 'Update' : 'Upload'} Sertifikat
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;