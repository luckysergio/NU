<?php
// app/Services/RoleService.php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Auth\Access\AuthorizationException;

class RoleService extends BaseService
{
    protected const CACHE_PREFIX = 'role_';
    protected const CACHE_DURATION = 3600;

    /**
     * Get all roles with filters and pagination
     */
    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        /** @var User|null $authUser */
        $authUser = $request->user();

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $authUser)->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'per_page' => $perPage,
            'page' => $page,
            'user_id' => $authUser?->id,
            'is_super_admin' => $authUser?->isSuperAdmin(),
        ]);

        return $this->remember($cacheKey, function () use ($search, $authUser, $perPage) {
            return $this->buildQuery($search, $authUser)->paginate($perPage);
        });
    }

    /**
     * Build optimized query
     */
    protected function buildQuery(?string $search, ?User $authUser)
    {
        $query = Role::query()
            ->select(['id', 'nama', 'slug', 'deskripsi', 'is_active', 'created_at'])
            ->withCount(['users']);

        // Hide super admin role from non-super-admin users
        if (!$authUser?->isSuperAdmin()) {
            $query->where('slug', '!=', 'super-admin');
        }

        // Search
        if (!empty($search)) {
            $search = strtolower($search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(slug) LIKE ?', ["%{$search}%"]);
            });
        }

        // Order by priority
        $query->orderByRaw("
            CASE slug
                WHEN 'super-admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'operator' THEN 3
                WHEN 'anggota' THEN 4
                ELSE 99
            END
        ")->orderBy('nama');

        return $query;
    }

    /**
     * Get role by ID
     */
    public function findById(int $id, Request $request): Role
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->remember($cacheKey, function () use ($id, $request) {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $role = Role::with(['users' => function ($q) {
                $q->select(['id', 'name', 'email'])->limit(10);
            }])->findOrFail($id);

            // Protect super admin role
            if ($role->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            return $role;
        });
    }

    /**
     * Get available roles for assignment
     */
    public function getAvailableRoles(Request $request)
    {
        $cacheKey = $this->getCacheKey('available', [
            'user_id' => $request->user()?->id,
        ]);

        return $this->remember($cacheKey, function () use ($request) {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $query = Role::query()
                ->where('is_active', true)
                ->orderBy('nama');

            // Non-super-admin cannot see or assign super admin
            if (!$authUser?->isSuperAdmin()) {
                $query->where('slug', '!=', 'super-admin');
            }

            // Admin cannot assign admin role if not PC
            if ($authUser?->isAdmin() && !$authUser->isPC()) {
                $query->where('slug', '!=', 'admin');
            }

            return $query->get();
        });
    }

    /**
     * Create new role
     */
    public function store(array $data, Request $request): Role
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $slug = Str::slug($data['nama']);

            // Only super admin can create super admin role
            if ($slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            // Check if slug already exists
            if (Role::where('slug', $slug)->exists()) {
                throw new \Exception('Role dengan nama yang sama sudah ada');
            }

            $role = Role::create([
                'nama' => $data['nama'],
                'slug' => $slug,
                'deskripsi' => $data['deskripsi'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Log activity
            ActivityLogService::log(
                module: 'ROLE',
                action: 'CREATE',
                model: $role,
                newValues: $role->toArray(),
                description: 'Menambahkan role: ' . $role->nama,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $role;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update role
     */
    public function update(int $id, array $data, Request $request): Role
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $role = Role::findOrFail($id);

            // Protect super admin role
            if ($role->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            // Prevent changing super admin name
            if ($role->slug === 'super-admin') {
                if (isset($data['nama']) && Str::slug($data['nama']) !== 'super-admin') {
                    throw new AuthorizationException('Tidak dapat mengubah nama Super Admin');
                }
            }

            $oldValues = $role->toArray();

            $newSlug = isset($data['nama']) ? Str::slug($data['nama']) : $role->slug;

            // Check if new slug already exists (except this role)
            if ($newSlug !== $role->slug && Role::where('slug', $newSlug)->exists()) {
                throw new \Exception('Role dengan nama yang sama sudah ada');
            }

            $updateData = [
                'nama' => $data['nama'] ?? $role->nama,
                'slug' => $newSlug,
                'deskripsi' => $data['deskripsi'] ?? $role->deskripsi,
                'is_active' => $data['is_active'] ?? $role->is_active,
            ];

            $role->update($updateData);

            // Log changes
            $newValues = $role->fresh()->toArray();
            $changes = $this->detectChanges($oldValues, $newValues);

            if (!empty($changes)) {
                ActivityLogService::log(
                    module: 'ROLE',
                    action: 'UPDATE',
                    model: $role,
                    oldValues: $changes['old'],
                    newValues: $changes['new'],
                    description: 'Mengubah role: ' . $role->nama,
                    request: $request
                );
            }

            $this->clearAllCache();

            DB::commit();

            return $role;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete role
     */
    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $role = Role::withCount(['users'])->findOrFail($id);

            // Protect super admin role
            if ($role->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            // Prevent deleting protected roles
            if ($this->isProtectedRole($role->slug)) {
                throw new \Exception('Role ini tidak dapat dihapus karena dilindungi sistem');
            }

            // Check if role is being used
            if ($role->users_count > 0) {
                throw new \Exception('Role masih digunakan oleh ' . $role->users_count . ' user');
            }

            $oldValues = $role->toArray();

            $role->delete();

            ActivityLogService::log(
                module: 'ROLE',
                action: 'DELETE',
                oldValues: $oldValues,
                description: 'Menghapus role: ' . $role->nama,
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
     * Toggle role status
     */
    public function toggleStatus(int $id, Request $request): Role
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $role = Role::findOrFail($id);

            // Protect super admin role
            if ($role->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            // Prevent deactivating protected roles
            if ($this->isProtectedRole($role->slug) && $role->is_active) {
                throw new \Exception('Role ini tidak dapat dinonaktifkan karena dilindungi sistem');
            }

            $oldStatus = $role->is_active;
            $role->update(['is_active' => !$role->is_active]);

            ActivityLogService::log(
                module: 'ROLE',
                action: 'UPDATE',
                model: $role,
                oldValues: ['is_active' => $oldStatus],
                newValues: ['is_active' => $role->is_active],
                description: ($role->is_active ? 'Mengaktifkan' : 'Menonaktifkan') . ' role: ' . $role->nama,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $role;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get role statistics
     */
    public function getStatistics(Request $request)
    {
        $cacheKey = $this->getCacheKey('statistics', [
            'user_id' => $request->user()?->id,
        ]);

        return $this->remember($cacheKey, function () use ($request) {
            /** @var User|null $authUser */
            $authUser = $request->user();

            $query = Role::query();

            if (!$authUser?->isSuperAdmin()) {
                $query->where('slug', '!=', 'super-admin');
            }

            $total = $query->count();
            $active = (clone $query)->where('is_active', true)->count();
            $inactive = (clone $query)->where('is_active', false)->count();

            $roles = (clone $query)
                ->withCount(['users'])
                ->orderBy('nama')
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'nama' => $role->nama,
                        'slug' => $role->slug,
                        'is_active' => $role->is_active,
                        'total_users' => $role->users_count,
                        'badge_color' => $this->getRoleBadgeColor($role->slug),
                    ];
                });

            return [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'roles' => $roles,
            ];
        });
    }

    /**
     * Check if role is protected
     */
    protected function isProtectedRole(string $slug): bool
    {
        return in_array($slug, ['super-admin', 'admin']);
    }

    /**
     * Get role badge color
     */
    protected function getRoleBadgeColor(string $slug): string
    {
        $colors = [
            'super-admin' => 'bg-gradient-to-r from-red-500 to-red-600 text-white',
            'admin' => 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
            'operator' => 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
            'anggota' => 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
        ];
        
        return $colors[$slug] ?? 'bg-gray-500 text-white';
    }

    /**
     * Detect changes between old and new values
     */
    protected function detectChanges(array $oldValues, array $newValues): array
    {
        $changes = ['old' => [], 'new' => []];

        $fields = ['nama', 'slug', 'deskripsi', 'is_active'];

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
     * Clear all role cache
     */
    protected function clearAllCache(): void
    {
        parent::clearAllCache();
        Cache::forget($this->getCacheKey('statistics'));
        Cache::forget($this->getCacheKey('available'));
    }
}