import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { usePermissions } from "../../hooks/usePermissions";
import { organizationService } from "../../services/organization";
import { organizationLevelService } from "../../services/organizationLevel";
import { organizationTypeService } from "../../services/organizationType";
import { kotaService } from "../../services/kota";
import { kecamatanService } from "../../services/kecamatan";
import { kelurahanService } from "../../services/kelurahan";
import { rwService } from "../../services/rw";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Filter,
  Layers,
  MapPin,
  Tag,
  Plus,
  Users,
} from "lucide-react";

const Organizations = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useModal();
  const permissions = usePermissions();
  
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [filterLevel, setFilterLevel] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [filterKota, setFilterKota] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterRW, setFilterRW] = useState("");
  
  const [debouncedFilterLevel, setDebouncedFilterLevel] = useState("");
  const [debouncedFilterType, setDebouncedFilterType] = useState("");
  const [debouncedFilterParent, setDebouncedFilterParent] = useState("");
  const [debouncedFilterKota, setDebouncedFilterKota] = useState("");
  const [debouncedFilterKecamatan, setDebouncedFilterKecamatan] = useState("");
  const [debouncedFilterKelurahan, setDebouncedFilterKelurahan] = useState("");
  const [debouncedFilterRW, setDebouncedFilterRW] = useState("");
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  
  const [levels, setLevels] = useState([]);
  const [types, setTypes] = useState([]);
  const [parentOrganizations, setParentOrganizations] = useState([]);
  const [filterableTypes, setFilterableTypes] = useState([]);
  const [kotas, setKotas] = useState([]);
  const [kecamatans, setKecamatans] = useState([]);
  const [kelurahans, setKelurahans] = useState([]);
  const [rws, setRws] = useState([]);
  const [allKecamatans, setAllKecamatans] = useState([]);
  const [allKelurahans, setAllKelurahans] = useState([]);
  const [allRws, setAllRws] = useState([]);
  const [selectedLevelSlug, setSelectedLevelSlug] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  
  const isFetchingRef = useRef(false);
  const filterTimeoutRef = useRef(null);
  const levelFilterTimeoutRef = useRef(null);

  const user = permissions.user;
  const userRole = user?.role?.slug;
  const canManage = userRole === "super-admin" || userRole === "admin";

  const levelOptions = [
    { id: 1, name: "PC", slug: "pc", display: "PCNU" },
    { id: 2, name: "MWC", slug: "mwc", display: "MWCNU" },
    { id: 3, name: "Ranting", slug: "ranting", display: "RANTING" },
    { id: 4, name: "Anak Ranting", slug: "anak-ranting", display: "ANAK RANTING" },
    { id: 5, name: "Lembaga", slug: "lembaga", display: "LEMBAGA" },
    { id: 6, name: "Banom", slug: "banom", display: "BANOM" },
  ];

  const fetchLevels = async () => {
    const result = await organizationLevelService.getAll({ per_page: 100 });
    if (result.success) {
      setLevels(result.data.data);
    }
  };

  const fetchTypes = async () => {
    const result = await organizationTypeService.getAll({ per_page: 100 });
    if (result.success) {
      setTypes(result.data.data);
    }
  };

  const fetchTypesByLevel = async (levelId) => {
    if (!levelId) {
      setFilterableTypes([]);
      return;
    }
    const result = await organizationTypeService.getAll({ 
      organization_level_id: levelId,
      per_page: 100 
    });
    if (result.success && result.data?.data) {
      setFilterableTypes(result.data.data);
    } else {
      setFilterableTypes([]);
    }
  };

  // Fetch parent organizations for Lembaga/Banom filter
  const fetchParentOrganizations = async (levelId) => {
    if (!levelId) {
      setParentOrganizations([]);
      return;
    }
    
    try {
      if (selectedLevelSlug === "lembaga") {
        // For Lembaga: parent = PC atau MWC
        // Fetch PC
        const pcResult = await organizationService.getAll({ 
          organization_level_id: 1, // PC level
          per_page: 100 
        });
        
        // Fetch MWC
        const mwcResult = await organizationService.getAll({ 
          organization_level_id: 2, // MWC level
          per_page: 100 
        });
        
        let parents = [];
        
        if (pcResult.success && pcResult.data?.data) {
          parents = [...parents, ...pcResult.data.data];
        }
        
        if (mwcResult.success && mwcResult.data?.data) {
          parents = [...parents, ...mwcResult.data.data];
        }
        
        // Sort: PC first, then MWC
        parents.sort((a, b) => {
          const aIsPC = a.level?.nama === 'PC';
          const bIsPC = b.level?.nama === 'PC';
          if (aIsPC && !bIsPC) return -1;
          if (!aIsPC && bIsPC) return 1;
          return a.nama.localeCompare(b.nama);
        });
        
        setParentOrganizations(parents);
        
      } else if (selectedLevelSlug === "banom") {
        // For Banom: parent = PC atau Banom tingkat PC
        // Fetch PC
        const pcResult = await organizationService.getAll({ 
          organization_level_id: 1, // PC level
          per_page: 100 
        });
        
        // Fetch Banom tingkat PC (Banom with parent level = PC)
        // Kita perlu fetch semua Banom dan filter yang parentnya PC
        const banomResult = await organizationService.getAll({ 
          organization_level_id: 6, // Banom level
          per_page: 1000 
        });
        
        let parents = [];
        
        // Add PC
        if (pcResult.success && pcResult.data?.data) {
          // Tambahkan label PC untuk membedakan
          const pcWithLabel = pcResult.data.data.map(pc => ({
            ...pc,
            _display_name: `${pc.nama} (PCNU)`
          }));
          parents = [...parents, ...pcWithLabel];
        }
        
        // Add Banom PC (Banom with parent level = PC)
        if (banomResult.success && banomResult.data?.data) {
          const banomPc = banomResult.data.data.filter(org => 
            org.parent?.level?.nama === 'PC'
          );
          // Tambahkan label Banom PC
          const banomPcWithLabel = banomPc.map(org => ({
            ...org,
            _display_name: `${org.nama} (Banom Tingkat PC)`
          }));
          parents = [...parents, ...banomPcWithLabel];
        }
        
        // Sort: PC first, then Banom PC
        parents.sort((a, b) => {
          const aIsPC = a.level?.nama === 'PC';
          const bIsPC = b.level?.nama === 'PC';
          if (aIsPC && !bIsPC) return -1;
          if (!aIsPC && bIsPC) return 1;
          return a.nama.localeCompare(b.nama);
        });
        
        setParentOrganizations(parents);
        
      } else {
        setParentOrganizations([]);
      }
    } catch (err) {
      console.error("Error fetching parent organizations:", err);
      setParentOrganizations([]);
    }
  };

  const fetchKotas = async () => {
    const result = await kotaService.getAll({ per_page: 1000 });
    if (result.success) {
      setKotas(result.data.data);
    }
  };

  const fetchAllKecamatans = async () => {
    const result = await kecamatanService.getAll({ per_page: 1000 });
    if (result.success) {
      setAllKecamatans(result.data.data);
    }
  };

  const fetchAllKelurahans = async () => {
    const result = await kelurahanService.getAll({ per_page: 1000 });
    if (result.success) {
      setAllKelurahans(result.data.data);
    }
  };

  const fetchAllRws = async () => {
    const result = await rwService.getAll({ per_page: 1000 });
    if (result.success) {
      setAllRws(result.data);
    }
  };

  const fetchKecamatansByKota = async (kotaId) => {
    if (!kotaId) {
      setKecamatans([]);
      return;
    }
    const result = await kecamatanService.getAll({ kota_id: kotaId, per_page: 100 });
    if (result.success) {
      setKecamatans(result.data.data);
    }
  };

  const fetchKelurahansByKecamatan = async (kecamatanId) => {
    if (!kecamatanId) {
      setKelurahans([]);
      return;
    }
    const result = await kelurahanService.getAll({ kecamatan_id: kecamatanId, per_page: 100 });
    if (result.success) {
      setKelurahans(result.data.data);
    }
  };

  const fetchRwsByKelurahan = async (kelurahanId) => {
    if (!kelurahanId) {
      setRws([]);
      return;
    }
    const result = await rwService.getAll({ kelurahan_id: kelurahanId });
    if (result.success) {
      setRws(result.data);
    }
  };

  const fetchOrganizations = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    
    const params = {
      page,
      per_page: pagination.per_page,
    };
    
    if (debouncedFilterLevel) params.organization_level_id = debouncedFilterLevel;
    if (debouncedFilterType) params.organization_type_id = debouncedFilterType;
    if (debouncedFilterParent) params.parent_id = debouncedFilterParent;
    if (debouncedFilterKota) params.kota_id = debouncedFilterKota;
    if (debouncedFilterKecamatan) params.kecamatan_id = debouncedFilterKecamatan;
    if (debouncedFilterKelurahan) params.kelurahan_id = debouncedFilterKelurahan;
    if (debouncedFilterRW) params.rw_id = debouncedFilterRW;

    const result = await organizationService.getAll(params);

    if (result.success) {
      setOrganizations(result.data.data);
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
  }, [pagination.per_page, error, debouncedFilterLevel, debouncedFilterType, debouncedFilterParent, debouncedFilterKota, debouncedFilterKecamatan, debouncedFilterKelurahan, debouncedFilterRW]);

  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    filterTimeoutRef.current = setTimeout(() => {
      setDebouncedFilterLevel(filterLevel);
      setDebouncedFilterType(filterType);
      setDebouncedFilterParent(filterParent);
      setDebouncedFilterKota(filterKota);
      setDebouncedFilterKecamatan(filterKecamatan);
      setDebouncedFilterKelurahan(filterKelurahan);
      setDebouncedFilterRW(filterRW);
      setPagination(prev => ({ ...prev, current_page: 1 }));
    }, 500);
    
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [filterLevel, filterType, filterParent, filterKota, filterKecamatan, filterKelurahan, filterRW]);

  useEffect(() => {
    if (!initialLoading) {
      fetchOrganizations(1);
    }
  }, [debouncedFilterLevel, debouncedFilterType, debouncedFilterParent, debouncedFilterKota, debouncedFilterKecamatan, debouncedFilterKelurahan, debouncedFilterRW, fetchOrganizations, initialLoading]);

  // Fetch parent organizations when level changes (for Lembaga/Banom)
  useEffect(() => {
    if (selectedLevelId && (selectedLevelSlug === "lembaga" || selectedLevelSlug === "banom")) {
      fetchParentOrganizations(selectedLevelId);
      // Reset parent filter when level changes
      setFilterParent("");
      setDebouncedFilterParent("");
    } else {
      setParentOrganizations([]);
      if (filterParent) {
        setFilterParent("");
        setDebouncedFilterParent("");
      }
    }
  }, [selectedLevelId, selectedLevelSlug]);

  // Update dependent dropdowns when filters change
  useEffect(() => {
    if (filterKota && (selectedLevelSlug === "mwc" || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting")) {
      fetchKecamatansByKota(filterKota);
      setFilterKecamatan("");
      setFilterKelurahan("");
      setFilterRW("");
    }
  }, [filterKota, selectedLevelSlug]);

  useEffect(() => {
    if (filterKecamatan && (selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting")) {
      fetchKelurahansByKecamatan(filterKecamatan);
      setFilterKelurahan("");
      setFilterRW("");
    }
  }, [filterKecamatan, selectedLevelSlug]);

  useEffect(() => {
    if (filterKelurahan && selectedLevelSlug === "anak-ranting") {
      fetchRwsByKelurahan(filterKelurahan);
      setFilterRW("");
    }
  }, [filterKelurahan, selectedLevelSlug]);

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchLevels(),
        fetchTypes(),
        fetchKotas(),
        fetchAllKecamatans(),
        fetchAllKelurahans(),
        fetchAllRws(),
      ]);
      setInitialLoading(false);
      await fetchOrganizations(1);
    };
    loadInitialData();
  }, []);

  const handleFilterLevel = (levelId) => {
    if (levelFilterTimeoutRef.current) {
      clearTimeout(levelFilterTimeoutRef.current);
    }
    
    setFilterLevel(levelId);
    
    setFilterType("");
    setFilterParent("");
    setFilterKota("");
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterRW("");
    setKecamatans([]);
    setKelurahans([]);
    setRws([]);
    setParentOrganizations([]);
    
    const selectedLevel = levelOptions.find(l => l.id.toString() === levelId);
    setSelectedLevelSlug(selectedLevel?.slug || "");
    setSelectedLevelId(levelId || "");
    
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterParentChange = (e) => {
    setFilterParent(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterKotaChange = (e) => {
    const kotaId = e.target.value;
    setFilterKota(kotaId);
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterRW("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterKecamatanChange = (e) => {
    setFilterKecamatan(e.target.value);
    setFilterKelurahan("");
    setFilterRW("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterKelurahanChange = (e) => {
    setFilterKelurahan(e.target.value);
    setFilterRW("");
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleFilterRWChange = (e) => {
    setFilterRW(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleReset = () => {
    setFilterLevel("");
    setFilterType("");
    setFilterParent("");
    setFilterKota("");
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterRW("");
    setSelectedLevelSlug("");
    setSelectedLevelId("");
    setKecamatans([]);
    setKelurahans([]);
    setRws([]);
    setFilterableTypes([]);
    setParentOrganizations([]);
    
    setDebouncedFilterLevel("");
    setDebouncedFilterType("");
    setDebouncedFilterParent("");
    setDebouncedFilterKota("");
    setDebouncedFilterKecamatan("");
    setDebouncedFilterKelurahan("");
    setDebouncedFilterRW("");
    
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleDelete = (org) => {
    if (!canManage) {
      error("Akses Ditolak", "Anda tidak memiliki izin untuk menghapus organisasi");
      return;
    }
    
    warning(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus organisasi "${org.nama}"?`,
      async () => {
        const result = await organizationService.delete(org.id);
        if (result.success) {
          success("Berhasil", result.message);
          await fetchOrganizations(pagination.current_page);
        } else {
          error("Gagal", result.message);
        }
      }
    );
  };

  const handlePageChange = async (newPage) => {
    if (newPage === pagination.current_page) return;
    await fetchOrganizations(newPage);
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

  const getLevelBadgeColor = (levelName) => {
    const colors = {
      PC: "bg-purple-100 text-purple-700",
      MWC: "bg-blue-100 text-blue-700",
      Ranting: "bg-green-100 text-green-700",
      "Anak Ranting": "bg-teal-100 text-teal-700",
      Lembaga: "bg-orange-100 text-orange-700",
      Banom: "bg-pink-100 text-pink-700",
    };
    return colors[levelName] || "bg-gray-100 text-gray-700";
  };

  const getLevelDisplayName = (levelName) => {
    if (levelName === "PC") return "PCNU";
    if (levelName === "MWC") return "MWCNU";
    if (levelName === "Ranting") return "RANTING";
    if (levelName === "Anak Ranting") return "ANAK RANTING";
    return levelName || "-";
  };

  // Determine table columns based on selected level
  const getTableColumns = () => {
    switch (selectedLevelSlug) {
      case "pc":
        return ["nama", "level", "kota", "status"];
      case "mwc":
        return ["nama", "level", "kota", "kecamatan", "status"];
      case "ranting":
        return ["nama", "level", "kota", "kecamatan", "kelurahan", "status"];
      case "anak-ranting":
        return ["nama", "level", "kota", "kecamatan", "kelurahan", "rw", "status"];
      case "lembaga":
      case "banom":
        return ["nama", "level", "tipe", "parent", "lokasi", "status"];
      default:
        return ["nama", "level", "tipe", "lokasi", "status"];
    }
  };

  const renderTableHeader = () => {
    const columns = getTableColumns();
    return (
      <tr>
        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
        {columns.includes("nama") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Organisasi</th>}
        {columns.includes("level") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>}
        {columns.includes("tipe") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>}
        {columns.includes("parent") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisasi Induk</th>}
        {columns.includes("kota") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kota/Kabupaten</th>}
        {columns.includes("kecamatan") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kecamatan</th>}
        {columns.includes("kelurahan") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelurahan/Desa</th>}
        {columns.includes("rw") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">RW</th>}
        {columns.includes("lokasi") && <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>}
        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
      </tr>
    );
  };

  const renderTableRow = (org, index) => {
    const columns = getTableColumns();
    return (
      <tr key={org.id} className="hover:bg-gray-50 transition-colors duration-200">
        <td className="text-center px-6 py-4 text-sm text-gray-600">
          {(pagination.current_page - 1) * pagination.per_page + index + 1}
        </td>
        {columns.includes("nama") && (
          <td className="text-center px-6 py-4">
            <div>
              <div className="font-semibold text-gray-800">{org.nama}</div>
              <div className="text-xs text-gray-400">{org.slug}</div>
            </div>
          </td>
        )}
        {columns.includes("level") && (
          <td className="text-center px-6 py-4">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(org.level?.nama)}`}>
              {getLevelDisplayName(org.level?.nama)}
            </span>
          </td>
        )}
        {columns.includes("tipe") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.type?.nama || "-"}
          </td>
        )}
        {columns.includes("parent") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.parent?.nama || "-"}
          </td>
        )}
        {columns.includes("kota") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.kota?.nama || "-"}
          </td>
        )}
        {columns.includes("kecamatan") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.kecamatan?.nama || "-"}
          </td>
        )}
        {columns.includes("kelurahan") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.kelurahan?.nama || "-"}
          </td>
        )}
        {columns.includes("rw") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.rw?.nomor ? `RW ${org.rw?.nomor}` : "-"}
          </td>
        )}
        {columns.includes("lokasi") && (
          <td className="text-center px-6 py-4 text-sm text-gray-600">
            {org.kota?.nama || org.kecamatan?.nama || org.kelurahan?.nama || (org.rw?.nomor ? `RW ${org.rw?.nomor}` : "-")}
          </td>
        )}
        <td className="text-center px-6 py-4">
          {getStatusBadge(org.is_active)}
        </td>
        <td className="text-center px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(`/organizations/${org.id}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Detail"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => navigate(`/organizations/${org.id}/edit`)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(org)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const showTypeFilter = selectedLevelSlug === "lembaga" || selectedLevelSlug === "banom";
  const showParentFilter = selectedLevelSlug === "lembaga" || selectedLevelSlug === "banom";
  const showKotaFilter = selectedLevelSlug === "mwc" || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting";
  const showKecamatanFilter = (selectedLevelSlug === "mwc" && filterKota) || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting";
  const showKelurahanFilter = (selectedLevelSlug === "ranting" && filterKecamatan) || selectedLevelSlug === "anak-ranting";
  const showRWFilter = selectedLevelSlug === "anak-ranting" && filterKelurahan;

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
                Manajemen Organisasi
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola data organisasi Nahdatul Ulama
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => navigate("/organizations/create")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Tambah Organisasi
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-5 sm:p-6">

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  LEVEL ORGANISASI
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterLevel("")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filterLevel === ""
                        ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Semua Level
                  </button>
                  {levelOptions.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleFilterLevel(level.id.toString())}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                        filterLevel === level.id.toString()
                          ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      {level.display}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Parent untuk Lembaga/Banom */}
              {filterLevel && showParentFilter && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    ORGANISASI INDUK
                  </label>
                  <select
                    value={filterParent}
                    onChange={handleFilterParentChange}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Semua Induk</option>
                    {parentOrganizations.map((org) => {
                      // Gunakan _display_name jika ada (untuk Banom), atau buat label sendiri
                      let label = org._display_name || org.nama;
                      if (!org._display_name && org.level?.nama) {
                        label += ` (${org.level.nama === "PC" ? "PCNU" : org.level.nama})`;
                      }
                      return (
                        <option key={org.id} value={org.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {parentOrganizations.length === 0 && selectedLevelSlug && (
                    <p className="mt-1 text-xs text-amber-600">
                      {selectedLevelSlug === "lembaga" 
                        ? "Belum ada data PC atau MWC sebagai induk Lembaga" 
                        : "Belum ada data PC atau Banom tingkat PC sebagai induk Banom"}
                    </p>
                  )}
                </div>
              )}

              {/* Filter Wilayah untuk MWC, Ranting, Anak Ranting */}
              {filterLevel && (selectedLevelSlug === "mwc" || selectedLevelSlug === "ranting" || selectedLevelSlug === "anak-ranting") && (
                <div className="mb-0 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-700">Filter Wilayah:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {showKotaFilter && (
                      <select
                        value={filterKota}
                        onChange={handleFilterKotaChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Pilih Kota/Kabupaten</option>
                        {kotas.map((kota) => (
                          <option key={kota.id} value={kota.id}>
                            {kota.nama}
                          </option>
                        ))}
                      </select>
                    )}

                    {showKecamatanFilter && (
                      <select
                        value={filterKecamatan}
                        onChange={handleFilterKecamatanChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        disabled={!filterKota && selectedLevelSlug !== "ranting"}
                      >
                        <option value="">Pilih Kecamatan</option>
                        {kecamatans.map((kecamatan) => (
                          <option key={kecamatan.id} value={kecamatan.id}>
                            {kecamatan.nama}
                          </option>
                        ))}
                      </select>
                    )}

                    {showKelurahanFilter && (
                      <select
                        value={filterKelurahan}
                        onChange={handleFilterKelurahanChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        disabled={!filterKecamatan}
                      >
                        <option value="">Pilih Kelurahan/Desa</option>
                        {kelurahans.map((kelurahan) => (
                          <option key={kelurahan.id} value={kelurahan.id}>
                            {kelurahan.nama}
                          </option>
                        ))}
                      </select>
                    )}

                    {showRWFilter && (
                      <select
                        value={filterRW}
                        onChange={handleFilterRWChange}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        disabled={!filterKelurahan}
                      >
                        <option value="">Pilih RW</option>
                        {rws.map((rw) => (
                          <option key={rw.id} value={rw.id}>
                            RW {rw.nomor}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {(filterLevel || filterType || filterParent || filterKota || filterKecamatan || filterKelurahan || filterRW) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>

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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    {renderTableHeader()}
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {organizations.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data organisasi</p>
                            {canManage && (
                              <button
                                onClick={() => navigate("/organizations/create")}
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                + Tambah Organisasi Baru
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      organizations.map((org, index) => renderTableRow(org, index))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.last_page > 1 && (
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
    </MainLayout>
  );
};

export default Organizations;