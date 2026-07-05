<?php

namespace App\Services;

use App\Models\Kecamatan;
use App\Models\Organization;
use App\Models\OrganizationLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class KecamatanService
{
    protected const CACHE_DURATION = 3600; // 1 jam
    protected const CACHE_PREFIX = 'kecamatan_';

    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $kotaId = $request->query('kota_id');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $kotaId)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'kota_id' => $kotaId,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($search, $kotaId, $perPage) {
            return $this->buildQuery($search, $kotaId)->paginate($perPage);
        });
    }

    /**
     * Build query dengan select yang efisien
     * 
     * @param mixed $kotaId
     */
    protected function buildQuery(string $search, $kotaId)
    {
        $query = Kecamatan::query()
            ->select(['id', 'kota_id', 'nama', 'kode', 'is_active', 'created_at'])
            ->with(['kota' => function ($q) {
                $q->select(['id', 'nama', 'kode', 'is_active']);
            }])
            ->withCount(['kelurahans as kelurahans_count' => function ($q) {
                $q->where('is_active', true);
            }])
            ->when($search, function ($q) use ($search) {
                $search = strtolower($search);
                return $q->where(function ($query) use ($search) {
                    $query->where('nama', 'LIKE', "%{$search}%")
                        ->orWhere('kode', 'LIKE', "%{$search}%");
                });
            })
            ->when($kotaId, fn($q) => $q->where('kota_id', $kotaId))
            ->orderBy('nama', 'asc');

        return $query;
    }

    public function findById(int $id): Kecamatan
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            return Kecamatan::with([
                'kota',
                'kelurahans' => function ($q) {
                    $q->select(['id', 'kecamatan_id', 'nama', 'kode', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                },
                'organizations' => function ($q) {
                    $q->select(['id', 'kecamatan_id', 'nama', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                },
            ])->findOrFail($id);
        });
    }

    /**
     * Get available kecamatan for MWC
     */
    public function availableForMWC(?int $ignoreOrganizationId = null, ?int $kotaId = null)
    {
        if (!$kotaId) {
            return collect([]);
        }

        $cacheKey = $this->getCacheKey('available_for_mwc', [
            'ignore' => $ignoreOrganizationId,
            'kota_id' => $kotaId,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($ignoreOrganizationId, $kotaId) {
            $usedKecamatanIds = Organization::query()
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'mwc');
                })
                ->whereNotNull('kecamatan_id')
                ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
                    $q->where('id', '!=', $ignoreOrganizationId);
                })
                ->pluck('kecamatan_id')
                ->unique()
                ->toArray();

            return Kecamatan::query()
                ->select(['id', 'kota_id', 'nama', 'kode', 'is_active'])
                ->with('kota')
                ->where('kota_id', $kotaId)
                ->where('is_active', true)
                ->whereNotIn('id', $usedKecamatanIds)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    /**
     * Get available kecamatan for Banom
     * Returns all kecamatan in a kota, excluding those already used by Banom with same type
     */
    public function availableForBanom(?int $kotaId = null, ?int $typeId = null, ?int $currentId = null)
    {
        if (!$kotaId) {
            return collect([]);
        }

        $cacheKey = $this->getCacheKey('available_for_banom', [
            'kota_id' => $kotaId,
            'type_id' => $typeId,
            'current_id' => $currentId,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($kotaId, $typeId, $currentId) {
            // Ambil semua kecamatan di kota
            $allKecamatan = Kecamatan::query()
                ->select(['id', 'kota_id', 'nama', 'kode', 'is_active'])
                ->with('kota')
                ->where('kota_id', $kotaId)
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();

            // Jika tidak ada typeId, return semua kecamatan
            if (!$typeId) {
                return $allKecamatan;
            }

            // Ambil kecamatan yang sudah digunakan oleh Banom dengan tipe yang sama
            $banomLevel = OrganizationLevel::where('slug', 'banom')->first();
            
            if (!$banomLevel) {
                return $allKecamatan;
            }

            $usedKecamatanIds = Organization::where('organization_type_id', $typeId)
                ->where('organization_level_id', $banomLevel->id)
                ->whereNotNull('kecamatan_id')
                ->when($currentId, fn($q) => $q->where('id', '!=', $currentId))
                ->pluck('kecamatan_id')
                ->unique()
                ->toArray();

            // Filter kecamatan yang belum digunakan
            return $allKecamatan->filter(function ($kecamatan) use ($usedKecamatanIds) {
                return !in_array($kecamatan->id, $usedKecamatanIds);
            })->values();
        });
    }

    /**
     * Get kecamatan by kota ID
     */
    public function getByKota(int $kotaId)
    {
        $cacheKey = $this->getCacheKey('by_kota_' . $kotaId);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($kotaId) {
            return Kecamatan::select(['id', 'kota_id', 'nama', 'kode', 'is_active'])
                ->where('kota_id', $kotaId)
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function store(array $data, Request $request): Kecamatan
    {
        DB::beginTransaction();

        try {
            $exists = Kecamatan::where('kota_id', $data['kota_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kecamatan sudah digunakan di kota ini.');
            }

            $kecamatan = Kecamatan::create([
                'kota_id' => $data['kota_id'],
                'nama' => $data['nama'],
                'kode' => strtoupper($data['kode'] ?? null),
                'is_active' => $data['is_active'] ?? true,
            ]);

            ActivityLogService::logCreated($kecamatan, 'KECAMATAN', $request);

            $this->clearAllCache();

            DB::commit();

            return $kecamatan->load('kota');
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): Kecamatan
    {
        DB::beginTransaction();

        try {
            $kecamatan = Kecamatan::findOrFail($id);

            $exists = Kecamatan::where('kota_id', $data['kota_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kecamatan sudah digunakan di kota ini.');
            }

            $oldValues = $kecamatan->toArray();

            $kecamatan->update([
                'kota_id' => $data['kota_id'],
                'nama' => $data['nama'],
                'kode' => strtoupper($data['kode'] ?? null),
                'is_active' => $data['is_active'] ?? true,
            ]);

            $kecamatan->refresh();

            $newValues = $kecamatan->toArray();

            $changedFields = [];
            foreach ($newValues as $key => $value) {
                if (isset($oldValues[$key]) && $oldValues[$key] != $value) {
                    $changedFields[$key] = $value;
                }
            }

            if (!empty($changedFields)) {
                $oldChangedValues = [];
                foreach ($changedFields as $key => $value) {
                    $oldChangedValues[$key] = $oldValues[$key] ?? null;
                }

                ActivityLogService::logUpdated(
                    $kecamatan,
                    'KECAMATAN',
                    $oldChangedValues,
                    $changedFields,
                    $request
                );
            }

            $this->clearAllCache();

            DB::commit();

            return $kecamatan->load('kota');
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $kecamatan = Kecamatan::findOrFail($id);

            if ($kecamatan->organizations()->exists()) {
                throw new \Exception('Kecamatan masih digunakan oleh organisasi MWC.');
            }

            if ($kecamatan->kelurahans()->exists()) {
                throw new \Exception('Kecamatan masih memiliki data kelurahan. Hapus kelurahan terlebih dahulu.');
            }

            ActivityLogService::logDeleted($kecamatan, 'KECAMATAN', $request);

            $kecamatan->delete();

            $this->clearAllCache();

            DB::commit();

            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Build query dengan select yang efisien
     * 
     * @param mixed $perPage
     */
    protected function validatePerPage($perPage): int
    {
        if (!is_numeric($perPage) || (int) $perPage <= 0) {
            return 10;
        }

        $perPage = (int) $perPage;

        if ($perPage > 100) {
            return 100;
        }

        return $perPage;
    }

    /**
     * Generate cache key
     */
    protected function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    /**
     * Clear all cache related to kecamatan
     */
    protected function clearAllCache(): void
    {
        try {
            $keys = [
                'kecamatan_list',
                'kecamatan_available_for_mwc',
                'kecamatan_available_for_banom',
            ];

            foreach ($keys as $key) {
                Cache::forget(self::CACHE_PREFIX . $key);
            }

            $kecamatans = Kecamatan::pluck('id');
            foreach ($kecamatans as $id) {
                Cache::forget(self::CACHE_PREFIX . 'detail_' . $id);
            }

            $kotas = Kecamatan::pluck('kota_id')->unique();
            foreach ($kotas as $kotaId) {
                Cache::forget(self::CACHE_PREFIX . 'by_kota_' . $kotaId);
            }
        } catch (\Exception $e) {
            // Ignore cache clear errors
        }
    }
}