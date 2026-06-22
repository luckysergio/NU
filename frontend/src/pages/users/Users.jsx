import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user";
import { roleService } from "../../services/role";
import { organizationService } from "../../services/organization";
import { filterOrganizationsByAccess } from "../../utils/accessControl";
import MainLayout from "../../components/layout/MainLayout";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  X,
  Mail,
  Phone,
  Building2,
  User,
  Filter,
  Layers,
  Search,
  AlertCircle,
} from "lucide-react";

const UsersPage = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    role_id: "",
    organization_id: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    is_active: true,
    is_blocked: false,
    can_login: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

  // Ref untuk mencegah multiple requests
  const isFetchingRef = useRef(false);
  const filterTimeoutRef = useRef(null);

  const userRole = currentUser?.role?.slug;
  const canManage = userRole === "super-admin" || userRole === "admin";

  // Level options
  const levelOptions = [
    { id: 1, name: "PC", slug: "pc", display: "PCNU" },
    { id: 2, name: "MWC", slug: "mwc", display: "MWCNU" },
    { id: 3, name: "Ranting", slug: "ranting", display: "RANTING" },
    { id: 4, name: "Lembaga", slug: "lembaga", display: "LEMBAGA" },
    { id: 5, name: "Banom", slug: "banom", display: "BANOM" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  const fetchUsers = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    
    const params = {
      page,
      per_page: pagination.per_page,
    };

    if (search && search.trim()) {
      params.search = search.trim();
    }
    
    if (filterRole) params.role_id = filterRole;
    if (filterOrganization) params.organization_id = filterOrganization;

    const result = await userService.getAll(params);

    if (result.success) {
      setUsers(result.data.data);
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
  }, [pagination.per_page, error, search, filterRole, filterOrganization]);

  const fetchRoles = async () => {
    const result = await roleService.getAll({ per_page: 100 });
    if (result.success) {
      const sortedRoles = result.data.data.sort((a, b) => {
        const order = {
          "super-admin": 1,
          admin: 2,
          operator: 3,
          anggota: 4,
        };
        return (order[a.slug] || 99) - (order[b.slug] || 99);
      });
      setRoles(sortedRoles);
    }
  };

  // Fetch available roles based on selected organization
  const fetchAvailableRoles = async (organizationId) => {
    if (!organizationId) {
      setAvailableRoles([]);
      return;
    }
    
    setLoadingRoles(true);
    const result = await userService.getAvailableRoles(organizationId);
    if (result.success) {
      setAvailableRoles(result.data);
    } else {
      console.error('Failed to fetch available roles:', result.message);
      setAvailableRoles([]);
    }
    setLoadingRoles(false);
  };

  // Fetch all organizations dengan optimasi - hanya ambil 1 halaman dengan per_page yang besar
  const fetchAllOrganizations = async () => {
    if (fetchingOrgs) return;
    
    setFetchingOrgs(true);
    try {
      // Gunakan per_page besar untuk mendapatkan semua data dalam 1 request
      const result = await organizationService.getAll({ per_page: 1000, page: 1 });
      
      if (!result.success) {
        console.error('Failed to fetch organizations:', result.message);
        return;
      }
      
      let allOrgs = result.data.data || [];
      
      // Cek apakah ada halaman berikutnya
      const lastPage = result.data.last_page || 1;
      
      if (lastPage > 1) {
        // Jika masih ada halaman, ambil secara paralel dengan Promise.all
        const promises = [];
        for (let page = 2; page <= lastPage; page++) {
          promises.push(organizationService.getAll({ per_page: 1000, page }));
        }
        
        const results = await Promise.all(promises);
        
        results.forEach(res => {
          if (res.success && res.data.data) {
            allOrgs = [...allOrgs, ...res.data.data];
          }
        });
      }
      
      setAllOrganizations(allOrgs);
      
      const accessibleOrgs = filterOrganizationsByAccess(allOrgs, currentUser);
      setOrganizations(accessibleOrgs);
      setFilteredOrganizations(accessibleOrgs);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      // Jangan tampilkan error ke user karena tidak kritis
      // error("Gagal", "Gagal mengambil data organisasi");
    } finally {
      setFetchingOrgs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRoles();
      fetchAllOrganizations();
      fetchUsers();
    }
  }, [currentUser]);

  // Trigger fetch when filters change
  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    filterTimeoutRef.current = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [search, filterRole, filterOrganization]);

  // Handle filter level change
  const handleFilterLevelChange = (levelSlug) => {
    setFilterLevel(levelSlug);
    setFilterOrganization("");
    
    let filteredOrgs = [];
    
    if (!levelSlug) {
      filteredOrgs = filterOrganizationsByAccess(allOrganizations, currentUser);
    } else {
      filteredOrgs = allOrganizations.filter(org => org.level?.slug === levelSlug);
      filteredOrgs = filterOrganizationsByAccess(filteredOrgs, currentUser);
    }
    
    setFilteredOrganizations(filteredOrgs);
  };

  const handleReset = () => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setSearch("");
    setFilterLevel("");
    setFilterRole("");
    setFilterOrganization("");
    
    const accessibleOrgs = filterOrganizationsByAccess(allOrganizations, currentUser);
    setFilteredOrganizations(accessibleOrgs);
    setOrganizations(accessibleOrgs);
    
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchUsers(1);
  };

  const handleDelete = async (user) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus user");
      return;
    }

    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      async () => {
        const result = await userService.delete(user.id);
        if (result.success) {
          success("Berhasil", result.message);
          await fetchUsers(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      },
    );
  };

  const openCreateForm = () => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menambah user");
      return;
    }

    setEditingUser(null);
    setFormData({
      role_id: "",
      organization_id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      is_active: true,
      is_blocked: false,
      can_login: true,
    });
    setAvailableRoles([]);
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForm(true);
  };

  const openEditForm = (user) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk mengedit user");
      return;
    }

    setEditingUser(user);
    setFormData({
      role_id: user.role_id?.toString() || "",
      organization_id: user.organization_id?.toString() || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      password_confirmation: "",
      is_active: user.is_active ?? true,
      is_blocked: user.is_blocked ?? false,
      can_login: user.can_login ?? true,
    });
    
    // Fetch available roles for the user's organization
    if (user.organization_id) {
      fetchAvailableRoles(user.organization_id);
    } else {
      setAvailableRoles([]);
    }
    
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setAvailableRoles([]);
    setFormData({
      role_id: "",
      organization_id: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      is_active: true,
      is_blocked: false,
      can_login: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.role_id) errors.role_id = "Role wajib dipilih";
    if (!formData.organization_id) errors.organization_id = "Organisasi wajib dipilih";
    if (!formData.name.trim()) errors.name = "Nama lengkap wajib diisi";
    if (!formData.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Format email tidak valid";
    }
    if (!editingUser && !formData.password) {
      errors.password = "Password wajib diisi";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = "Konfirmasi password tidak cocok";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let result;

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

    if (editingUser) {
      result = await userService.update(editingUser.id, submitData);
    } else {
      result = await userService.create(submitData);
    }

    if (result.success) {
      success("Berhasil", result.message);
      closeForm();
      await fetchUsers(pagination.current_page);
    } else {
      if (result.errors) {
        setFormErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
      } else {
        error("Gagal", result.message);
      }
    }
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // If organization changes, fetch available roles and reset role_id
    if (name === "organization_id" && value) {
      fetchAvailableRoles(parseInt(value));
      setFormData((prev) => ({ ...prev, role_id: "" }));
    }
    
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getStatusBadge = (isActive, isBlocked, canLogin) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Tidak Aktif
        </span>
      );
    }
    if (isBlocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
          Diblokir
        </span>
      );
    }
    if (!canLogin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
          Tidak Bisa Login
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600">
        Aktif
      </span>
    );
  };

  const getRoleBadge = (roleName, roleSlug) => {
    const colors = {
      "super-admin": "bg-gradient-to-r from-red-500 to-red-600 text-white",
      admin: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      operator: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      anggota: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    };
    const color = colors[roleSlug] || "bg-gray-500 text-white";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {roleName || "-"}
      </span>
    );
  };

  const hasActiveFilters = search || filterLevel || filterRole || filterOrganization;

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchUsers(newPage);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="w-8 h-8 text-emerald-600" />
                Manajemen User
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data pengguna, role, dan akses sistem
              </p>
            </div>
            {canManage && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah User
              </button>
            )}
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">

              {/* Grid Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <option key={level.id} value={level.slug}>
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
                    onChange={(e) => setFilterOrganization(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                    disabled={!filterLevel}
                  >
                    <option value="">Pilih Level Terlebih Dahulu</option>
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
                    ROLE
                  </label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              )}
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
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Telepon</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data user</p>
                            {canManage && (
                              <button
                                onClick={openCreateForm}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah User Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                          <td className="text-center px-6 py-4">
                            <span className="font-semibold text-gray-800">
                              {user.name}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {user.email}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex justify-center">
                              {getRoleBadge(user.role?.nama, user.role?.slug)}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className="text-sm text-gray-600">
                                {user.organization?.nama || "-"}
                              </span>
                              {user.organization?.level && (
                                <span className="text-xs text-gray-400">
                                  {user.organization.level.display_name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {user.phone || "-"}
                            </span>
                          </td>
                          <td className="text-center px-6 py-4">
                            <div className="flex justify-center">
                              {getStatusBadge(
                                user.is_active,
                                user.is_blocked,
                                user.can_login,
                              )}
                            </div>
                          </td>
                          <td className="text-center px-6 py-4">
                            {canManage && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditForm(user)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-100">
                {users.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Tidak ada data user</p>
                    </div>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-linear-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{user.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditForm(user)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Role</p>
                          <div className="mt-1">{getRoleBadge(user.role?.nama, user.role?.slug)}</div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Organisasi</p>
                          <p className="text-gray-700 mt-1">
                            {user.organization?.nama || "-"}
                            {user.organization?.level && (
                              <span className="text-xs text-gray-400 block">
                                {user.organization.level.display_name}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">No. Telepon</p>
                          <p className="text-gray-700 mt-1">{user.phone || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <div className="mt-1">
                            {getStatusBadge(user.is_active, user.is_blocked, user.can_login)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && !loading && users.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    Menampilkan{" "}
                    {(pagination.current_page - 1) * pagination.per_page + 1} -{" "}
                    {Math.min(
                      pagination.current_page * pagination.per_page,
                      pagination.total,
                    )}{" "}
                    dari {pagination.total} data
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
                      {Array.from(
                        { length: Math.min(5, pagination.last_page) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.current_page <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.current_page >=
                            pagination.last_page - 2
                          ) {
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
                        },
                      )}
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

      {/* Modal Form */}
      {showForm && canManage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="relative flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingUser ? "Edit User" : "Tambah User Baru"}
                  </h2>
                  <p className="text-emerald-100 text-sm mt-0.5">
                    {editingUser
                      ? "Ubah data pengguna dan akses sistem"
                      : "Isi form berikut untuk menambahkan pengguna baru"}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
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
                          formErrors.role_id ? "border-red-500" : "border-gray-200"
                        } ${(!formData.organization_id || loadingRoles) ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                      >
                        <option value="">{loadingRoles ? "Memuat role..." : "Pilih Role"}</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formErrors.role_id && <p className="mt-1 text-xs text-red-500">{formErrors.role_id}</p>}
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
                          formErrors.organization_id ? "border-red-500" : "border-gray-200"
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
                    {formErrors.organization_id && <p className="mt-1 text-xs text-red-500">{formErrors.organization_id}</p>}
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
                        formErrors.name ? "border-red-500" : "border-gray-200"
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
                          formErrors.email ? "border-red-500" : "border-gray-200"
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
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.password ? "border-red-500" : "border-gray-200"
                        }`}
                        placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
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
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          formErrors.password_confirmation ? "border-red-500" : "border-gray-200"
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
                    {formErrors.password_confirmation && <p className="mt-1 text-xs text-red-500">{formErrors.password_confirmation}</p>}
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

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UsersPage;