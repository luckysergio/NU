<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Access\AuthorizationException;

class UserService
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $search = $request->query('search');

        $roleId = $request->query('role_id');

        $organizationId = $request->query(
            'organization_id'
        );

        /** @var User|null $authUser */
        $authUser = Auth::user();

        return User::query()

            ->with([

                'role',

                'organization.level',
            ])

            /*
            |--------------------------------------------------------------------------
            | HIDE SUPER ADMIN
            |--------------------------------------------------------------------------
            */

            ->when(
                !$authUser?->isSuperAdmin(),
                function ($query) {

                    $query->whereHas(
                        'role',
                        function ($q) {

                            $q->where(
                                'slug',
                                '!=',
                                'super-admin'
                            );
                        }
                    );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            ->when($search, function ($query) use ($search) {

                $query->where(function ($q) use ($search) {

                    $q->whereRaw(
                        'LOWER(name) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(email) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })

            /*
            |--------------------------------------------------------------------------
            | FILTER ROLE
            |--------------------------------------------------------------------------
            */

            ->when($roleId, function ($query) use ($roleId) {

                $query->where(
                    'role_id',
                    $roleId
                );
            })

            /*
            |--------------------------------------------------------------------------
            | FILTER ORGANIZATION
            |--------------------------------------------------------------------------
            */

            ->when(
                $organizationId,
                function ($query) use ($organizationId) {

                    $query->where(
                        'organization_id',
                        $organizationId
                    );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | JOIN
            |--------------------------------------------------------------------------
            */

            ->leftJoin(
                'roles',
                'roles.id',
                '=',
                'users.role_id'
            )

            ->leftJoin(
                'organizations',
                'organizations.id',
                '=',
                'users.organization_id'
            )

            ->leftJoin(
                'organization_levels',
                'organization_levels.id',
                '=',
                'organizations.organization_level_id'
            )

            ->select('users.*')

            /*
            |--------------------------------------------------------------------------
            | SORT ROLE
            |--------------------------------------------------------------------------
            */

            ->orderByRaw("
                CASE roles.slug
                    WHEN 'super-admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'operator' THEN 3
                    WHEN 'anggota' THEN 4
                    ELSE 99
                END
            ")

            /*
            |--------------------------------------------------------------------------
            | SORT ORGANIZATION LEVEL
            |--------------------------------------------------------------------------
            */

            ->orderByRaw("
                CASE organization_levels.slug
                    WHEN 'pc' THEN 1
                    WHEN 'mwc' THEN 2
                    WHEN 'ranting' THEN 3
                    WHEN 'lembaga' THEN 4
                    WHEN 'banom' THEN 5
                    ELSE 99
                END
            ")

            ->orderBy('users.name')

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE ROLES
    |--------------------------------------------------------------------------
    */

    public function availableRoles(
        int $organizationId
    ) {

        /** @var User|null $authUser */
        $authUser = Auth::user();

        if (!$authUser) {

            return collect([]);
        }

        $organization = Organization::with(
            'level'
        )->findOrFail($organizationId);

        $levelSlug = $organization
            ->level
            ?->slug;

        $query = Role::query();

        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN
        |--------------------------------------------------------------------------
        */

        if ($authUser->isSuperAdmin()) {

            /*
            |--------------------------------------------------------------------------
            | SUPER ADMIN HANYA DI PC
            |--------------------------------------------------------------------------
            */

            if ($levelSlug === 'pc') {

                return $query
                    ->whereIn('slug', [

                        'super-admin',
                        'admin',
                        'operator',
                        'anggota',

                    ])
                    ->orderBy('nama')
                    ->get();
            }

            /*
            |--------------------------------------------------------------------------
            | NON PC
            |--------------------------------------------------------------------------
            */

            return $query
                ->whereIn('slug', [

                    'admin',
                    'operator',
                    'anggota',

                ])
                ->orderBy('nama')
                ->get();
        }

        /*
        |--------------------------------------------------------------------------
        | ADMIN
        |--------------------------------------------------------------------------
        */

        if ($authUser->isAdmin()) {

            /*
            |--------------------------------------------------------------------------
            | ADMIN PC
            |--------------------------------------------------------------------------
            */

            if ($authUser->isPC()) {

                return $query
                    ->whereIn('slug', [

                        'admin',
                        'operator',
                        'anggota',

                    ])
                    ->orderBy('nama')
                    ->get();
            }

            /*
            |--------------------------------------------------------------------------
            | ADMIN NON PC
            |--------------------------------------------------------------------------
            */

            return $query
                ->whereIn('slug', [

                    'operator',
                    'anggota',

                ])
                ->orderBy('nama')
                ->get();
        }

        /*
        |--------------------------------------------------------------------------
        | OPERATOR
        |--------------------------------------------------------------------------
        */

        if ($authUser->isOperator()) {

            return $query
                ->whereIn('slug', [

                    'anggota',

                ])
                ->orderBy('nama')
                ->get();
        }

        return collect([]);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ROLE ACCESS
    |--------------------------------------------------------------------------
    */

    protected function validateRoleAccess(
        array $data
    ): void {

        if (empty($data['organization_id'])) {

            throw new AuthorizationException(
                'Organization wajib dipilih'
            );
        }

        $allowedRoles = $this->availableRoles(
            $data['organization_id']
        );

        $allowedRoleIds = $allowedRoles
            ->pluck('id')
            ->toArray();

        if (
            !in_array(
                $data['role_id'],
                $allowedRoleIds
            )
        ) {

            throw new AuthorizationException(
                'Role tidak diizinkan'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN ONLY FOR PC
        |--------------------------------------------------------------------------
        */

        $role = Role::find($data['role_id']);

        $organization = Organization::with(
            'level'
        )->find($data['organization_id']);

        if (
            $role?->slug === 'super-admin' &&
            $organization?->level?->slug !== 'pc'
        ) {

            throw new AuthorizationException(
                'Super admin hanya boleh di organisasi PC'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): User
    {
        /** @var User|null $authUser */
        $authUser = Auth::user();

        $user = User::with([

            'role',

            'organization.level',

            'devices',

        ])->findOrFail($id);

        if (
            $user->role?->slug === 'super-admin' &&
            !$authUser?->isSuperAdmin()
        ) {

            throw new AuthorizationException(
                'Anda tidak memiliki akses'
            );
        }

        return $user;
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        array $data,
        Request $request
    ): User {

        DB::beginTransaction();

        try {

            $this->validateRoleAccess($data);

            $user = User::create([

                'role_id' =>
                $data['role_id'],

                'organization_id' =>
                $data['organization_id'] ?? null,

                'name' =>
                $data['name'],

                'email' =>
                $data['email'],

                'phone' =>
                $data['phone'] ?? null,

                'password' =>
                Hash::make($data['password']),

                'is_active' =>
                $data['is_active'] ?? true,

                'is_blocked' =>
                $data['is_blocked'] ?? false,

                'can_login' =>
                $data['can_login'] ?? true,
            ]);

            // Log activity for create
            ActivityLogService::log(
                module: 'USER',
                action: 'CREATE',
                model: $user,
                newValues: $user->toArray(),
                description: 'Menambahkan user baru',
                request: $request
            );

            DB::commit();

            return $user->load([

                'role',

                'organization.level',
            ]);

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

    public function update(
        int $id,
        array $data,
        Request $request
    ): User {

        DB::beginTransaction();

        try {

            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if (
                $user->role?->slug === 'super-admin' &&
                !$authUser?->isSuperAdmin()
            ) {

                throw new AuthorizationException(
                    'Anda tidak memiliki akses'
                );
            }

            $this->validateRoleAccess($data);

            $updateData = [

                'role_id' =>
                $data['role_id'],

                'organization_id' =>
                $data['organization_id'] ?? null,

                'name' =>
                $data['name'],

                'email' =>
                $data['email'],

                'phone' =>
                $data['phone'] ?? null,

                'is_active' =>
                $data['is_active'] ?? true,

                'is_blocked' =>
                $data['is_blocked'] ?? false,

                'can_login' =>
                $data['can_login'] ?? true,
            ];

            if (!empty($data['password'])) {

                $updateData['password'] = Hash::make(
                    $data['password']
                );
            }

            // Detect changes before update
            $changes = ActivityLogService::detectChanges(
                $user,
                $updateData
            );

            $user->update($updateData);

            // Log activity for update if there are changes
            if (!empty($changes['old_values']) || !empty($changes['new_values'])) {

                ActivityLogService::log(
                    module: 'USER',
                    action: 'UPDATE',
                    model: $user,
                    oldValues: $changes['old_values'],
                    newValues: $changes['new_values'],
                    description: 'Mengubah data user',
                    request: $request
                );
            }

            DB::commit();

            return $user->load([

                'role',

                'organization.level',
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    public function destroy(
        int $id,
        Request $request
    ): bool {

        DB::beginTransaction();

        try {

            /** @var User|null $authUser */
            $authUser = Auth::user();

            $user = User::findOrFail($id);

            if (
                $user->role?->slug === 'super-admin' &&
                !$authUser?->isSuperAdmin()
            ) {

                throw new AuthorizationException(
                    'Anda tidak memiliki akses'
                );
            }

            $oldValues = $user->toArray();

            $user->delete();

            // Log activity for delete
            ActivityLogService::log(
                module: 'USER',
                action: 'DELETE',
                oldValues: $oldValues,
                description: 'Menghapus user',
                request: $request
            );

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}