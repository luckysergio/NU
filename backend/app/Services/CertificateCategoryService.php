<?php

namespace App\Services;

use App\Models\CertificateCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CertificateCategoryService extends BaseService
{
    protected const CACHE_PREFIX = 'certificate_category:';
    protected const CACHE_DURATION = 600;
    
    protected const CACHE_TRACKER_KEY = 'certificate_category:active_keys';

    public function getAll(Request $request): LengthAwarePaginator
    {
        $search = trim((string) $request->query('search', ''));
        $isActive = $request->query('is_active');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $isActive)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'is_active' => $isActive,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return $this->rememberCache($cacheKey, function () use ($search, $isActive, $perPage) {
            return $this->buildQuery($search, $isActive)->paginate($perPage);
        });
    }

    protected function buildQuery(string $search, mixed $isActive): Builder
    {
        /** @var Builder<CertificateCategory> $query */
        $query = CertificateCategory::query()
            ->select(['id', 'nama', 'slug', 'deskripsi', 'is_active', 'created_at', 'updated_at'])
            ->withCount(['certificates as total_certificates' => function ($q) {
                $q->where('is_active', true);
            }]);

        if (!empty($search)) {
            $search = strtolower($search);
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%")
                    ->orWhere('deskripsi', 'LIKE', "%{$search}%");
            });
        }

        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderBy('nama', 'asc');

        return $query;
    }

    public function findById(int $id): CertificateCategory
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->rememberCache($cacheKey, function () use ($id) {
            return CertificateCategory::withCount(['certificates as total_certificates'])
                ->with(['certificates' => function ($q) {
                    $q->select(['id', 'certificate_category_id', 'nama', 'file_path', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                }])
                ->findOrFail($id);
        });
    }

    public function findBySlug(string $slug): CertificateCategory
    {
        $cacheKey = $this->getCacheKey('slug_' . $slug);

        return $this->rememberCache($cacheKey, function () use ($slug) {
            return CertificateCategory::withCount(['certificates as total_certificates'])
                ->where('slug', $slug)
                ->firstOrFail();
        });
    }

    public function getActiveCategories(): \Illuminate\Support\Collection
    {
        $cacheKey = $this->getCacheKey('active');

        return $this->rememberCache($cacheKey, function () {
            return CertificateCategory::select(['id', 'nama', 'slug'])
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function getWithCertificateCount(): \Illuminate\Support\Collection
    {
        $cacheKey = $this->getCacheKey('with_count');

        return $this->rememberCache($cacheKey, function () {
            return CertificateCategory::select(['id', 'nama', 'slug', 'deskripsi', 'is_active'])
                ->withCount(['certificates as total_certificates' => function ($q) {
                    $q->where('is_active', true);
                }])
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    public function store(array $data, Request $request): CertificateCategory
    {
        DB::beginTransaction();

        try {
            $slug = Str::slug($data['nama']);

            $existing = CertificateCategory::where('slug', $slug)->exists();
            if ($existing) {
                $slug = $slug . '-' . time();
            }

            $category = CertificateCategory::create([
                'nama' => $data['nama'],
                'slug' => $slug,
                'deskripsi' => $data['deskripsi'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            ActivityLogService::logCreated($category, 'CERTIFICATE_CATEGORY', $request);

            $this->clearCache();

            DB::commit();

            return $category->fresh();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): CertificateCategory
    {
        DB::beginTransaction();

        try {
            $category = CertificateCategory::findOrFail($id);

            $oldValues = $category->toArray();

            $slug = $category->slug;
            if (isset($data['nama']) && $data['nama'] !== $category->nama) {
                $slug = Str::slug($data['nama']);
                $existing = CertificateCategory::where('slug', $slug)
                    ->where('id', '!=', $id)
                    ->exists();
                if ($existing) {
                    $slug = $slug . '-' . time();
                }
            }

            $category->update([
                'nama' => $data['nama'] ?? $category->nama,
                'slug' => $slug,
                'deskripsi' => $data['deskripsi'] ?? $category->deskripsi,
                'is_active' => $data['is_active'] ?? $category->is_active,
            ]);

            $category->refresh();

            $newValues = $category->toArray();
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
                    $category,
                    'CERTIFICATE_CATEGORY',
                    $oldChangedValues,
                    $changedFields,
                    $request
                );
            }

            $this->clearCache();

            DB::commit();

            return $category;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $category = CertificateCategory::findOrFail($id);

            if ($category->certificates()->exists()) {
                throw new \Exception('Kategori sertifikat masih memiliki data sertifikat. Hapus sertifikat terlebih dahulu.');
            }

            ActivityLogService::logDeleted($category, 'CERTIFICATE_CATEGORY', $request);

            $category->delete();

            $this->clearCache();

            DB::commit();

            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(int $id, Request $request): CertificateCategory
    {
        DB::beginTransaction();

        try {
            $category = CertificateCategory::findOrFail($id);

            $oldStatus = $category->is_active;
            $category->is_active = !$category->is_active;
            $category->save();

            $category->refresh();

            ActivityLogService::logUpdated(
                $category,
                'CERTIFICATE_CATEGORY',
                ['is_active' => $oldStatus],
                ['is_active' => $category->is_active],
                $request
            );

            $this->clearCache();

            DB::commit();

            return $category;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function validatePerPage(mixed $perPage): int
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

    protected function rememberCache(string $key, \Closure $callback)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    public function clearCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        
        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }

        // Hapus tracker itu sendiri
        Cache::forget(self::CACHE_TRACKER_KEY);
        
        Log::info('Targeted certificate category cache cleared successfully.');
    }
}