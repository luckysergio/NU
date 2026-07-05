<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;

class UserService extends BaseService
{
    protected const CACHE_PREFIX = 'user_';
    protected const CACHE_DURATION = 3600;

    public function getAll(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $roleId = $request->query('role_id');
        $organizationId = $request->query('organization_id');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $bypassCache = $request->query('bypass_cache', false);

        /** @var User|null $authUser */
        $authUser = Auth::user();

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery($search, $roleId, $organizationId, $authUser)
                ->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey('list', [
            'search' => $search,
            'role_id' => $roleId,
            'organization_id' => $organizationId,
            'per_page' => $perPage,
            'page' => $page,
            'user_id' => $authUser?->id,
        ]);

        return $this->remember($cacheKey, function () use ($search, $roleId, $organizationId, $authUser, $perPage) {
            return $this->buildQuery($search, $roleId, $organizationId, $authUser)
                ->paginate($perPage);
        });
    }

    protected function buildQuery(?string $search, ?int $roleId, ?int $organizationId, ?User $authUser): Builder
    {
        $query = User::query()
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.is_active',
                'users.is_blocked',
                'users.can_login',
                'users.last_login_at',
                'users.created_at',
                'users.role_id',
                'users.organization_id',
            ])
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->leftJoin('organizations', 'organizations.id', '=', 'users.organization_id')
            ->leftJoin('organization_levels', 'organization_levels.id', '=', 'organizations.organization_level_id')
            ->with([
                'role' => function ($q) {
                    $q->select(['id', 'nama', 'slug']);
                },
                'organization' => function ($q) {
                    $q->select([
                        'organizations.id',
                        'organizations.nama',
                        'organizations.organization_level_id',
                    ])->with(['level' => function ($q2) {
                        $q2->select(['id', 'nama', 'slug', 'display_name']);
                    }]);
                }
            ])
            ->withCount([
                'loginLogs as login_count' => function ($q) {
                    $q->where('is_success', true);
                }
            ]);

        if (!$authUser?->isSuperAdmin()) {
            $query->whereHas('role', function ($q) {
                $q->where('slug', '!=', 'super-admin');
            });
        }

        if (!empty($search)) {
            $search = strtolower($search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(users.name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(users.email) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(users.phone) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($roleId) {
            $query->where('users.role_id', $roleId);
        }

        if ($organizationId) {
            $query->where('users.organization_id', $organizationId);
        }

        $query->orderByRaw("
            CASE roles.slug
                WHEN 'super-admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'operator' THEN 3
                WHEN 'anggota' THEN 4
                ELSE 99
            END
        ");

        $query->orderByRaw("
            CASE organization_levels.slug
                WHEN 'pc' THEN 1
                WHEN 'mwc' THEN 2
                WHEN 'ranting' THEN 3
                WHEN 'lembaga' THEN 4
                WHEN 'banom' THEN 5
                ELSE 99
            END
        ");

        $query->orderBy('users.name');

        return $query;
    }

    public function availableRoles(int $organizationId)
    {
        $cacheKey = $this->getCacheKey('available_roles', [
            'organization_id' => $organizationId,
            'user_id' => Auth::id(),
        ]);

        return $this->remember($cacheKey, function () use ($organizationId) {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            if (!$authUser) {
                return collect([]);
            }

            $organization = Organization::with('level')->findOrFail($organizationId);
            $levelSlug = $organization->level?->slug;

            $query = Role::query()->where('is_active', true);

            if ($authUser->isSuperAdmin()) {
                if ($levelSlug === 'pc') {
                    return $query->whereIn('slug', [
                        'super-admin',
                        'admin',
                        'operator',
                        'anggota',
                    ])->orderBy('nama')->get();
                }

                return $query->whereIn('slug', [
                    'admin',
                    'operator',
                    'anggota',
                ])->orderBy('nama')->get();
            }

            if ($authUser->isAdmin()) {
                if ($authUser->isPC()) {
                    return $query->whereIn('slug', [
                        'admin',
                        'operator',
                        'anggota',
                    ])->orderBy('nama')->get();
                }

                return $query->whereIn('slug', [
                    'operator',
                    'anggota',
                ])->orderBy('nama')->get();
            }

            if ($authUser->isOperator()) {
                return $query->whereIn('slug', [
                    'anggota',
                ])->orderBy('nama')->get();
            }

            return collect([]);
        });
    }

    protected function validateRoleAccess(array $data): void
    {
        if (empty($data['organization_id'])) {
            throw new AuthorizationException('Organisasi wajib dipilih');
        }

        $allowedRoles = $this->availableRoles($data['organization_id']);
        $allowedRoleIds = $allowedRoles->pluck('id')->toArray();

        if (!in_array($data['role_id'], $allowedRoleIds)) {
            throw new AuthorizationException('Role tidak diizinkan untuk organisasi ini');
        }

        $role = Role::find($data['role_id']);
        $organization = Organization::with('level')->find($data['organization_id']);

        if ($role?->slug === 'super-admin' && $organization?->level?->slug !== 'pc') {
            throw new AuthorizationException('Super admin hanya boleh di organisasi PC');
        }
    }

    public function findById(int $id): User
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->remember($cacheKey, function () use ($id) {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::with([
                'role',
                'organization.level',
                'devices' => function ($q) {
                    $q->orderBy('last_login_at', 'desc')->limit(5);
                },
            ])->findOrFail($id);

            if ($user->role?->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            return $user;
        });
    }

    public function store(array $data, Request $request): User
    {
        DB::beginTransaction();

        try {
            $this->validateRoleAccess($data);

            if (User::where('email', $data['email'])->exists()) {
                throw new \Exception('Email sudah digunakan');
            }

            $user = User::create([
                'role_id' => $data['role_id'],
                'organization_id' => $data['organization_id'] ?? null,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
                'is_blocked' => $data['is_blocked'] ?? false,
                'can_login' => $data['can_login'] ?? true,
            ]);

            ActivityLogService::log(
                module: 'USER',
                action: 'CREATE',
                model: $user,
                newValues: $user->toArray(),
                description: 'Menambahkan user baru: ' . $user->name,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $user->load(['role', 'organization.level']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data, Request $request): User
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if ($user->role?->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            if ($user->role?->slug === 'super-admin' && $data['role_id'] !== $user->role_id) {
                $newRole = Role::find($data['role_id']);
                if ($newRole?->slug !== 'super-admin') {
                    throw new AuthorizationException('Tidak dapat mengubah role Super Admin');
                }
            }

            $this->validateRoleAccess($data);

            $oldValues = $user->toArray();

            $updateData = [
                'role_id' => $data['role_id'],
                'organization_id' => $data['organization_id'] ?? null,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'is_blocked' => $data['is_blocked'] ?? false,
                'can_login' => $data['can_login'] ?? true,
            ];

            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            $newValues = $user->fresh()->toArray();
            $changes = $this->detectChanges($oldValues, $newValues);

            if (!empty($changes)) {
                ActivityLogService::log(
                    module: 'USER',
                    action: 'UPDATE',
                    model: $user,
                    oldValues: $changes['old'],
                    newValues: $changes['new'],
                    description: 'Mengubah data user: ' . $user->name,
                    request: $request
                );
            }

            $this->clearAllCache();

            DB::commit();

            return $user->load(['role', 'organization.level']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(int $id, Request $request): bool
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if ($authUser && $authUser->id === $id) {
                throw new AuthorizationException('Tidak dapat menghapus akun sendiri');
            }

            if ($user->role?->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            $oldValues = $user->toArray();

            $user->delete();

            ActivityLogService::log(
                module: 'USER',
                action: 'DELETE',
                oldValues: $oldValues,
                description: 'Menghapus user: ' . $user->name,
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

    public function toggleStatus(int $id, Request $request): User
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if ($user->role?->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            $oldStatus = $user->is_active;

            $user->update(['is_active' => !$user->is_active]);

            ActivityLogService::log(
                module: 'USER',
                action: 'UPDATE',
                model: $user,
                oldValues: ['is_active' => $oldStatus],
                newValues: ['is_active' => $user->is_active],
                description: ($user->is_active ? 'Mengaktifkan' : 'Menonaktifkan') . ' user: ' . $user->name,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $user->load(['role', 'organization.level']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleBlock(int $id, Request $request): User
    {
        DB::beginTransaction();

        try {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if ($user->role?->slug === 'super-admin' && !$authUser?->isSuperAdmin()) {
                throw new AuthorizationException('Anda tidak memiliki akses');
            }

            $oldBlocked = $user->is_blocked;

            $user->update([
                'is_blocked' => !$user->is_blocked,
                'blocked_at' => !$user->is_blocked ? now() : null,
            ]);

            ActivityLogService::log(
                module: 'USER',
                action: 'UPDATE',
                model: $user,
                oldValues: ['is_blocked' => $oldBlocked],
                newValues: ['is_blocked' => $user->is_blocked],
                description: ($user->is_blocked ? 'Memblokir' : 'Membuka blokir') . ' user: ' . $user->name,
                request: $request
            );

            $this->clearAllCache();

            DB::commit();

            return $user->load(['role', 'organization.level']);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getStatistics(): array
    {
        $cacheKey = $this->getCacheKey('statistics');

        return $this->remember($cacheKey, function () {
            /** @var User|null $authUser */
            $authUser = Auth::user();

            $query = User::query();

            if (!$authUser?->isSuperAdmin()) {
                $query->whereHas('role', function ($q) {
                    $q->where('slug', '!=', 'super-admin');
                });
            }

            $total = $query->count();
            $active = (clone $query)->where('is_active', true)->count();
            $blocked = (clone $query)->where('is_blocked', true)->count();
            $canLogin = (clone $query)->where('can_login', true)->where('is_active', true)->where('is_blocked', false)->count();

            $roleStats = Role::query()
                ->select('roles.nama', 'roles.slug')
                ->withCount(['users' => function ($q) use ($authUser) {
                    if (!$authUser?->isSuperAdmin()) {
                        $q->whereHas('role', function ($q2) {
                            $q2->where('slug', '!=', 'super-admin');
                        });
                    }
                }])
                ->where('is_active', true)
                ->orderBy('nama')
                ->get();

            return [
                'total' => $total,
                'active' => $active,
                'blocked' => $blocked,
                'can_login' => $canLogin,
                'by_role' => $roleStats,
            ];
        });
    }

    protected function detectChanges(array $oldValues, array $newValues): array
    {
        $changes = ['old' => [], 'new' => []];

        $fields = ['name', 'email', 'phone', 'role_id', 'organization_id', 'is_active', 'is_blocked', 'can_login'];

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

    protected function clearAllCache(): void
    {
        parent::clearAllCache();
        Cache::forget($this->getCacheKey('statistics'));
        Cache::forget($this->getCacheKey('available_roles'));
    }
}