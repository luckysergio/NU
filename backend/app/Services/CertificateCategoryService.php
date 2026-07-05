<?php

namespace App\Services;

use App\Models\CertificateCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CertificateCategoryService extends BaseService
{
    protected const CACHE_PREFIX = 'certificate_category_';
    protected const CACHE_DURATION = 3600;

    /**
     * Get all certificate categories with pagination
     */
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

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($search, $isActive, $perPage) {
            return $this->buildQuery($search, $isActive)->paginate($perPage);
        });
    }

    /**
     * Build query with efficient select
     * 
     * @param string $search
     * @param mixed $isActive
     * @return Builder<CertificateCategory>
     */
    protected function buildQuery(string $search, mixed $isActive): Builder
    {
        /** @var Builder<CertificateCategory> $query */
        $query = CertificateCategory::query()
            ->select(['id', 'nama', 'slug', 'deskripsi', 'is_active', 'created_at'])
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

    /**
     * Find certificate category by ID
     */
    public function findById(int $id): CertificateCategory
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($id) {
            return CertificateCategory::withCount(['certificates as total_certificates'])
                ->with(['certificates' => function ($q) {
                    $q->select(['id', 'certificate_category_id', 'nama', 'file_path', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama');
                }])
                ->findOrFail($id);
        });
    }

    /**
     * Find by slug
     */
    public function findBySlug(string $slug): CertificateCategory
    {
        $cacheKey = $this->getCacheKey('slug_' . $slug);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($slug) {
            return CertificateCategory::withCount(['certificates as total_certificates'])
                ->where('slug', $slug)
                ->firstOrFail();
        });
    }

    /**
     * Get all active categories (for dropdown)
     */
    public function getActiveCategories(): \Illuminate\Support\Collection
    {
        $cacheKey = $this->getCacheKey('active');

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () {
            return CertificateCategory::select(['id', 'nama', 'slug'])
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    /**
     * Get categories with certificate count
     */
    public function getWithCertificateCount(): \Illuminate\Support\Collection
    {
        $cacheKey = $this->getCacheKey('with_count');

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () {
            return CertificateCategory::select(['id', 'nama', 'slug', 'deskripsi', 'is_active'])
                ->withCount(['certificates as total_certificates' => function ($q) {
                    $q->where('is_active', true);
                }])
                ->where('is_active', true)
                ->orderBy('nama', 'asc')
                ->get();
        });
    }

    /**
     * Create new certificate category
     */
    public function store(array $data, Request $request): CertificateCategory
    {
        DB::beginTransaction();

        try {
            // Generate slug from name
            $slug = Str::slug($data['nama']);

            // Check if slug already exists
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

            $this->clearAllCache();

            DB::commit();

            return $category;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update certificate category
     */
    public function update(int $id, array $data, Request $request): CertificateCategory
    {
        DB::beginTransaction();

        try {
            $category = CertificateCategory::findOrFail($id);

            $oldValues = $category->toArray();

            // Generate new slug if name changed
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

            $this->clearAllCache();

            DB::commit();

            return $category;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete certificate category
     */
    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $category = CertificateCategory::findOrFail($id);

            // Check if category has certificates
            if ($category->certificates()->exists()) {
                throw new \Exception('Kategori sertifikat masih memiliki data sertifikat. Hapus sertifikat terlebih dahulu.');
            }

            ActivityLogService::logDeleted($category, 'CERTIFICATE_CATEGORY', $request);

            $category->delete();

            $this->clearAllCache();

            DB::commit();

            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Toggle category status
     */
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

            $this->clearAllCache();

            DB::commit();

            return $category;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate and sanitize per page value
     */
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

    /**
     * Generate cache key
     */
    protected function getCacheKey(string $key, array $params = []): string
    {
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $key . $paramString;
    }

    /**
     * Clear all cache related to certificate categories
     */
    protected function clearAllCache(): void
    {
        try {
            $keys = [
                'certificate_category_list',
                'certificate_category_active',
                'certificate_category_with_count',
            ];

            foreach ($keys as $key) {
                Cache::forget(self::CACHE_PREFIX . $key);
            }

            $categories = CertificateCategory::pluck('id');
            foreach ($categories as $id) {
                Cache::forget(self::CACHE_PREFIX . 'detail_' . $id);
            }

            $slugs = CertificateCategory::pluck('slug');
            foreach ($slugs as $slug) {
                Cache::forget(self::CACHE_PREFIX . 'slug_' . $slug);
            }
        } catch (\Exception $e) {
            // Ignore cache clear errors
        }
    }
}