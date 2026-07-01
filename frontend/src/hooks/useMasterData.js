// src/hooks/useMasterData.js
import { useQuery } from '@tanstack/react-query';
import { organizationLevelService } from '../services/organizationLevel';
import { organizationTypeService } from '../services/organizationType';
import { kotaService } from '../services/kota';
import { kecamatanService } from '../services/kecamatan';
import { kelurahanService } from '../services/kelurahan';
import { rwService } from '../services/rw';
import { useAuth } from '../contexts/AuthContext';

export const masterDataKeys = {
  all: ['master'],
  levels: () => [...masterDataKeys.all, 'levels'],
  types: () => [...masterDataKeys.all, 'types'],
  kotas: () => [...masterDataKeys.all, 'kotas'],
  kecamatans: () => [...masterDataKeys.all, 'kecamatans'],
  kelurahans: () => [...masterDataKeys.all, 'kelurahans'],
  rws: () => [...masterDataKeys.all, 'rws'],
  kecamatanByKota: (kotaId) => [...masterDataKeys.all, 'kecamatans', kotaId],
  kelurahanByKecamatan: (kecamatanId) => [...masterDataKeys.all, 'kelurahans', kecamatanId],
  rwByKelurahan: (kelurahanId) => [...masterDataKeys.all, 'rws', kelurahanId],
};

// ============================================
// MASTER DATA HOOKS - Optimized
// ============================================

export const useOrganizationLevels = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.levels(),
    queryFn: async () => {
      const result = await organizationLevelService.getAll({ per_page: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 menit
    gcTime: 60 * 60 * 1000, // 1 jam
    retry: 1,
  });
};

export const useOrganizationTypes = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.types(),
    queryFn: async () => {
      const result = await organizationTypeService.getAll({ per_page: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
};

export const useKotas = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.kotas(),
    queryFn: async () => {
      const result = await kotaService.getAll({ per_page: 1000 });
      if (!result.success) throw new Error(result.message);
      return result.data.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 jam
    gcTime: 24 * 60 * 60 * 1000, // 24 jam
    retry: 1,
  });
};

export const useAllKecamatans = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.kecamatans(),
    queryFn: async () => {
      const result = await kecamatanService.getAll({ per_page: 1000 });
      if (!result.success) throw new Error(result.message);
      return result.data.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};

export const useAllKelurahans = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.kelurahans(),
    queryFn: async () => {
      const result = await kelurahanService.getAll({ per_page: 1000 });
      if (!result.success) throw new Error(result.message);
      return result.data.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};

export const useAllRws = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.rws(),
    queryFn: async () => {
      const result = await rwService.getAll({ per_page: 1000 });
      if (!result.success) throw new Error(result.message);
      return result.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};

// ============================================
// DEPENDENT MASTER DATA HOOKS - Optimized
// ============================================

export const useKecamatansByKota = (kotaId) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.kecamatanByKota(kotaId),
    queryFn: async () => {
      if (!kotaId) return [];
      const result = await kecamatanService.getAvailableForMWC(kotaId);
      if (!result.success) throw new Error(result.message);
      return result.data || [];
    },
    enabled: isAuthenticated && !!kotaId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};

export const useKelurahansByKecamatan = (kecamatanId) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.kelurahanByKecamatan(kecamatanId),
    queryFn: async () => {
      if (!kecamatanId) return [];
      const result = await kelurahanService.getAvailableForRanting(kecamatanId);
      if (!result.success) throw new Error(result.message);
      return result.data || [];
    },
    enabled: isAuthenticated && !!kecamatanId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};

export const useRwsByKelurahan = (kelurahanId) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: masterDataKeys.rwByKelurahan(kelurahanId),
    queryFn: async () => {
      if (!kelurahanId) return [];
      const result = await rwService.getAvailableForAnakRanting(kelurahanId);
      if (!result.success) throw new Error(result.message);
      return result.data || [];
    },
    enabled: isAuthenticated && !!kelurahanId,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
};