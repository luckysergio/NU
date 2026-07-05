<?php

namespace App\Services;

use App\Models\Kota;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class KotaService
{
    protected const CACHE_DURATION = 3600;
    protected const CACHE_PREFIX = 'kota_';

    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($search, $perPage) {
            return $this->buildQuery($search)->paginate($perPage);
        });
    }

    protected function buildQuery(string $search)
    {
        $query = Kota::query()
            ->select(['id', 'nama', 'kode', 'is_active', 'created_at'])
            ->withCount(['kecamatans as kecamatans_count' => function ($q) {
                $q->where('is_active', true);
            }])
            ->when($search, function ($q) use ($search) {
                $search = strtolower($search);
                return $q->where(function ($query) use ($search) {
                    $query->where('nama', 'LIKE', "%{$search}%")
                        ->orWhere('kode', 'LIKE', "%{$search}%");
                });
            })
            ->orderBy('nama', 'asc');

        return $query;
    }

    public function findById(int $id): Kota
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            return Kota::with([
                'kecamatans' => function ($q) {
                    $q->select(['id', 'kota_id', 'nama', 'kode', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                },
                'kecamatans.kelurahans' => function ($q) {
                    $q->select(['id', 'kecamatan_id', 'nama', 'kode', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                },
                'organizations' => function ($q) {
                    $q->select(['id', 'kota_id', 'nama', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                },
            ])->findOrFail($id);
        });
    }

    public function availableForPC(?int $ignoreOrganizationId = null)
    {
        $cacheKey = $this->getCacheKey('available_for_pc', [
            'ignore' => $ignoreOrganizationId,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($ignoreOrganizationId) {
            $usedKotaIds = Organization::query()
                ->whereHas('level', function ($q) {
                    $q->where('slug', 'pc');
                })
                ->whereNotNull('kota_id')
                ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
                    $q->where('id', '!=', $ignoreOrganizationId);
                })
                ->pluck('kota_id');

            return Kota::query()
                ->select(['id', 'nama', 'kode', 'is_active'])
                ->whereNotIn('id', $usedKotaIds)
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function store(array $data, Request $request): Kota
    {
        DB::beginTransaction();

        try {
            $kota = Kota::create([
                'nama' => $data['nama'],
                'kode' => strtoupper(Str::slug($data['kode'], '')),
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Log aktivitas CREATE
            ActivityLogService::logCreated($kota, 'KOTA', $request);

            $this->clearAllCache();

            DB::commit();

            return $kota;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): Kota
    {
        DB::beginTransaction();

        try {
            $kota = Kota::findOrFail($id);

            // PERBAIKAN: Simpan nilai lama sebelum update
            $oldValues = $kota->toArray();

            // PERBAIKAN: Gunakan method update dengan array data
            $kota->update([
                'nama' => $data['nama'],
                'kode' => strtoupper(Str::slug($data['kode'], '')),
                'is_active' => $data['is_active'] ?? true,
            ]);

            // PERBAIKAN: Refresh model untuk mendapatkan data terbaru
            $kota->refresh();

            // PERBAIKAN: Deteksi perubahan menggunakan getDirty() atau bandingkan old dan new
            $newValues = $kota->toArray();
            
            // Filter hanya field yang berubah
            $changedFields = [];
            foreach ($newValues as $key => $value) {
                if (isset($oldValues[$key]) && $oldValues[$key] != $value) {
                    $changedFields[$key] = $value;
                }
            }

            // Log aktivitas UPDATE jika ada perubahan
            if (!empty($changedFields)) {
                // Ambil hanya field yang berubah untuk old_values
                $oldChangedValues = [];
                foreach ($changedFields as $key => $value) {
                    $oldChangedValues[$key] = $oldValues[$key] ?? null;
                }

                ActivityLogService::logUpdated(
                    $kota,
                    'KOTA',
                    $oldChangedValues,
                    $changedFields,
                    $request
                );
            }

            $this->clearAllCache();

            DB::commit();

            return $kota;

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $kota = Kota::findOrFail($id);

            if ($kota->organizations()->exists()) {
                throw new \Exception('Kota masih digunakan oleh organisasi.');
            }

            if ($kota->kecamatans()->exists()) {
                throw new \Exception('Kota masih memiliki kecamatan.');
            }

            // Log aktivitas DELETE
            ActivityLogService::logDeleted($kota, 'KOTA', $request);

            $kota->delete();

            $this->clearAllCache();

            DB::commit();

            return true;

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
            $listKeys = [
                'kota_list',
                'kota_available_for_pc',
            ];
            
            foreach ($listKeys as $key) {
                Cache::forget(self::CACHE_PREFIX . $key);
            }
            
            $kotas = Kota::pluck('id');
            foreach ($kotas as $id) {
                Cache::forget(self::CACHE_PREFIX . 'detail_' . $id);
            }

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to clear cache: ' . $e->getMessage());
        }
    }
}