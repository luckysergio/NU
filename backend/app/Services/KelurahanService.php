<?php
// app/Services/KelurahanService.php

namespace App\Services;

use App\Models\Kelurahan;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;

class KelurahanService
{
    protected const CACHE_DURATION = 3600; // 1 jam
    protected const CACHE_PREFIX = 'kelurahan_';

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $kecamatanId = $request->query('kecamatan_id');
        $kotaId = $request->query('kota_id');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $kecamatanId, $kotaId)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'kecamatan_id' => $kecamatanId,
            'kota_id' => $kotaId,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($search, $kecamatanId, $kotaId, $perPage) {
            return $this->buildQuery($search, $kecamatanId, $kotaId)->paginate($perPage);
        });
    }

    /**
     * Build query dengan select yang efisien
     * 
     * @param string $search
     * @param mixed $kecamatanId
     * @param mixed $kotaId
     */
    protected function buildQuery(string $search, $kecamatanId, $kotaId)
    {
        $query = Kelurahan::query()
            ->select(['id', 'kecamatan_id', 'nama', 'kode', 'is_active', 'created_at'])
            ->with([
                'kecamatan' => function ($q) {
                    $q->select(['id', 'kota_id', 'nama', 'kode', 'is_active']);
                },
                'kecamatan.kota' => function ($q) {
                    $q->select(['id', 'nama', 'kode', 'is_active']);
                }
            ])
            ->when($search, function ($q) use ($search) {
                $search = strtolower($search);
                return $q->where(function ($query) use ($search) {
                    $query->where('nama', 'LIKE', "%{$search}%")
                        ->orWhere('kode', 'LIKE', "%{$search}%");
                });
            })
            ->when($kecamatanId, fn($q) => $q->where('kecamatan_id', $kecamatanId))
            ->when($kotaId, function ($q) use ($kotaId) {
                $q->whereHas('kecamatan', fn($sub) => $sub->where('kota_id', $kotaId));
            })
            ->orderBy('nama', 'asc');

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): Kelurahan
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            return Kelurahan::with([
                'kecamatan',
                'kecamatan.kota',
                'organizations',
            ])->findOrFail($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR RANTING
    |--------------------------------------------------------------------------
    */

    /**
     * Get available kelurahan for Ranting organization
     * 
     * @param int|null $ignoreOrganizationId
     * @param int|null $kotaId
     * @param int|null $kecamatanId
     * @return \Illuminate\Support\Collection
     */
    public function availableForRanting(?int $ignoreOrganizationId = null, ?int $kotaId = null, ?int $kecamatanId = null)
    {
        $cacheKey = $this->getCacheKey('available_for_ranting', [
            'ignore' => $ignoreOrganizationId,
            'kota_id' => $kotaId,
            'kecamatan_id' => $kecamatanId,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($ignoreOrganizationId, $kotaId, $kecamatanId) {
            $usedKelurahanIds = Organization::query()
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'ranting');
                })
                ->whereNotNull('kelurahan_id')
                ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
                    $q->where('id', '!=', $ignoreOrganizationId);
                })
                ->pluck('kelurahan_id');

            return Kelurahan::query()
                ->select(['id', 'kecamatan_id', 'nama', 'kode', 'is_active'])
                ->with([
                    'kecamatan',
                    'kecamatan.kota',
                ])
                ->when($kecamatanId, fn($q) => $q->where('kecamatan_id', $kecamatanId))
                ->when($kotaId, function ($q) use ($kotaId) {
                    $q->whereHas('kecamatan', fn($sub) => $sub->where('kota_id', $kotaId));
                })
                ->whereNotIn('id', $usedKelurahanIds)
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(array $data, Request $request): Kelurahan
    {
        DB::beginTransaction();

        try {
            $exists = Kelurahan::where('kecamatan_id', $data['kecamatan_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kelurahan sudah digunakan di kecamatan ini.');
            }

            $kelurahan = Kelurahan::create([
                'kecamatan_id' => $data['kecamatan_id'],
                'nama' => $data['nama'],
                'kode' => strtoupper($data['kode'] ?? null),
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearAllCache();

            DB::commit();

            return $kelurahan->load(['kecamatan', 'kecamatan.kota']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data, Request $request): Kelurahan
    {
        DB::beginTransaction();

        try {
            $kelurahan = Kelurahan::findOrFail($id);

            $exists = Kelurahan::where('kecamatan_id', $data['kecamatan_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kelurahan sudah digunakan di kecamatan ini.');
            }

            $kelurahan->update([
                'kecamatan_id' => $data['kecamatan_id'],
                'nama' => $data['nama'],
                'kode' => strtoupper($data['kode'] ?? null),
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearAllCache();

            DB::commit();

            return $kelurahan->load(['kecamatan', 'kecamatan.kota']);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $kelurahan = Kelurahan::findOrFail($id);

            if ($kelurahan->organizations()->exists()) {
                throw new \Exception('Kelurahan masih digunakan oleh organisasi Ranting.');
            }

            $kelurahan->delete();

            $this->clearAllCache();

            DB::commit();

            return true;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Validate and sanitize per page value
     * 
     * @param mixed $perPage
     * @return int
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
     * 
     * @param string $key
     * @param array $params
     * @return string
     */
    protected function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    /**
     * Clear all cache related to kelurahan
     * 
     * @return void
     */
    protected function clearAllCache(): void
    {
        try {
            $keys = [
                'kelurahan_list',
                'kelurahan_available_for_ranting',
            ];
            
            foreach ($keys as $key) {
                Cache::forget(self::CACHE_PREFIX . $key);
            }
            
            $kelurahans = Kelurahan::pluck('id');
            foreach ($kelurahans as $id) {
                Cache::forget(self::CACHE_PREFIX . 'detail_' . $id);
            }

        } catch (\Exception $e) {
            // Ignore cache clear errors
        }
    }
}