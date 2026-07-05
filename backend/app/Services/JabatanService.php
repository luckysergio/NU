<?php
// app/Services/JabatanService.php

namespace App\Services;

use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;

class JabatanService extends BaseService
{
    protected const CACHE_PREFIX = 'jabatan_';
    protected const CACHE_DURATION = 3600;

    /**
     * Get all jabatan with filters and pagination
     */
    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $status = $request->query('status');
        $level = $request->query('level');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $status, $level)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'status' => $status,
            'level' => $level,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        return $this->remember($cacheKey, function () use ($search, $status, $level, $perPage) {
            return $this->buildQuery($search, $status, $level)->paginate($perPage);
        });
    }

    /**
     * Build optimized query
     */
    protected function buildQuery(?string $search, ?string $status, ?string $level): Builder
    {
        return Jabatan::query()
            ->select(['id', 'nama', 'slug', 'deskripsi', 'level', 'levels', 'is_active', 'created_at'])
            ->withCount(['anggotas' => function ($q) {
                $q->where('is_active', true);
            }])
            ->when($search, function ($q) use ($search) {
                return $q->search($search);
            })
            ->when($status === 'active', function ($q) {
                return $q->active();
            })
            ->when($status === 'inactive', function ($q) {
                return $q->where('is_active', false);
            })
            ->when($level, function ($q) use ($level) {
                return $q->byLevel($level);
            })
            ->ordered();
    }

    /**
     * Get jabatan by level
     */
    public function getByLevel(string $level)
    {
        $cacheKey = $this->getCacheKey('by_level_' . $level);

        return $this->remember($cacheKey, function () use ($level) {
            return Jabatan::active()
                ->byLevel($level)
                ->ordered()
                ->get(['id', 'nama', 'slug']);
        });
    }

    /**
     * Get jabatan by ID with cache
     */
    public function findById(int $id): Jabatan
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->remember($cacheKey, function () use ($id) {
            return Jabatan::with([
                'anggotas' => function ($q) {
                    $q->select(['id', 'jabatan_id', 'nama', 'no_anggota', 'is_active'])
                        ->where('is_active', true)
                        ->orderBy('nama', 'asc')
                        ->limit(20);
                }
            ])
            ->withCount(['anggotas' => function ($q) {
                $q->where('is_active', true);
            }])
            ->findOrFail($id);
        });
    }

    /**
     * Get active jabatan for dropdown
     */
    public function getActiveJabatan(?string $level = null)
    {
        $cacheKey = $this->getCacheKey('active' . ($level ? '_' . $level : ''));

        return $this->remember($cacheKey, function () use ($level) {
            $query = Jabatan::active()->ordered();
            
            if ($level) {
                $query->byLevel($level);
            }
            
            return $query->get(['id', 'nama', 'slug', 'level', 'levels']);
        });
    }

    /**
     * Create new jabatan
     */
    public function store(array $data, Request $request): Jabatan
    {
        DB::beginTransaction();

        try {
            $jabatan = Jabatan::create([
                'nama' => $data['nama'],
                'slug' => Str::slug($data['nama']),
                'deskripsi' => $data['deskripsi'] ?? null,
                'level' => $data['level'] ?? null,
                'levels' => $data['levels'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(
                module: 'JABATAN',
                action: 'CREATE',
                model: $jabatan,
                newValues: $jabatan->toArray(),
                description: 'Menambahkan jabatan: ' . $jabatan->nama,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $jabatan;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update jabatan
     */
    public function update(int $id, array $data, Request $request): Jabatan
    {
        DB::beginTransaction();

        try {
            $jabatan = Jabatan::findOrFail($id);
            $oldValues = $jabatan->toArray();

            $jabatan->update([
                'nama' => $data['nama'],
                'slug' => Str::slug($data['nama']),
                'deskripsi' => $data['deskripsi'] ?? null,
                'level' => $data['level'] ?? null,
                'levels' => $data['levels'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $jabatan->refresh();

            // Log changes
            $newValues = $jabatan->toArray();
            $changes = $this->detectChanges($oldValues, $newValues);

            if (!empty($changes)) {
                ActivityLogService::log(
                    module: 'JABATAN',
                    action: 'UPDATE',
                    model: $jabatan,
                    oldValues: $changes['old'],
                    newValues: $changes['new'],
                    description: 'Mengubah jabatan: ' . $jabatan->nama,
                    request: $request
                );
            }

            $this->clearAllCache();

            DB::commit();

            return $jabatan;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete jabatan
     */
    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            $jabatan = Jabatan::findOrFail($id);

            // Check if has anggotas
            if ($jabatan->anggotas()->exists()) {
                throw new \Exception('Jabatan masih memiliki anggota.');
            }

            $oldValues = $jabatan->toArray();

            $jabatan->delete();

            ActivityLogService::log(
                module: 'JABATAN',
                action: 'DELETE',
                oldValues: $oldValues,
                description: 'Menghapus jabatan: ' . $jabatan->nama,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Toggle jabatan status
     */
    public function toggleActive(int $id, Request $request): Jabatan
    {
        DB::beginTransaction();

        try {
            $jabatan = Jabatan::findOrFail($id);
            $oldStatus = $jabatan->is_active;

            $jabatan->update(['is_active' => !$jabatan->is_active]);

            ActivityLogService::log(
                module: 'JABATAN',
                action: 'UPDATE',
                model: $jabatan,
                oldValues: ['is_active' => $oldStatus],
                newValues: ['is_active' => $jabatan->is_active],
                description: ($jabatan->is_active ? 'Mengaktifkan' : 'Menonaktifkan') . ' jabatan: ' . $jabatan->nama,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $jabatan;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get jabatan statistics
     */
    public function getStatistics(): array
    {
        $cacheKey = $this->getCacheKey('statistics');

        return $this->remember($cacheKey, function () {
            $total = Jabatan::count();
            $active = Jabatan::where('is_active', true)->count();
            $inactive = Jabatan::where('is_active', false)->count();

            $byJabatan = Jabatan::query()
                ->select(['id', 'nama', 'slug', 'level', 'is_active'])
                ->withCount(['anggotas' => function ($q) {
                    $q->where('is_active', true);
                }])
                ->where('is_active', true)
                ->ordered()
                ->get();

            return [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'by_jabatan' => $byJabatan,
            ];
        });
    }

    /**
     * Detect changes between old and new values
     */
    protected function detectChanges(array $oldValues, array $newValues): array
    {
        $changes = ['old' => [], 'new' => []];

        $fields = ['nama', 'slug', 'deskripsi', 'level', 'levels', 'is_active'];

        foreach ($fields as $field) {
            $old = $oldValues[$field] ?? null;
            $new = $newValues[$field] ?? null;

            if ($old != $new) {
                $changes['old'][$field] = $old;
                $changes['new'][$field] = $new;
            }
        }

        return $changes;
    }

    /**
     * Clear all cache
     */
    protected function clearAllCache(): void
    {
        parent::clearAllCache();
        Cache::forget($this->getCacheKey('statistics'));
        Cache::forget($this->getCacheKey('active'));
    }
}