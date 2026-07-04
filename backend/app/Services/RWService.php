<?php
// app/Services/RWService.php

namespace App\Services;

use App\Models\RW;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class RWService
{
    protected const CACHE_DURATION = 3600;
    protected const CACHE_PREFIX = 'rw_';

    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $kelurahanId = $request->query('kelurahan_id');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $kelurahanId)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'kelurahan_id' => $kelurahanId,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($search, $kelurahanId, $perPage) {
            return $this->buildQuery($search, $kelurahanId)->paginate($perPage);
        });
    }

    /**
     * Build query dengan select yang efisien
     * 
     * @param string $search
     * @param mixed $kelurahanId
     */
    protected function buildQuery(string $search, $kelurahanId)
    {
        $query = RW::query()
            ->select(['id', 'kelurahan_id', 'nomor', 'is_active', 'created_at'])
            ->with([
                'kelurahan' => function ($q) {
                    $q->select(['id', 'kecamatan_id', 'nama', 'kode', 'is_active']);
                },
                'kelurahan.kecamatan' => function ($q) {
                    $q->select(['id', 'kota_id', 'nama', 'kode', 'is_active']);
                },
                'kelurahan.kecamatan.kota' => function ($q) {
                    $q->select(['id', 'nama', 'kode', 'is_active']);
                }
            ])
            ->when($search, function ($q) use ($search) {
                $search = strtolower($search);
                return $q->where('nomor', 'LIKE', "%{$search}%");
            })
            ->when($kelurahanId, fn($q) => $q->where('kelurahan_id', $kelurahanId))
            ->orderBy('nomor', 'asc');

        return $query;
    }

    public function find(int $id): RW
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            return RW::with([
                'kelurahan',
                'kelurahan.kecamatan',
                'kelurahan.kecamatan.kota',
                'organizations',
            ])->findOrFail($id);
        });
    }

    public function availableForAnakRanting(?int $ignoreOrganizationId = null, ?int $kelurahanId = null)
    {
        $cacheKey = $this->getCacheKey('available_for_anak_ranting', [
            'ignore' => $ignoreOrganizationId,
            'kelurahan_id' => $kelurahanId,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($ignoreOrganizationId, $kelurahanId) {
            $usedRwIds = Organization::query()
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'anak-ranting');
                })
                ->whereNotNull('rw_id')
                ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
                    $q->where('id', '!=', $ignoreOrganizationId);
                })
                ->pluck('rw_id')
                ->toArray();

            $query = RW::query()
                ->select(['id', 'kelurahan_id', 'nomor', 'is_active'])
                ->with([
                    'kelurahan',
                    'kelurahan.kecamatan',
                    'kelurahan.kecamatan.kota',
                ])
                ->where('is_active', true);

            if ($kelurahanId) {
                $query->where('kelurahan_id', $kelurahanId);
            }

            if (!empty($usedRwIds)) {
                $query->whereNotIn('id', $usedRwIds);
            }

            return $query->orderBy('nomor', 'asc')->get();
        });
    }

    public function create(array $data): RW
    {
        DB::beginTransaction();

        try {
            $exists = RW::where('kelurahan_id', $data['kelurahan_id'])
                ->where('nomor', $data['nomor'])
                ->exists();

            if ($exists) {
                throw new \Exception('Nomor RW sudah digunakan di kelurahan ini.');
            }

            $rw = RW::create([
                'kelurahan_id' => $data['kelurahan_id'],
                'nomor' => $data['nomor'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearAllCache();

            DB::commit();

            return $rw->load([
                'kelurahan',
                'kelurahan.kecamatan',
                'kelurahan.kecamatan.kota',
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data): RW
    {
        DB::beginTransaction();

        try {
            $rw = RW::findOrFail($id);

            $exists = RW::where('kelurahan_id', $data['kelurahan_id'])
                ->where('nomor', $data['nomor'])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                throw new \Exception('Nomor RW sudah digunakan di kelurahan ini.');
            }

            $rw->update([
                'kelurahan_id' => $data['kelurahan_id'],
                'nomor' => $data['nomor'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->clearAllCache();

            DB::commit();

            return $rw->fresh([
                'kelurahan',
                'kelurahan.kecamatan',
                'kelurahan.kecamatan.kota',
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function delete(int $id): void
    {
        DB::beginTransaction();

        try {
            $rw = RW::findOrFail($id);

            $hasOrganization = Organization::where('rw_id', $id)
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'anak-ranting');
                })
                ->exists();

            if ($hasOrganization) {
                throw new \Exception('RW sedang digunakan oleh organisasi Anak Ranting dan tidak dapat dihapus.');
            }

            $rw->delete();

            $this->clearAllCache();

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

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

    protected function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    protected function clearAllCache(): void
    {
        try {
            $keys = [
                'rw_list',
                'rw_available_for_anak_ranting',
            ];
            
            foreach ($keys as $key) {
                Cache::forget(self::CACHE_PREFIX . $key);
            }
            
            $rws = RW::pluck('id');
            foreach ($rws as $id) {
                Cache::forget(self::CACHE_PREFIX . 'detail_' . $id);
            }

        } catch (\Exception $e) {
        }
    }
}