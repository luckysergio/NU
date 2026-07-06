// src/pages/organizations/OrganizationDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { organizationService } from "../../services/organization";
import { ORGANIZATIONS_QUERY_KEY } from "../../hooks/useOrganizations";
import { useRealtimeOrganizations } from "../../hooks/useRealtimeOrganizations";
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
  Users,
  Eye,
  ExternalLink,
} from "lucide-react";

const OrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { success, error } = useModal();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // ✅ Aktifkan realtime listener
  useRealtimeOrganizations();

  const [isEditing, setIsEditing] = useState(false);
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
  const userOrgLevel =
    currentUser?.organization?.level?.slug || currentUser?.organization?.level;
  const isSuperAdmin = userRole === "super-admin";
  const isAdminPC = userRole === "admin" && userOrgLevel === "pc";
  const canEdit = isSuperAdmin || isAdminPC;

  // ============================================
  // FETCH DATA DENGAN TANSTACK QUERY
  // ============================================
  const {
    data: organization,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["organization-detail", id],
    queryFn: async () => {
      const result = await organizationService.getById(id);
      if (!result.success) {
        throw new Error(result.message || "Gagal memuat data organisasi");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // Cache 5 menit
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Sync formData saat organization berubah (termasuk saat realtime update)
  useEffect(() => {
    if (organization && !isEditing) {
      setFormData({
        alamat: organization.alamat || "",
        telepon: organization.telepon || "",
        email: organization.email || "",
      });
    }
  }, [organization, isEditing]);

  // Redirect jika error
  useEffect(() => {
    if (isError) {
      error("Gagal", "Organisasi tidak ditemukan");
      navigate("/organizations");
    }
  }, [isError]);

  // ============================================
  // MUTATION: UPDATE KONTAK & ALAMAT
  // ============================================
  const updateMutation = useMutation({
    mutationFn: (data) => organizationService.update(id, data),
    onSuccess: (result) => {
      if (result.success) {
        // ✅ Update cache detail
        queryClient.setQueryData(["organization-detail", id], result.data);
        // ✅ Invalidate list organizations agar data terbaru muncul
        queryClient.invalidateQueries({
          queryKey: [ORGANIZATIONS_QUERY_KEY],
          exact: false,
        });
        success("Berhasil", "Data kontak dan alamat berhasil diupdate");
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
    },
    onError: (err) => {
      console.error("Update error:", err);
      error("Gagal", err?.message || "Terjadi kesalahan");
    },
  });

  // ============================================
  // HANDLERS
  // ============================================
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi client-side
    const newErrors = {};
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (formData.telepon && !/^[0-9+\-\s()]+$/.test(formData.telepon)) {
      newErrors.telepon = "Format telepon tidak valid";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateMutation.mutate({
      alamat: formData.alamat,
      telepon: formData.telepon,
      email: formData.email,
    });
  };

  // ============================================
  // RESPONSIVE INFO ROW COMPONENT
  // ============================================
  const InfoRow = ({ label, value, icon: Icon, isLink = false, onClick }) => (
    <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-gray-100 last:border-0 gap-1 sm:gap-0">
      <div className="sm:w-36 flex items-center gap-2 shrink-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="flex-1 min-w-0 sm:pl-0 pl-6">
        {isLink && onClick ? (
          <button
            onClick={onClick}
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium wrap-break-word text-left"
          >
            <span className="wrap-break-word">{value || "-"}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </button>
        ) : (
          <span className="text-sm text-gray-800 wrap-break-word whitespace-pre-wrap">
            {value || "-"}
          </span>
        )}
      </div>
    </div>
  );

  // ============================================
  // LEVEL BADGE
  // ============================================
  const getLevelBadge = (levelName) => {
    const colors = {
      PC: "bg-purple-100 text-purple-700",
      MWC: "bg-blue-100 text-blue-700",
      Ranting: "bg-green-100 text-green-700",
      "Anak Ranting": "bg-teal-100 text-teal-700",
      Lembaga: "bg-orange-100 text-orange-700",
      Banom: "bg-pink-100 text-pink-700",
    };
    const displayName =
      levelName === "PC"
        ? "PCNU"
        : levelName === "Anak Ranting"
        ? "ANAK RANTING"
        : levelName;
    return (
      <span
        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          colors[levelName] || "bg-gray-100 text-gray-700"
        }`}
      >
        {displayName || "-"}
      </span>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ============================================
              HEADER - RESPONSIVE
          ============================================ */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate("/organizations")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2 truncate">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 shrink-0" />
                  <span className="truncate">{organization.nama}</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                  {organization.level?.nama && (
                    <span className="inline-flex items-center gap-1">
                      {getLevelBadge(organization.level.nama)}
                      <span className="mx-1">•</span>
                    </span>
                  )}
                  <span className="truncate">
                    {organization.kota?.nama ||
                      organization.kecamatan?.nama ||
                      organization.kelurahan?.nama ||
                      "Informasi lengkap organisasi"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={() => navigate(`/organizations/${id}/edit`)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200 text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Lengkap</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              )}
              <button
                onClick={handleEditToggle}
                className={`inline-flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium ${
                  isEditing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                }`}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Batal Edit</span>
                    <span className="sm:hidden">Batal</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Kontak</span>
                    <span className="sm:hidden">Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ============================================
              MAIN CONTENT - RESPONSIVE GRID
          ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ============================================
                KOLOM KIRI: INFORMASI UTAMA
            ============================================ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informasi Utama */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 overflow-hidden">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="truncate">Informasi Utama</span>
                </h2>
                <div className="divide-y-0">
                  <InfoRow
                    label="Nama"
                    value={organization.nama}
                    icon={Building2}
                  />
                  <InfoRow
                    label="Slug"
                    value={organization.slug}
                  />
                  <InfoRow
                    label="Status"
                    value={
                      organization.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle className="w-4 h-4 shrink-0" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                          <XCircle className="w-4 h-4 shrink-0" /> Tidak Aktif
                        </span>
                      )
                    }
                  />
                  <InfoRow
                    label="Level"
                    value={getLevelBadge(organization.level?.nama)}
                  />
                  <InfoRow
                    label="Tipe"
                    value={organization.type?.nama}
                  />
                  <InfoRow
                    label="Induk"
                    value={organization.parent?.nama}
                    isLink={!!organization.parent_id}
                    onClick={
                      organization.parent_id
                        ? () =>
                            navigate(
                              `/organizations/${organization.parent_id}`
                            )
                        : null
                    }
                  />
                </div>
              </div>

              {/* Lokasi Lengkap */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 overflow-hidden">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="truncate">Lokasi</span>
                </h2>
                <div>
                  <InfoRow
                    label="Kota/Kab"
                    value={organization.kota?.nama}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Kecamatan"
                    value={organization.kecamatan?.nama}
                  />
                  <InfoRow
                    label="Kelurahan"
                    value={organization.kelurahan?.nama}
                  />
                  {organization.rw && (
                    <InfoRow
                      label="RW"
                      value={`RW ${organization.rw.nomor}`}
                      icon={Home}
                    />
                  )}
                </div>
              </div>

              {/* Organisasi Turunan (Children) */}
              {organization.children && organization.children.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 overflow-hidden">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                    <span className="truncate">Organisasi Turunan</span>
                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0">
                      {organization.children.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organization.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => navigate(`/organizations/${child.id}`)}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 text-left group min-w-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700">
                            {child.nama}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {child.level?.nama || "-"}
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================
                KOLOM KANAN: KONTAK & ALAMAT (DENGAN EDIT)
            ============================================ */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4 overflow-hidden">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                  <span className="truncate">
                    {isEditing ? "Edit Kontak & Alamat" : "Kontak & Alamat"}
                  </span>
                </h2>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Alamat */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 shrink-0" />
                        <textarea
                          name="alamat"
                          value={formData.alamat}
                          onChange={handleChange}
                          rows="3"
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
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
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          name="telepon"
                          value={formData.telepon}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                            errors.telepon ? "border-red-500" : "border-gray-200"
                          }`}
                          placeholder="Nomor telepon"
                        />
                      </div>
                      {errors.telepon && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.telepon}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                            errors.email ? "border-red-500" : "border-gray-200"
                          }`}
                          placeholder="email@organisasi.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 shrink-0" />
                            Simpan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 text-sm"
                      >
                        <X className="w-4 h-4 shrink-0" />
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <InfoRow
                      label="Email"
                      value={
                        organization.email ? (
                          <a
                            href={`mailto:${organization.email}`}
                            className="text-emerald-600 hover:text-emerald-700 break-all"
                          >
                            {organization.email}
                          </a>
                        ) : null
                      }
                      icon={Mail}
                    />
                    <InfoRow
                      label="Telepon"
                      value={
                        organization.telepon ? (
                          <a
                            href={`tel:${organization.telepon}`}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            {organization.telepon}
                          </a>
                        ) : null
                      }
                      icon={Phone}
                    />
                    <InfoRow
                      label="Alamat"
                      value={organization.alamat}
                      icon={MapPin}
                    />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 italic">
                        💡 Klik tombol "Edit Kontak" untuk mengubah data di atas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrganizationDetail;