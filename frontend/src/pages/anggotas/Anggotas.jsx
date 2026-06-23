import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { usePermissions } from "../../hooks/usePermissions";
import { anggotaService } from "../../services/anggota";
import { organizationService } from "../../services/organization";
import { jabatanService } from "../../services/jabatan";
import MainLayout from "../../components/layout/MainLayout";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Filter,
  Layers,
  Phone,
  Building2,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import AnggotaModal from "./AnggotaModal";
import AnggotaDetail from "./AnggotaDetail";

const Anggotas = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const permissions = usePermissions();
  
  const [anggotas, setAnggotas] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  
  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  const user = permissions.user;
  const userRole = user?.role?.slug;
  
  const getUserOrgLevel = () => {
    if (user?.organization?.level?.slug) {
      return user.organization.level.slug;
    }
    if (user?.organization?.level) {
      return user.organization.level;
    }
    return null;
  };
  
  const getUserOrganizationId = () => {
    if (user?.organization?.id) {
      return user.organization.id;
    }
    if (user?.organization_id) {
      return user.organization_id;
    }
    return null;
  };
  
  const userOrgLevel = getUserOrgLevel();
  const userOrganizationId = getUserOrganizationId();
  
  // ============ PERBAIKAN PERMISSIONS ============
  // 1. Tambah Anggota: Super Admin, Admin, Operator (semua level)
  const canCreate = userRole === "super-admin" || 
    userRole === "admin" || 
    userRole === "operator";
  
  // 2. Edit dan Hapus: Hanya Super Admin dan Admin
  const canEditDelete = userRole === "super-admin" || 
    userRole === "admin";
  
  const isPCLevel = userOrgLevel === "pc";
  const isMWCLevel = userOrgLevel === "mwc";
  const isRantingLevel = userOrgLevel === "ranting";
  const isAnakRantingLevel = userOrgLevel === "anak-ranting";
  const isLembagaLevel = userOrgLevel === "lembaga";
  const isBanomLevel = userOrgLevel === "banom";

  // Fungsi untuk mendapatkan semua descendant organisasi dari suatu organisasi
  const getAllDescendantOrganizations = (orgs, parentId) => {
    const result = [];
    const children = orgs.filter(org => org.parent_id === parentId);
    
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendantOrganizations(orgs, child.id));
    }
    
    return result;
  };

  // Mendapatkan organisasi yang dapat diakses berdasarkan level user
  const getAccessibleOrganizations = (allOrgs) => {
    if (userRole === "super-admin") {
      return allOrgs;
    }
    
    if (isPCLevel && userOrganizationId) {
      // PC dapat melihat semua organisasi (descendants dari PC)
      // Termasuk Lembaga dan Banom
      const pcOrg = allOrgs.find(org => org.id === userOrganizationId);
      if (pcOrg) {
        const descendants = getAllDescendantOrganizations(allOrgs, userOrganizationId);
        return [pcOrg, ...descendants];
      }
      return allOrgs.filter(org => org.parent_id === userOrganizationId || org.id === userOrganizationId);
    }
    
    if (isMWCLevel && userOrganizationId) {
      // MWC dapat melihat MWC sendiri + semua ranting, anak ranting, lembaga, banom di bawahnya
      const mwcOrg = allOrgs.find(org => org.id === userOrganizationId);
      if (mwcOrg) {
        const descendants = getAllDescendantOrganizations(allOrgs, userOrganizationId);
        return [mwcOrg, ...descendants];
      }
      return allOrgs.filter(org => org.id === userOrganizationId || org.parent_id === userOrganizationId);
    }
    
    if (isRantingLevel && userOrganizationId) {
      // Ranting dapat melihat ranting sendiri + semua anak ranting di bawahnya
      const rantingOrg = allOrgs.find(org => org.id === userOrganizationId);
      if (rantingOrg) {
        const descendants = getAllDescendantOrganizations(allOrgs, userOrganizationId);
        return [rantingOrg, ...descendants];
      }
      return allOrgs.filter(org => org.id === userOrganizationId || org.parent_id === userOrganizationId);
    }
    
    if (isAnakRantingLevel || isLembagaLevel || isBanomLevel) {
      return allOrgs.filter(org => org.id === userOrganizationId);
    }
    
    return allOrgs.filter(org => org.id === userOrganizationId);
  };

  const getAllLevelOptions = () => {
    const allLevels = [
      { id: 1, name: "PC", slug: "pc", display: "PCNU" },
      { id: 2, name: "MWC", slug: "mwc", display: "MWCNU" },
      { id: 3, name: "Ranting", slug: "ranting", display: "RANTING" },
      { id: 4, name: "Anak Ranting", slug: "anak-ranting", display: "ANAK RANTING" },
      { id: 5, name: "Lembaga", slug: "lembaga", display: "LEMBAGA" },
      { id: 6, name: "Banom", slug: "banom", display: "BANOM" },
    ];
    
    if (userRole === "super-admin") {
      return allLevels;
    }
    
    if (isPCLevel) {
      // PC bisa melihat semua level karena PC adalah level tertinggi
      return allLevels;
    }
    
    if (isMWCLevel) {
      // MWC bisa melihat MWC, Ranting, Anak Ranting, Lembaga, Banom
      return allLevels.filter(l => 
        l.slug === "mwc" || 
        l.slug === "ranting" || 
        l.slug === "anak-ranting" ||
        l.slug === "lembaga" ||
        l.slug === "banom"
      );
    }
    
    if (isRantingLevel) {
      // Ranting bisa melihat Ranting dan Anak Ranting
      return allLevels.filter(l => l.slug === "ranting" || l.slug === "anak-ranting");
    }
    
    if (isAnakRantingLevel || isLembagaLevel || isBanomLevel) {
      return allLevels.filter(l => l.slug === userOrgLevel);
    }
    
    return [];
  };

  const levelOptions = getAllLevelOptions();

  const fetchAnggotas = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    
    const params = { 
      page, 
      per_page: pagination.per_page 
    };
    
    if (debouncedSearch && debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (filterOrganization) {
      params.organization_id = filterOrganization;
    }
    if (filterJabatan) {
      params.jabatan_id = filterJabatan;
    }
    if (filterStatus !== "") {
      params.is_active = filterStatus === "active";
    }

    const result = await anggotaService.getAll(params);
    
    if (result.success) {
      setAnggotas(result.data.data);
      setPagination({
        current_page: result.data.current_page,
        last_page: result.data.last_page,
        per_page: result.data.per_page,
        total: result.data.total,
      });
    } else {
      error("Gagal", result.message);
    }
    
    setLoading(false);
    isFetchingRef.current = false;
  }, [pagination.per_page, error, debouncedSearch, filterOrganization, filterJabatan, filterStatus]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, current_page: 1 }));
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    if (!initialLoading) {
      fetchAnggotas(1);
    }
  }, [debouncedSearch, filterOrganization, filterJabatan, filterStatus, fetchAnggotas, initialLoading]);

  const fetchOrganizations = async () => {
    try {
      const result = await organizationService.getAll({ per_page: 1000 });
      
      if (!result.success) {
        console.error('Failed to fetch organizations:', result.message);
        return;
      }
      
      let allOrgs = result.data.data || [];
      setAllOrganizations(allOrgs);
      
      // Get accessible organizations based on user role
      let accessibleOrgs = getAccessibleOrganizations(allOrgs);
      
      // Sort organizations by name
      accessibleOrgs.sort((a, b) => a.nama.localeCompare(b.nama));
      
      setOrganizations(accessibleOrgs);
      setFilteredOrganizations(accessibleOrgs);
      
      // Set default organization filter if only one organization is accessible
      if (accessibleOrgs.length === 1 && !filterOrganization) {
        setFilterOrganization(accessibleOrgs[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      error("Gagal", "Gagal mengambil data organisasi");
    }
  };

  const fetchJabatans = async () => {
    const result = await jabatanService.getAll({ per_page: 100 });
    if (result.success) setJabatans(result.data.data || []);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchOrganizations(),
        fetchJabatans()
      ]);
      setInitialLoading(false);
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!initialLoading && organizations.length > 0) {
      fetchAnggotas(1);
    }
  }, [initialLoading, organizations]);

  const handleFilterLevelChange = (levelSlug) => {
    setFilterLevel(levelSlug);
    setFilterOrganization("");
    
    let filteredOrgs = [];
    
    if (!levelSlug) {
      filteredOrgs = organizations;
    } else {
      filteredOrgs = organizations.filter(org => org.level?.slug === levelSlug);
    }
    
    // Sort filtered organizations by name
    filteredOrgs.sort((a, b) => a.nama.localeCompare(b.nama));
    
    setFilteredOrganizations(filteredOrgs);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSearchNow = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setDebouncedSearch(search);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchNow();
    }
  };

  const handleFilterOrganizationChange = (e) => {
    const value = e.target.value;
    setFilterOrganization(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterJabatanChange = (e) => {
    const value = e.target.value;
    setFilterJabatan(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterStatusChange = (e) => {
    const value = e.target.value;
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilterLevel("");
    setFilterJabatan("");
    setFilterStatus("");
    setFilterOrganization("");
    setFilteredOrganizations(organizations);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleDelete = (anggota) => {
    if (!canEditDelete) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus anggota");
      return;
    }
    
    warning("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus anggota "${anggota.nama}"?`, async () => {
      const result = await anggotaService.delete(anggota.id);
      if (result.success) {
        success("Berhasil", result.message);
        await fetchAnggotas(pagination.current_page);
      } else {
        error("Gagal", result.message);
      }
    });
  };

  const openCreateForm = () => {
    if (!canCreate) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah anggota");
      return;
    }
    setEditingAnggota(null);
    setModalOpen(true);
  };

  const openEditForm = (anggota) => {
    if (!canEditDelete) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit anggota");
      return;
    }
    setEditingAnggota(anggota);
    setModalOpen(true);
  };

  const openDetail = (anggota) => {
    setSelectedAnggota(anggota);
    setDetailOpen(true);
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Tidak Aktif
      </span>
    );
  };

  const statusOptions = [
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Tidak Aktif" },
  ];

  const hasActiveFilters = search || filterLevel || filterOrganization || filterJabatan || filterStatus;

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchAnggotas(newPage);
  };

  if (initialLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="w-8 h-8 text-emerald-600" />
                Manajemen Anggota
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data anggota organisasi Nahdatul Ulama
              </p>
            </div>
            {/* Tambah Anggota - Super Admin, Admin, Operator */}
            {canCreate && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah Anggota
              </button>
            )}
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    LEVEL ORGANISASI
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => handleFilterLevelChange(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Level</option>
                    {levelOptions.map((level) => (
                      <option key={level.slug} value={level.slug}>
                        {level.display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI
                  </label>
                  <select
                    value={filterOrganization}
                    onChange={handleFilterOrganizationChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Organisasi</option>
                    {filteredOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nama} {org.level?.display_name ? `(${org.level.display_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {filterLevel && filteredOrganizations.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Tidak ada organisasi untuk level yang dipilih
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    JABATAN
                  </label>
                  <select
                    value={filterJabatan}
                    onChange={handleFilterJabatanChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Jabatan</option>
                    {jabatans.map((jab) => (
                      <option key={jab.id} value={jab.id}>
                        {jab.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    STATUS
                  </label>
                  <select
                    value={filterStatus}
                    onChange={handleFilterStatusChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Status</option>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jabatan</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Telepon</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {anggotas.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data anggota</p>
                            {canCreate && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Anggota Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      anggotas.map((anggota, index) => (
                        <tr key={anggota.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="text-center px-6 py-4 text-sm text-gray-600">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{anggota.nama}</div>
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.organization?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.jabatan?.nama || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">{anggota.no_hp || "-"}</span>
                          </td>
                          <td className="text-center px-6 py-4">
                            {getStatusBadge(anggota.is_active)}
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetail(anggota)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Edit - Hanya Super Admin dan Admin */}
                              {canEditDelete && (
                                <button
                                  onClick={() => openEditForm(anggota)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {/* Hapus - Hanya Super Admin dan Admin */}
                              {canEditDelete && (
                                <button
                                  onClick={() => handleDelete(anggota)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {anggotas.length === 0 && !loading ? (
                  <div className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Tidak ada data anggota</p>
                    </div>
                  </div>
                ) : (
                  anggotas.map((anggota) => (
                    <div key={anggota.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{anggota.nama}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{anggota.organization?.nama || "-"}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openDetail(anggota)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit - Hanya Super Admin dan Admin */}
                          {canEditDelete && (
                            <button
                              onClick={() => openEditForm(anggota)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {/* Hapus - Hanya Super Admin dan Admin */}
                          {canEditDelete && (
                            <button
                              onClick={() => handleDelete(anggota)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Jabatan</p>
                          <p className="text-gray-700 mt-1">{anggota.jabatan?.nama || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">No. Telepon</p>
                          <p className="text-gray-700 mt-1">{anggota.no_hp || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <div className="mt-1">{getStatusBadge(anggota.is_active)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && !loading && anggotas.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} data
                  </div>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum;
                        if (pagination.last_page <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.current_page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.current_page >= pagination.last_page - 2) {
                          pageNum = pagination.last_page - 4 + i;
                        } else {
                          pageNum = pagination.current_page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                              pagination.current_page === pageNum
                                ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                : "border border-gray-300 hover:bg-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnggotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAnggota={editingAnggota}
        organizations={organizations}
        allOrganizations={allOrganizations}
        jabatans={jabatans}
        onSuccess={() => fetchAnggotas(pagination.current_page)}
        canManage={canCreate}
        userOrgLevel={userOrgLevel}
        defaultOrgId={organizations.length === 1 ? organizations[0]?.id : null}
        currentUser={user}
        userOrganizationId={userOrganizationId}
        isRestrictedLevel={!isPCLevel && userRole !== "super-admin"}
      />
      
      <AnggotaDetail
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        anggota={selectedAnggota}
        onEdit={() => {
          setDetailOpen(false);
          openEditForm(selectedAnggota);
        }}
        canEdit={canEditDelete}
      />
    </MainLayout>
  );
};

export default Anggotas;