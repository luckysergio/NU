import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { organizationService } from "../../services/organization";
import { organizationLevelService } from "../../services/organizationLevel";
import { organizationTypeService } from "../../services/organizationType";
import { kotaService } from "../../services/kota";
import { kecamatanService } from "../../services/kecamatan";
import { kelurahanService } from "../../services/kelurahan";
import { rwService } from "../../services/rw";
import MainLayout from "../../components/layout/MainLayout";
import { ArrowLeft, Save, Building2, MapPin, Phone, Mail, Plus, X, Loader2 } from "lucide-react";

const OrganizationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { success, error } = useModal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState([]);
  const [types, setTypes] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [kotas, setKotas] = useState([]);
  const [availableKotas, setAvailableKotas] = useState([]);
  const [kecamatans, setKecamatans] = useState([]);
  const [availableKecamatans, setAvailableKecamatans] = useState([]);
  const [kelurahans, setKelurahans] = useState([]);
  const [availableKelurahans, setAvailableKelurahans] = useState([]);
  const [rws, setRws] = useState([]);
  const [availableRws, setAvailableRws] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [parentOrganizations, setParentOrganizations] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedParentType, setSelectedParentType] = useState(null);
  const [isBanomPc, setIsBanomPc] = useState(true);
  
  const [showKotaModal, setShowKotaModal] = useState(false);
  const [showKecamatanModal, setShowKecamatanModal] = useState(false);
  const [showKelurahanModal, setShowKelurahanModal] = useState(false);
  const [showRWModal, setShowRWModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newKotaName, setNewKotaName] = useState("");
  const [newKecamatanName, setNewKecamatanName] = useState("");
  const [newKelurahanName, setNewKelurahanName] = useState("");
  const [newRWName, setNewRWName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [submittingModal, setSubmittingModal] = useState(false);
  
  const [formData, setFormData] = useState({
    organization_level_id: "",
    organization_type_id: "",
    parent_id: "",
    kota_id: "",
    kecamatan_id: "",
    kelurahan_id: "",
    rw_id: "",
    nama: "",
    alamat: "",
    telepon: "",
    email: "",
    logo: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  const isEdit = !!id;

  // Determine which fields to show
  const showKota = selectedLevel?.slug === "pc";
  const showKecamatan = selectedLevel?.slug === "mwc";
  const showKelurahan = selectedLevel?.slug === "ranting";
  const showRW = selectedLevel?.slug === "anak-ranting";
  const showType = selectedLevel && ["lembaga", "banom"].includes(selectedLevel.slug);
  const showParent = selectedLevel && !["pc"].includes(selectedLevel.slug);
  const showKecamatanForBanom = selectedLevel?.slug === "banom" && !isBanomPc && formData.parent_id;

  // Get parent details with caching
  const parentDetailsCache = new Map();
  
  const getParentDetails = async (parentId) => {
    if (!parentId) return null;
    
    if (parentDetailsCache.has(parentId)) {
      return parentDetailsCache.get(parentId);
    }
    
    const result = await organizationService.getById(parentId);
    if (result.success && result.data) {
      parentDetailsCache.set(parentId, result.data);
      return result.data;
    }
    return null;
  };

  // Fetch parent organizations based on level
  const fetchParentOrganizations = async (levelSlug, levelId = null, typeId = null) => {
    let params = { per_page: 100 };
    
    if (levelSlug === "mwc") {
      params.organization_level_id = 1;
    } else if (levelSlug === "ranting") {
      params.organization_level_id = 2;
    } else if (levelSlug === "anak-ranting") {
      params.organization_level_id = 3;
    } else if (levelSlug === "lembaga") {
      const result = await organizationService.getAvailableParentsForLembagaBanom(levelId, typeId, isEdit ? parseInt(id) : null);
      if (result.success) {
        const sortedData = result.data || [];
        sortedData.sort((a, b) => {
          const aIsPC = a.level?.nama === 'PC';
          const bIsPC = b.level?.nama === 'PC';
          if (aIsPC && !bIsPC) return -1;
          if (!aIsPC && bIsPC) return 1;
          return a.nama.localeCompare(b.nama);
        });
        setParentOrganizations(sortedData);
        return;
      }
    } else if (levelSlug === "banom") {
      const result = await organizationService.getAvailableParentsForLembagaBanom(levelId, typeId, isEdit ? parseInt(id) : null);
      if (result.success) {
        const sortedData = result.data || [];
        sortedData.sort((a, b) => {
          const aIsPCNU = a._parent_type === 'pcnu';
          const bIsPCNU = b._parent_type === 'pcnu';
          if (aIsPCNU && !bIsPCNU) return -1;
          if (!aIsPCNU && bIsPCNU) return 1;
          return a.nama.localeCompare(b.nama);
        });
        setParentOrganizations(sortedData);
        return;
      }
    }
    
    const result = await organizationService.getAll(params);
    if (result.success && result.data?.data) {
      setParentOrganizations(result.data.data);
    } else {
      setParentOrganizations([]);
    }
  };

  const fetchLevels = async () => {
    const result = await organizationLevelService.getAll({ per_page: 100 });
    if (result.success && result.data?.data) {
      setLevels(result.data.data);
    }
  };

  const fetchAvailableTypesForBanom = async (levelId, parentId = null) => {
    const ignoreOrgId = isEdit ? parseInt(id) : null;
    
    try {
      if (!parentId) {
        setAvailableTypes([]);
        return;
      }
      
      const parentOrg = await getParentDetails(parentId);
      if (!parentOrg) {
        setAvailableTypes([]);
        return;
      }
      
      if (parentOrg.organization_level_id === 1) {
        // Banom PC - parent adalah PCNU
        setIsBanomPc(true);
        setSelectedParentType('pcnu');
        
        const result = await organizationService.getAvailableTypesForBanom(
          levelId, 
          true,
          ignoreOrgId
        );
        
        if (result.success && result.data) {
          setAvailableTypes(result.data);
        } else {
          setAvailableTypes([]);
        }
        
        setFormData(prev => ({ 
          ...prev, 
          organization_type_id: "",
          kecamatan_id: "" 
        }));
        setAvailableKecamatans([]);
        
      } 
      else if (parentOrg.organization_level_id === 6) {
        // Banom MWC - parent adalah Banom PC
        setIsBanomPc(false);
        setSelectedParentType('banom_pc');
        
        const parentTypeId = parentOrg.organization_type_id;
        
        if (parentTypeId) {
          const result = await organizationService.getAvailableTypesForBanom(
            levelId, 
            false,
            ignoreOrgId
          );
          
          if (result.success && result.data) {
            const available = result.data.filter(type => type.id === parentTypeId);
            setAvailableTypes(available);
          } else {
            setAvailableTypes([]);
          }
          
          setFormData(prev => ({ 
            ...prev, 
            organization_type_id: parentTypeId.toString(),
            kota_id: parentOrg.kota_id?.toString() || "",
            kecamatan_id: parentOrg.kecamatan_id?.toString() || ""
          }));
          
          if (parentOrg.kota_id && parentTypeId) {
            await fetchAvailableKecamatansForBanom(parentOrg.kota_id, parentTypeId);
          }
        } else {
          setAvailableTypes([]);
          setFormData(prev => ({ ...prev, organization_type_id: "" }));
        }
      } else {
        setAvailableTypes([]);
      }
    } catch (err) {
      console.error("Error fetching available types for Banom:", err);
      setAvailableTypes([]);
    }
  };

  // ============ PERBAIKAN UTAMA ============
  const fetchAvailableKecamatansForBanom = async (kotaId, typeId = null) => {
    if (!kotaId) {
      setAvailableKecamatans([]);
      return;
    }
    
    setLoadingAvailable(true);
    try {
      const result = await kecamatanService.getAll({ 
        kota_id: kotaId,
        per_page: 1000 
      });
      
      if (result.success && result.data?.data) {
        let available = result.data.data;
        
        if (typeId) {
          // PERBAIKAN: Ambil data dari usedResult.data
          const usedResult = await organizationService.getUsedKecamatanForBanom(
            typeId, 
            isEdit ? parseInt(id) : null
          );
          
          // Akses data dari usedResult.data
          const usedIds = Array.isArray(usedResult.data) ? usedResult.data : [];
          
          // Filter: hanya tampilkan kecamatan yang BELUM digunakan
          available = available.filter(kec => !usedIds.includes(kec.id));
        }
        
        setAvailableKecamatans(available);
      } else {
        setAvailableKecamatans([]);
      }
    } catch (err) {
      console.error("Error fetching available kecamatans for Banom:", err);
      setAvailableKecamatans([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchUnusedTypesByLevel = async (levelId) => {
    const ignoreOrgId = isEdit ? parseInt(id) : null;
    const result = await organizationTypeService.getUnusedByLevel(levelId, ignoreOrgId);
    if (result.success && result.data) {
      setAvailableTypes(result.data);
      setTypes(result.data);
    } else {
      setTypes([]);
      setAvailableTypes([]);
    }
  };

  const fetchTypesForParent = async (parentId, levelId) => {
    if (!parentId) {
      setAvailableTypes([]);
      return;
    }
    const result = await organizationService.getAvailableTypesForParent(parentId, levelId, isEdit ? parseInt(id) : null);
    if (result.success && result.data) {
      setAvailableTypes(result.data);
    } else {
      setAvailableTypes([]);
    }
  };

  const fetchAllKotas = async () => {
    const result = await kotaService.getAll({ per_page: 1000 });
    if (result.success && result.data?.data) {
      setKotas(result.data.data);
    }
  };

  const fetchAvailableKotas = async () => {
    const result = await kotaService.getAvailableForPC();
    if (result.success && result.data) {
      setAvailableKotas(result.data);
    } else {
      setAvailableKotas([]);
    }
  };

  const fetchAvailableKecamatans = async (kotaId) => {
    if (!kotaId) {
      setAvailableKecamatans([]);
      return;
    }
    
    setLoadingAvailable(true);
    try {
      const result = await kecamatanService.getAvailableForMWC(kotaId);
      if (result.success && Array.isArray(result.data)) {
        setAvailableKecamatans(result.data);
      } else if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        setAvailableKecamatans(result.data.data);
      } else {
        setAvailableKecamatans([]);
      }
    } catch (err) {
      console.error("Error fetching available kecamatans:", err);
      setAvailableKecamatans([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchKecamatansByKota = async (kotaId) => {
    if (!kotaId) {
      setKecamatans([]);
      return;
    }
    
    const result = await kecamatanService.getAll({ kota_id: kotaId, per_page: 1000 });
    if (result.success && result.data?.data) {
      setKecamatans(result.data.data);
    } else {
      setKecamatans([]);
    }
  };

  const fetchAvailableKelurahans = async (kecamatanId) => {
    if (!kecamatanId) {
      setAvailableKelurahans([]);
      return;
    }
    
    setLoadingAvailable(true);
    try {
      const result = await kelurahanService.getAvailableForRanting(kecamatanId);
      if (result.success && Array.isArray(result.data)) {
        setAvailableKelurahans(result.data);
      } else if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        setAvailableKelurahans(result.data.data);
      } else {
        setAvailableKelurahans([]);
      }
    } catch (err) {
      console.error("Error fetching available kelurahans:", err);
      setAvailableKelurahans([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchKelurahansByKecamatan = async (kecamatanId) => {
    if (!kecamatanId) {
      setKelurahans([]);
      return;
    }
    
    const result = await kelurahanService.getAll({ kecamatan_id: kecamatanId, per_page: 100 });
    if (result.success && result.data?.data) {
      setKelurahans(result.data.data);
    } else {
      setKelurahans([]);
    }
  };

  const fetchAvailableRws = async (kelurahanId) => {
    if (!kelurahanId) {
      setAvailableRws([]);
      return;
    }
    
    setLoadingAvailable(true);
    try {
      const result = await rwService.getAvailableForAnakRanting(
        kelurahanId, 
        isEdit ? parseInt(id) : null
      );
      
      if (result.success && Array.isArray(result.data)) {
        setAvailableRws(result.data);
      } else {
        setAvailableRws([]);
      }
    } catch (err) {
      console.error("Error fetching available RWs:", err);
      setAvailableRws([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchRwsByKelurahan = async (kelurahanId) => {
    if (!kelurahanId) {
      setRws([]);
      return;
    }
    
    const result = await rwService.getAll({ kelurahan_id: kelurahanId });
    if (result.success && result.data) {
      setRws(result.data);
    } else {
      setRws([]);
    }
  };

  const handleParentChange = async (e) => {
    const parentId = e.target.value;
    setFormData(prev => ({ ...prev, parent_id: parentId }));
    setSelectedParentType(null);
    
    if (!parentId) {
      setAvailableTypes([]);
      setAvailableKecamatans([]);
      return;
    }
    
    try {
      const parentOrg = await getParentDetails(parentId);
      
      if (parentOrg) {
        // MWC
        if (selectedLevel?.slug === "mwc") {
          if (parentOrg.kota_id) {
            setFormData(prev => ({ 
              ...prev, 
              kota_id: parentOrg.kota_id.toString(),
              kecamatan_id: "",
              kelurahan_id: ""
            }));
            await fetchAvailableKecamatans(parentOrg.kota_id);
          }
        } 
        // Ranting
        else if (selectedLevel?.slug === "ranting") {
          if (parentOrg.kecamatan_id) {
            setFormData(prev => ({ 
              ...prev, 
              kecamatan_id: parentOrg.kecamatan_id.toString(),
              kelurahan_id: ""
            }));
            await fetchAvailableKelurahans(parentOrg.kecamatan_id);
          }
          if (parentOrg.kota_id) {
            setFormData(prev => ({ ...prev, kota_id: parentOrg.kota_id.toString() }));
          }
        } 
        // Anak Ranting
        else if (selectedLevel?.slug === "anak-ranting") {
          if (parentOrg.kelurahan_id) {
            setFormData(prev => ({ 
              ...prev, 
              kelurahan_id: parentOrg.kelurahan_id.toString(),
              rw_id: ""
            }));
            await fetchAvailableRws(parentOrg.kelurahan_id);
          }
          if (parentOrg.kecamatan_id) {
            setFormData(prev => ({ ...prev, kecamatan_id: parentOrg.kecamatan_id.toString() }));
          }
          if (parentOrg.kota_id) {
            setFormData(prev => ({ ...prev, kota_id: parentOrg.kota_id.toString() }));
          }
        } 
        // Lembaga
        else if (selectedLevel?.slug === "lembaga") {
          if (parentOrg.kota_id) {
            setFormData(prev => ({ ...prev, kota_id: parentOrg.kota_id.toString() }));
          }
          if (parentOrg.kecamatan_id) {
            setFormData(prev => ({ ...prev, kecamatan_id: parentOrg.kecamatan_id.toString() }));
          }
          await fetchTypesForParent(parentId, selectedLevel.id);
        }
        // Banom
        else if (selectedLevel?.slug === "banom") {
          const selectedParent = parentOrganizations.find(p => p.id == parentId);
          if (selectedParent) {
            setSelectedParentType(selectedParent._parent_type);
          }
          
          if (parentOrg.organization_level_id === 1) {
            // Banom PC - parent adalah PCNU
            setIsBanomPc(true);
            setSelectedParentType('pcnu');
            
            if (parentOrg.kota_id) {
              setFormData(prev => ({ 
                ...prev, 
                kota_id: parentOrg.kota_id.toString(),
                kecamatan_id: "",
                organization_type_id: ""
              }));
            }
            setAvailableKecamatans([]);
            
            await fetchAvailableTypesForBanom(selectedLevel.id, parentId);
            
          } 
          else if (parentOrg.organization_level_id === 6) {
            // Banom MWC - parent adalah Banom PC
            setIsBanomPc(false);
            setSelectedParentType('banom_pc');
            
            const parentTypeId = parentOrg.organization_type_id;
            
            if (parentOrg.kota_id) {
              setFormData(prev => ({ 
                ...prev, 
                kota_id: parentOrg.kota_id.toString()
              }));
            }
            
            if (parentOrg.kecamatan_id) {
              setFormData(prev => ({ 
                ...prev, 
                kecamatan_id: parentOrg.kecamatan_id.toString()
              }));
            }
            
            if (parentTypeId) {
              setFormData(prev => ({ 
                ...prev, 
                organization_type_id: parentTypeId.toString() 
              }));
            }
            
            await fetchAvailableTypesForBanom(selectedLevel.id, parentId);
            
            // ============ PERBAIKAN ============
            const effectiveTypeId = parentTypeId || parentOrg.organization_type_id;
            
            if (parentOrg.kota_id && effectiveTypeId) {
              await fetchAvailableKecamatansForBanom(parentOrg.kota_id, effectiveTypeId);
            } else if (parentOrg.kota_id) {
              await fetchAvailableKecamatansForBanom(parentOrg.kota_id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error getting parent details:", err);
    }
  };

  const handleTypeChange = async (e) => {
    const typeId = e.target.value;
    setFormData(prev => ({ ...prev, organization_type_id: typeId }));
    
    // Banom PC - ketika memilih type, fetch kecamatan yang tersedia
    if (selectedLevel?.slug === "banom" && isBanomPc) {
      setFormData(prev => ({ ...prev, kecamatan_id: "" }));
      if (formData.kota_id && typeId) {
        await fetchAvailableKecamatansForBanom(formData.kota_id, parseInt(typeId));
      }
    }
  };

  const fetchOrganization = async () => {
    setLoading(true);
    const result = await organizationService.getById(id);
    if (result.success && result.data) {
      const data = result.data;
      setFormData({
        organization_level_id: data.organization_level_id?.toString() || "",
        organization_type_id: data.organization_type_id?.toString() || "",
        parent_id: data.parent_id?.toString() || "",
        kota_id: data.kota_id?.toString() || "",
        kecamatan_id: data.kecamatan_id?.toString() || "",
        kelurahan_id: data.kelurahan_id?.toString() || "",
        rw_id: data.rw_id?.toString() || "",
        nama: data.nama || "",
        alamat: data.alamat || "",
        telepon: data.telepon || "",
        email: data.email || "",
        logo: data.logo || "",
        is_active: data.is_active ?? true,
      });
      
      if (data.organization_level_id) {
        const level = levels.find(l => l.id == data.organization_level_id);
        if (level) {
          setSelectedLevel(level);
          
          if (level.slug === "lembaga") {
            if (data.parent_id) {
              await fetchTypesForParent(data.parent_id, level.id);
            }
          }
          else if (level.slug === "banom") {
            if (data.parent_id) {
              const parent = await getParentDetails(data.parent_id);
              if (parent) {
                const isPcnu = parent.organization_level_id === 1;
                setIsBanomPc(isPcnu);
                setSelectedParentType(isPcnu ? 'pcnu' : 'banom_pc');
                
                if (parent.kota_id) {
                  setFormData(prev => ({ ...prev, kota_id: parent.kota_id.toString() }));
                }
                if (parent.kecamatan_id && !isPcnu) {
                  setFormData(prev => ({ ...prev, kecamatan_id: parent.kecamatan_id.toString() }));
                }
                if (!isPcnu && parent.organization_type_id) {
                  setFormData(prev => ({ ...prev, organization_type_id: parent.organization_type_id.toString() }));
                }
                
                await fetchAvailableTypesForBanom(level.id, data.parent_id);
                await fetchParentOrganizations(level.slug, level.id, data.organization_type_id);
                
                if (!isPcnu && parent.kota_id && parent.organization_type_id) {
                  await fetchAvailableKecamatansForBanom(parent.kota_id, parent.organization_type_id);
                }
              }
            } else {
              setIsBanomPc(true);
              await fetchParentOrganizations(level.slug, level.id);
            }
          }
          else {
            if (level.slug === "mwc" && data.kota_id) {
              await fetchAvailableKecamatans(data.kota_id);
            }
            if (level.slug === "ranting" && data.kecamatan_id) {
              await fetchAvailableKelurahans(data.kecamatan_id);
            }
            if (level.slug === "anak-ranting" && data.kelurahan_id) {
              await fetchAvailableRws(data.kelurahan_id);
            }
            if (level.slug !== "pc") {
              await fetchParentOrganizations(level.slug, level.id);
            }
          }
        }
      }
    } else {
      error("Gagal", result.message);
      navigate("/organizations");
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchLevels(),
        fetchAllKotas(),
        fetchAvailableKotas()
      ]);
      if (isEdit) {
        await fetchOrganization();
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const handleLevelChange = async () => {
      if (formData.organization_level_id) {
        const level = levels.find(l => l.id == formData.organization_level_id);
        setSelectedLevel(level);
        
        setFormData(prev => ({
          ...prev,
          organization_type_id: "",
          parent_id: "",
          kota_id: "",
          kecamatan_id: "",
          kelurahan_id: "",
          rw_id: "",
        }));
        setSelectedParentType(null);
        setIsBanomPc(true);
        setAvailableTypes([]);
        setParentOrganizations([]);
        setAvailableKecamatans([]);
        
        parentDetailsCache.clear();
        
        if (level) {
          if (level.slug === "lembaga") {
            await fetchParentOrganizations(level.slug, level.id);
          } else if (level.slug === "banom") {
            setIsBanomPc(true);
            await fetchParentOrganizations(level.slug, level.id);
          } else if (level.slug !== "pc") {
            await fetchParentOrganizations(level.slug, level.id);
          }
          
          setAvailableKecamatans([]);
          setAvailableKelurahans([]);
          setAvailableRws([]);
          setKecamatans([]);
          setKelurahans([]);
          setRws([]);
        }
      } else {
        setSelectedLevel(null);
        setTypes([]);
        setAvailableTypes([]);
        setParentOrganizations([]);
        setSelectedParentType(null);
        setIsBanomPc(true);
        setAvailableKecamatans([]);
        parentDetailsCache.clear();
      }
    };
    
    handleLevelChange();
  }, [formData.organization_level_id, levels]);

  useEffect(() => {
    if (selectedLevel?.slug === "mwc" && formData.kota_id) {
      fetchAvailableKecamatans(formData.kota_id);
      fetchKecamatansByKota(formData.kota_id);
      setFormData(prev => ({ ...prev, kecamatan_id: "", kelurahan_id: "" }));
    }
  }, [formData.kota_id, selectedLevel]);

  useEffect(() => {
    if (selectedLevel?.slug === "ranting" && formData.kecamatan_id) {
      fetchAvailableKelurahans(formData.kecamatan_id);
      fetchKelurahansByKecamatan(formData.kecamatan_id);
      setFormData(prev => ({ ...prev, kelurahan_id: "" }));
    }
  }, [formData.kecamatan_id, selectedLevel]);

  useEffect(() => {
    if (selectedLevel?.slug === "anak-ranting" && formData.kelurahan_id) {
      fetchAvailableRws(formData.kelurahan_id);
      fetchRwsByKelurahan(formData.kelurahan_id);
      setFormData(prev => ({ ...prev, rw_id: "" }));
    }
  }, [formData.kelurahan_id, selectedLevel, id, isEdit]);

  const handleCreateKota = async () => {
    if (!newKotaName.trim()) {
      error("Gagal", "Nama kota wajib diisi");
      return;
    }
    
    setSubmittingModal(true);
    const result = await kotaService.create({ nama: newKotaName });
    if (result.success) {
      success("Berhasil", result.message);
      await Promise.all([
        fetchAllKotas(),
        fetchAvailableKotas()
      ]);
      setShowKotaModal(false);
      setNewKotaName("");
      setFormData(prev => ({ ...prev, kota_id: result.data.id.toString() }));
    } else {
      error("Gagal", result.message);
    }
    setSubmittingModal(false);
  };

  const handleCreateKecamatan = async () => {
    if (!newKecamatanName.trim()) {
      error("Gagal", "Nama kecamatan wajib diisi");
      return;
    }
    if (!formData.kota_id) {
      error("Gagal", "Pilih kota terlebih dahulu");
      return;
    }
    
    setSubmittingModal(true);
    const result = await kecamatanService.create({ 
      nama: newKecamatanName,
      kota_id: formData.kota_id
    });
    if (result.success) {
      success("Berhasil", result.message);
      await Promise.all([
        fetchAvailableKecamatans(formData.kota_id),
        fetchKecamatansByKota(formData.kota_id)
      ]);
      if (selectedLevel?.slug === "banom" && formData.organization_type_id) {
        await fetchAvailableKecamatansForBanom(formData.kota_id, formData.organization_type_id);
      }
      setShowKecamatanModal(false);
      setNewKecamatanName("");
      setFormData(prev => ({ ...prev, kecamatan_id: result.data.id.toString() }));
    } else {
      error("Gagal", result.message);
    }
    setSubmittingModal(false);
  };

  const handleCreateKelurahan = async () => {
    if (!newKelurahanName.trim()) {
      error("Gagal", "Nama kelurahan wajib diisi");
      return;
    }
    if (!formData.kecamatan_id) {
      error("Gagal", "Pilih kecamatan terlebih dahulu");
      return;
    }
    
    setSubmittingModal(true);
    const result = await kelurahanService.create({ 
      nama: newKelurahanName,
      kecamatan_id: formData.kecamatan_id
    });
    if (result.success) {
      success("Berhasil", result.message);
      await Promise.all([
        fetchAvailableKelurahans(formData.kecamatan_id),
        fetchKelurahansByKecamatan(formData.kecamatan_id)
      ]);
      setShowKelurahanModal(false);
      setNewKelurahanName("");
      setFormData(prev => ({ ...prev, kelurahan_id: result.data.id.toString() }));
    } else {
      error("Gagal", result.message);
    }
    setSubmittingModal(false);
  };

  const handleCreateRW = async () => {
    if (!newRWName.trim()) {
      error("Gagal", "Nomor RW wajib diisi");
      return;
    }
    if (!formData.kelurahan_id) {
      error("Gagal", "Pilih kelurahan terlebih dahulu");
      return;
    }
    
    setSubmittingModal(true);
    const result = await rwService.create({ 
      nomor: newRWName,
      kelurahan_id: formData.kelurahan_id,
      is_active: true
    });
    if (result.success) {
      success("Berhasil", result.message);
      await Promise.all([
        fetchAvailableRws(formData.kelurahan_id),
        fetchRwsByKelurahan(formData.kelurahan_id)
      ]);
      setShowRWModal(false);
      setNewRWName("");
      setFormData(prev => ({ ...prev, rw_id: result.data.id.toString() }));
    } else {
      error("Gagal", result.message);
    }
    setSubmittingModal(false);
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      error("Gagal", "Nama tipe organisasi wajib diisi");
      return;
    }
    if (!selectedLevel?.id) {
      error("Gagal", "Pilih level organisasi terlebih dahulu");
      return;
    }
    
    setSubmittingModal(true);
    const result = await organizationTypeService.create({ 
      nama: newTypeName,
      organization_level_id: selectedLevel.id
    });
    if (result.success) {
      success("Berhasil", result.message);
      if (selectedLevel.slug === "banom") {
        await fetchAvailableTypesForBanom(selectedLevel.id, formData.parent_id);
      } else if (selectedLevel.slug === "lembaga") {
        await fetchTypesForParent(formData.parent_id, selectedLevel.id);
      } else {
        await fetchUnusedTypesByLevel(selectedLevel.id);
      }
      setShowTypeModal(false);
      setNewTypeName("");
      setFormData(prev => ({ ...prev, organization_type_id: result.data.id.toString() }));
    } else {
      error("Gagal", result.message);
    }
    setSubmittingModal(false);
  };

  const handleKotaChange = (e) => {
    const kotaId = e.target.value;
    setFormData(prev => ({ ...prev, kota_id: kotaId, kecamatan_id: "", kelurahan_id: "", rw_id: "" }));
  };

  const handleKecamatanChange = (e) => {
    const kecamatanId = e.target.value;
    setFormData(prev => ({ ...prev, kecamatan_id: kecamatanId, kelurahan_id: "", rw_id: "" }));
  };

  const handleKelurahanChange = (e) => {
    const kelurahanId = e.target.value;
    setFormData(prev => ({ ...prev, kelurahan_id: kelurahanId, rw_id: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    let result;
    if (isEdit) {
      result = await organizationService.update(id, formData);
    } else {
      result = await organizationService.create(formData);
    }

    if (result.success) {
      success("Berhasil", result.message);
      navigate("/organizations");
    } else {
      if (result.errors) {
        setErrors(result.errors);
        error("Validasi Gagal", "Silakan periksa kembali form Anda");
      } else {
        error("Gagal", result.message);
      }
    }
    setSaving(false);
  };

  const Modal = ({ isOpen, onClose, title, onSubmit, value, setValue, submitting, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4 rounded-t-2xl">
            <div className="relative flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {children ? children : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Masukkan nama ${title.toLowerCase()}`}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={onSubmit} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/organizations")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <Building2 className="w-8 h-8 text-emerald-600" />
                {isEdit ? "Edit Organisasi" : "Tambah Organisasi Baru"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEdit ? "Ubah data organisasi Nahdatul Ulama" : "Isi form berikut untuk menambahkan organisasi baru"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nama Organisasi - Full Width */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Organisasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.nama ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Masukkan nama organisasi"
                />
                {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama[0]}</p>}
              </div>

              {/* Level Organisasi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Level Organisasi <span className="text-red-500">*</span>
                </label>
                <select
                  name="organization_level_id"
                  value={formData.organization_level_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.organization_level_id ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Pilih Level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.nama === "PC" ? "PCNU" : level.nama === "Anak Ranting" ? "ANAK RANTING" : level.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent - Untuk semua level kecuali PC */}
              {showParent && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Organisasi Induk <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleParentChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Organisasi Induk</option>
                    {parentOrganizations.map((org) => {
                      let label = org._display_name || org.nama;
                      if (org.level?.nama && !org._display_name) {
                        label += ` (${org.level.nama === "PC" ? "PCNU" : org.level.nama})`;
                      }
                      return (
                        <option key={org.id} value={org.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {selectedLevel?.slug === "banom" && (
                    <p className="mt-1 text-xs text-blue-600">
                      📌 Pilih PCNU untuk Banom tingkat PC, atau pilih Banom tingkat PC untuk Banom tingkat MWC
                    </p>
                  )}
                  {selectedLevel?.slug === "lembaga" && (
                    <p className="mt-1 text-xs text-blue-600">📌 Pilih PC atau MWC sebagai induk Lembaga</p>
                  )}
                </div>
              )}

              {/* Type - Untuk Lembaga dan Banom */}
              {showType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tipe Organisasi <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="organization_type_id"
                      value={formData.organization_type_id}
                      onChange={handleTypeChange}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.organization_type_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={selectedLevel?.slug === "banom" && selectedParentType === 'banom_pc'}
                    >
                      <option value="">Pilih Tipe</option>
                      {availableTypes.length > 0 ? (
                        availableTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.nama}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {selectedLevel?.slug === "banom" 
                            ? selectedParentType === 'pcnu'
                              ? "Semua tipe sudah memiliki Banom PC" 
                              : selectedParentType === 'banom_pc'
                                ? "Tipe otomatis dari parent" 
                                : "Pilih parent terlebih dahulu"
                            : "Tidak ada tipe tersedia"}
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowTypeModal(true)}
                      className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      disabled={!formData.parent_id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {availableTypes.length === 0 && selectedLevel && formData.parent_id && (
                    <p className="mt-1 text-xs text-amber-600">
                      {selectedLevel.slug === "banom" 
                        ? selectedParentType === 'pcnu'
                          ? "Semua tipe Banom sudah memiliki organisasi tingkat PC. Buat tipe baru dengan klik tombol '+'." 
                          : "Tipe otomatis terisi dari parent"
                        : "Semua tipe sudah digunakan untuk induk ini"}
                    </p>
                  )}
                  {selectedLevel?.slug === "banom" && selectedParentType === 'banom_pc' && formData.organization_type_id && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ Tipe otomatis dari Banom tingkat PC: {availableTypes.find(t => t.id == formData.organization_type_id)?.nama}
                    </p>
                  )}
                  {selectedLevel?.slug === "banom" && selectedParentType === 'pcnu' && (
                    <p className="mt-1 text-xs text-blue-600">
                      📌 Menampilkan tipe yang BELUM memiliki Banom PC
                    </p>
                  )}
                </div>
              )}

              {/* Kota - Untuk PC dan Banom (readonly untuk Banom) */}
              {(showKota || (selectedLevel?.slug === "banom" && formData.parent_id)) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kota/Kabupaten
                    {selectedLevel?.slug === "banom" && (
                      <span className="ml-1 text-emerald-600 text-xs font-normal">(Otomatis dari induk)</span>
                    )}
                    {showKota && <span className="text-red-500">*</span>}
                  </label>
                  {selectedLevel?.slug === "banom" ? (
                    <div className="px-3 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700">
                      {formData.kota_id ? kotas.find(k => k.id == formData.kota_id)?.nama || '-' : '-'}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        name="kota_id"
                        value={formData.kota_id}
                        onChange={handleKotaChange}
                        className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.kota_id ? "border-red-500" : "border-gray-200"
                        }`}
                      >
                        <option value="">Pilih Kota/Kabupaten</option>
                        {availableKotas.map((kota) => (
                          <option key={kota.id} value={kota.id}>
                            {kota.nama}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowKotaModal(true)}
                        className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {availableKotas.length === 0 && kotas.length > 0 && showKota && (
                    <p className="mt-1 text-xs text-amber-600">Semua kota sudah memiliki organisasi PC</p>
                  )}
                </div>
              )}

              {/* Kecamatan - Untuk MWC biasa */}
              {showKecamatan && selectedLevel?.slug !== "banom" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="kecamatan_id"
                      value={formData.kecamatan_id}
                      onChange={handleKecamatanChange}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.kecamatan_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={!formData.kota_id || loadingAvailable}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {loadingAvailable ? (
                        <option value="" disabled>Memuat data kecamatan...</option>
                      ) : availableKecamatans.length > 0 ? (
                        availableKecamatans.map((kecamatan) => (
                          <option key={kecamatan.id} value={kecamatan.id}>
                            {kecamatan.nama}
                          </option>
                        ))
                      ) : (
                        formData.kota_id && (
                          <option value="" disabled>Semua kecamatan sudah memiliki MWC</option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowKecamatanModal(true)}
                      className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      disabled={!formData.kota_id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.parent_id && (
                    <p className="mt-1 text-xs text-emerald-600">✓ Kota otomatis terisi dari induk PC</p>
                  )}
                </div>
              )}

              {/* Kecamatan - Untuk Banom MWC (bisa dipilih) */}
              {showKecamatanForBanom && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="kecamatan_id"
                      value={formData.kecamatan_id}
                      onChange={handleKecamatanChange}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.kecamatan_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={!formData.kota_id || loadingAvailable}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {loadingAvailable ? (
                        <option value="" disabled>Memuat data kecamatan...</option>
                      ) : availableKecamatans.length > 0 ? (
                        availableKecamatans.map((kecamatan) => (
                          <option key={kecamatan.id} value={kecamatan.id}>
                            {kecamatan.nama}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Semua kecamatan sudah memiliki Banom untuk tipe ini</option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowKecamatanModal(true)}
                      className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      disabled={!formData.kota_id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600">✓ Pilih kecamatan untuk Banom tingkat MWC</p>
                </div>
              )}

              {/* Kelurahan - Untuk Ranting */}
              {showKelurahan && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kelurahan/Desa <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="kelurahan_id"
                      value={formData.kelurahan_id}
                      onChange={handleKelurahanChange}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.kelurahan_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={!formData.kecamatan_id || loadingAvailable}
                    >
                      <option value="">Pilih Kelurahan/Desa</option>
                      {loadingAvailable ? (
                        <option value="" disabled>Memuat data kelurahan...</option>
                      ) : availableKelurahans.length > 0 ? (
                        availableKelurahans.map((kelurahan) => (
                          <option key={kelurahan.id} value={kelurahan.id}>
                            {kelurahan.nama}
                          </option>
                        ))
                      ) : (
                        formData.kecamatan_id && (
                          <option value="" disabled>Semua kelurahan sudah memiliki Ranting</option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowKelurahanModal(true)}
                      className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      disabled={!formData.kecamatan_id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* RW - Untuk Anak Ranting */}
              {showRW && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    RW <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="rw_id"
                      value={formData.rw_id}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.rw_id ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={!formData.kelurahan_id || loadingAvailable}
                    >
                      <option value="">Pilih RW</option>
                      {loadingAvailable ? (
                        <option value="" disabled>Memuat data RW...</option>
                      ) : availableRws.length > 0 ? (
                        availableRws.map((rw) => (
                          <option key={rw.id} value={rw.id}>
                            RW {rw.nomor}
                          </option>
                        ))
                      ) : (
                        formData.kelurahan_id && (
                          <option value="" disabled>Semua RW sudah memiliki Anak Ranting</option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowRWModal(true)}
                      className="px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                      disabled={!formData.kelurahan_id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

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
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="email@organisasi.com"
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

              {/* Alamat - Full Width */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Alamat
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Alamat lengkap organisasi"
                  />
                </div>
              </div>

              {/* Active Status - Full Width */}
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Aktif</span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/organizations")}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showKotaModal} onClose={() => setShowKotaModal(false)} title="Kota/Kabupaten Baru" onSubmit={handleCreateKota} value={newKotaName} setValue={setNewKotaName} submitting={submittingModal} />
      
      <Modal isOpen={showKecamatanModal} onClose={() => setShowKecamatanModal(false)} title="Kecamatan Baru" onSubmit={handleCreateKecamatan} value={newKecamatanName} setValue={setNewKecamatanName} submitting={submittingModal}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten</label>
            <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" value={formData.kota_id || ""} onChange={(e) => setFormData(prev => ({ ...prev, kota_id: e.target.value }))}>
              <option value="">Pilih Kota</option>
              {kotas.map(kota => <option key={kota.id} value={kota.id}>{kota.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kecamatan</label>
            <input type="text" value={newKecamatanName} onChange={(e) => setNewKecamatanName(e.target.value)} placeholder="Masukkan nama kecamatan" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" autoFocus />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showKelurahanModal} onClose={() => setShowKelurahanModal(false)} title="Kelurahan/Desa Baru" onSubmit={handleCreateKelurahan} value={newKelurahanName} setValue={setNewKelurahanName} submitting={submittingModal}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
            <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" value={formData.kecamatan_id || ""} onChange={(e) => setFormData(prev => ({ ...prev, kecamatan_id: e.target.value }))}>
              <option value="">Pilih Kecamatan</option>
              {kecamatans.map(kec => <option key={kec.id} value={kec.id}>{kec.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelurahan/Desa</label>
            <input type="text" value={newKelurahanName} onChange={(e) => setNewKelurahanName(e.target.value)} placeholder="Masukkan nama kelurahan/desa" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" autoFocus />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRWModal} onClose={() => setShowRWModal(false)} title="RW Baru" onSubmit={handleCreateRW} value={newRWName} setValue={setNewRWName} submitting={submittingModal}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan/Desa</label>
            <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" value={formData.kelurahan_id || ""} onChange={(e) => setFormData(prev => ({ ...prev, kelurahan_id: e.target.value }))}>
              <option value="">Pilih Kelurahan</option>
              {kelurahans.map(kel => <option key={kel.id} value={kel.id}>{kel.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor RW</label>
            <input type="text" value={newRWName} onChange={(e) => setNewRWName(e.target.value)} placeholder="Masukkan nomor RW (contoh: 01)" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl" autoFocus />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTypeModal} onClose={() => setShowTypeModal(false)} title="Tipe Organisasi Baru" onSubmit={handleCreateType} value={newTypeName} setValue={setNewTypeName} submitting={submittingModal} />
    </MainLayout>
  );
};

export default OrganizationForm;