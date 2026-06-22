import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { organizationService } from "../../services/organization";
import MainLayout from "../../components/layout/MainLayout";
import {
  ArrowLeft,
  Edit,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Home,
} from "lucide-react";

const OrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { error } = useModal();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const fetchOrganization = async () => {
    const result = await organizationService.getById(id);
    if (result.success) {
      setOrganization(result.data);
    } else {
      error("Gagal", result.message);
      navigate("/organizations");
    }
    setLoading(false);
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start py-3 border-b border-gray-100">
      <div className="w-32 flex items-center gap-2">
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
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
            <button
              onClick={() => navigate(`/organizations/${id}/edit`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Informasi Utama
              </h2>
              <div>
                <InfoRow
                  label="Nama Organisasi"
                  value={organization?.nama}
                  icon={Building2}
                />
                <InfoRow label="Slug" value={organization?.slug} />
                <InfoRow
                  label="Status"
                  value={
                    organization?.is_active ? (
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
                <InfoRow label="Level" value={organization?.level?.nama} />
                <InfoRow label="Tipe" value={organization?.type?.nama} />
                <InfoRow
                  label="Organisasi Induk"
                  value={organization?.parent?.nama}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Kontak & Alamat
              </h2>
              <div>
                <InfoRow label="Email" value={organization?.email} icon={Mail} />
                <InfoRow
                  label="Telepon"
                  value={organization?.telepon}
                  icon={Phone}
                />
                <InfoRow
                  label="Alamat"
                  value={organization?.alamat}
                  icon={MapPin}
                />
                <InfoRow label="Kota" value={organization?.kota?.nama} />
                <InfoRow
                  label="Kecamatan"
                  value={organization?.kecamatan?.nama}
                />
                <InfoRow
                  label="Kelurahan"
                  value={organization?.kelurahan?.nama}
                />
                {organization?.rw && (
                  <InfoRow
                    label="RW"
                    value={`RW ${organization?.rw?.nomor}`}
                    icon={Home}
                  />
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