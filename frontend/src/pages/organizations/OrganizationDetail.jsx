// src/pages/organizations/OrganizationDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { organizationService } from "../../services/organization";
import MainLayout from "../../components/layout/MainLayout";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Home,
  Loader2,
} from "lucide-react";

const OrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { success, error } = useModal();
  const { user: currentUser } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    alamat: "",
    telepon: "",
    email: "",
  });
  const [errors, setErrors] = useState({});

  // ============================================
  // CHECK USER PERMISSIONS
  // ============================================
  
  const userRole = currentUser?.role?.slug;
  const userOrgLevel = currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  
  const isSuperAdmin = userRole === 'super-admin';
  const isAdminPC = userRole === 'admin' && userOrgLevel === 'pc';
  const canEdit = isSuperAdmin || isAdminPC;

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    setLoading(true);
    const result = await organizationService.getById(id);
    if (result.success) {
      setOrganization(result.data);
      setFormData({
        alamat: result.data.alamat || "",
        telepon: result.data.telepon || "",
        email: result.data.email || "",
      });
    } else {
      error("Gagal", result.message);
      navigate("/organizations");
    }
    setLoading(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form jika batal
      setFormData({
        alamat: organization?.alamat || "",
        telepon: organization?.telepon || "",
        email: organization?.email || "",
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi
    const newErrors = {};
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await organizationService.update(id, {
        alamat: formData.alamat,
        telepon: formData.telepon,
        email: formData.email,
      });

      if (result.success) {
        success("Berhasil", "Data kontak dan alamat berhasil diupdate");
        setOrganization(result.data);
        setIsEditing(false);
        setErrors({});
      } else {
        if (result.errors) {
          setErrors(result.errors);
          error("Validasi Gagal", "Silakan periksa kembali form Anda");
        } else {
          error("Gagal", result.message);
        }
      }
    } catch (err) {
      console.error("Update error:", err);
      error("Gagal", err?.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="w-32 flex items-center gap-2 shrink-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1">
        <span className="text-sm text-gray-800">{value || "-"}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!organization) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Organisasi tidak ditemukan</p>
            <button
              onClick={() => navigate("/organizations")}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/organizations")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Building2 className="w-8 h-8 text-emerald-600" />
                  Detail Organisasi
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Informasi lengkap organisasi Nahdatul Ulama
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={handleEditToggle}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                  isEditing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                }`}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    Batal
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Kontak & Alamat
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informasi Utama */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Informasi Utama
              </h2>
              <div>
                <InfoRow label="Nama" value={organization.nama} icon={Building2} />
                <InfoRow label="Slug" value={organization.slug} />
                <InfoRow
                  label="Status"
                  value={
                    organization.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <XCircle className="w-4 h-4" /> Tidak Aktif
                      </span>
                    )
                  }
                />
                <InfoRow label="Level" value={organization.level?.nama || "-"} />
                <InfoRow label="Tipe" value={organization.type?.nama || "-"} />
                <InfoRow label="Organisasi Induk" value={organization.parent?.nama || "-"} />
              </div>
            </div>

            {/* Kontak & Alamat - Dengan Edit Inline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                {isEditing ? "Edit Kontak & Alamat" : "Kontak & Alamat"}
              </h2>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Alamat */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Alamat
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleChange}
                        rows="2"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Alamat lengkap organisasi"
                      />
                    </div>
                  </div>

                  {/* Telepon */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Telepon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="telepon"
                        value={formData.telepon}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nomor telepon"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.email ? "border-red-500" : "border-gray-200"
                        }`}
                        placeholder="email@organisasi.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <InfoRow label="Email" value={organization.email} icon={Mail} />
                  <InfoRow label="Telepon" value={organization.telepon} icon={Phone} />
                  <InfoRow label="Alamat" value={organization.alamat} icon={MapPin} />
                  <InfoRow label="Kota" value={organization.kota?.nama || "-"} />
                  <InfoRow label="Kecamatan" value={organization.kecamatan?.nama || "-"} />
                  <InfoRow label="Kelurahan" value={organization.kelurahan?.nama || "-"} />
                  {organization.rw && (
                    <InfoRow label="RW" value={`RW ${organization.rw.nomor}`} icon={Home} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrganizationDetail;