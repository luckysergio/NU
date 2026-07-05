// src/pages/users/components/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Lock, Eye, EyeOff, Shield, Building2, AlertCircle 
} from 'lucide-react';
import { userService } from '../../../services/user';

const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  roles,
  organizations,
  filteredOrganizations,
  isSubmitting,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    role_id: '',
    organization_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    is_active: true,
    is_blocked: false,
    can_login: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset form when editing user changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        role_id: editingUser.role_id?.toString() || '',
        organization_id: editingUser.organization_id?.toString() || '',
        name: editingUser.name || '',
        email: editingUser.email || '',
        phone: editingUser.phone || '',
        password: '',
        password_confirmation: '',
        is_active: editingUser.is_active ?? true,
        is_blocked: editingUser.is_blocked ?? false,
        can_login: editingUser.can_login ?? true,
      });
      
      // Fetch available roles for the organization
      if (editingUser.organization_id) {
        fetchAvailableRoles(editingUser.organization_id);
      }
    } else {
      setFormData({
        role_id: '',
        organization_id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        is_blocked: false,
        can_login: true,
      });
      setAvailableRoles([]);
    }
    setFormErrors({});
  }, [editingUser]);

  const fetchAvailableRoles = async (organizationId) => {
    if (!organizationId) {
      setAvailableRoles([]);
      return;
    }
    
    setLoadingRoles(true);
    try {
      const result = await userService.getAvailableRoles(organizationId);
      if (result.success) {
        setAvailableRoles(result.data);
      } else {
        console.error('Failed to fetch available roles:', result.message);
        setAvailableRoles([]);
      }
    } catch (err) {
      console.error('Error fetching available roles:', err);
      setAvailableRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // If organization changes, fetch available roles
    if (name === 'organization_id' && value) {
      fetchAvailableRoles(parseInt(value));
      setFormData((prev) => ({ ...prev, role_id: '' }));
    }
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.role_id) errors.role_id = 'Role wajib dipilih';
    if (!formData.organization_id) errors.organization_id = 'Organisasi wajib dipilih';
    if (!formData.name.trim()) errors.name = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    if (!editingUser && !formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Konfirmasi password tidak cocok';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      role_id: parseInt(formData.role_id),
      organization_id: parseInt(formData.organization_id),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      is_active: formData.is_active,
      is_blocked: formData.is_blocked,
      can_login: formData.can_login,
    };

    if (formData.password) {
      submitData.password = formData.password;
    }

    // Panggil onSubmit dan tunggu hasilnya
    const result = await onSubmit(submitData);
    
    // Jika result adalah object dengan errors, set form errors
    if (result && typeof result === 'object' && Object.keys(result).length > 0) {
      setFormErrors(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                {editingUser
                  ? 'Ubah data pengguna dan akses sistem'
                  : 'Isi form berikut untuk menambahkan pengguna baru'}
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

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Role & Organization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    disabled={!formData.organization_id || loadingRoles}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.role_id ? 'border-red-500' : 'border-gray-200'
                    } ${(!formData.organization_id || loadingRoles) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  >
                    <option value="">
                      {loadingRoles ? 'Memuat role...' : 'Pilih Role'}
                    </option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nama}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.role_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.role_id}</p>
                )}
                {formData.organization_id && availableRoles.length === 0 && !loadingRoles && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Tidak ada role yang tersedia untuk organisasi ini
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Organisasi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.organization_id ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Pilih Organisasi</option>
                    {filteredOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.organization_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="email@domain.com"
                  />
                </div>
                {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  No. Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="08123456789"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.password ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      formErrors.password_confirmation ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Ulangi password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password_confirmation && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.password_confirmation}</p>
                )}
              </div>
            </div>

            {/* Status Options */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Pengaturan Akun</p>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="is_blocked"
                    checked={formData.is_blocked}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Diblokir</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="can_login"
                    checked={formData.can_login}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Dapat Login</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;