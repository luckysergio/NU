<?php

namespace App\Services;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoleService
{
    public function getAll(Request $request)
    {
        $search = $request->query('search');

        $user = $request->user();

        return Role::query()

            /*
            |--------------------------------------------------------------------------
            | HIDE SUPER ADMIN ROLE
            |--------------------------------------------------------------------------
            */

            ->when(
                !$user?->role ||
                $user->role->slug !== 'super-admin',

                function ($query) {

                    $query->where(
                        'slug',
                        '!=',
                        'super-admin'
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
                        'LOWER(nama) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(slug) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })

            /*
            |--------------------------------------------------------------------------
            | SORT ROLE
            |--------------------------------------------------------------------------
            */

            ->orderByRaw("
                CASE slug
                    WHEN 'super-admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'operator' THEN 3
                    WHEN 'anggota' THEN 4
                    ELSE 99
                END
            ")

            ->orderBy('nama')

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(
        int $id,
        Request $request
    ): Role {

        $user = $request->user();

        $role = Role::with([
            'users',
        ])->findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | PROTECT SUPER ADMIN ROLE
        |--------------------------------------------------------------------------
        */

        if (
            $role->slug === 'super-admin' &&
            (
                !$user?->role ||
                $user->role->slug !== 'super-admin'
            )
        ) {

            abort(403, 'Anda tidak memiliki akses');
        }

        return $role;
    }

    public function store(
        array $data,
        Request $request
    ): Role {

        $user = $request->user();

        $slug = Str::slug($data['nama']);

        /*
        |--------------------------------------------------------------------------
        | ONLY SUPER ADMIN CAN CREATE SUPER ADMIN ROLE
        |--------------------------------------------------------------------------
        */

        if (
            $slug === 'super-admin' &&
            (
                !$user?->role ||
                $user->role->slug !== 'super-admin'
            )
        ) {

            abort(403, 'Anda tidak memiliki akses');
        }

        DB::beginTransaction();

        try {

            $role = Role::create([

                'nama' =>
                $data['nama'],

                'slug' =>
                $slug,
            ]);

            ActivityLogService::log(
                'ROLE',
                'CREATE',
                $role,
                null,
                $role->toArray(),
                'Menambahkan role',
                $request
            );

            DB::commit();

            return $role;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function update(
        int $id,
        array $data,
        Request $request
    ): Role {

        $user = $request->user();

        DB::beginTransaction();

        try {

            $role = Role::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | PROTECT SUPER ADMIN ROLE
            |--------------------------------------------------------------------------
            */

            if (
                $role->slug === 'super-admin' &&
                (
                    !$user?->role ||
                    $user->role->slug !== 'super-admin'
                )
            ) {

                abort(403, 'Anda tidak memiliki akses');
            }

            $newSlug = Str::slug($data['nama']);

            /*
            |--------------------------------------------------------------------------
            | ONLY SUPER ADMIN CAN CHANGE TO SUPER ADMIN
            |--------------------------------------------------------------------------
            */

            if (
                $newSlug === 'super-admin' &&
                (
                    !$user?->role ||
                    $user->role->slug !== 'super-admin'
                )
            ) {

                abort(403, 'Anda tidak memiliki akses');
            }

            $updateData = [

                'nama' =>
                $data['nama'],

                'slug' =>
                $newSlug,
            ];

            $changes = ActivityLogService::detectChanges(
                $role,
                $updateData
            );

            $role->update($updateData);

            ActivityLogService::log(
                'ROLE',
                'UPDATE',
                $role,
                $changes['old_values'],
                $changes['new_values'],
                'Mengubah role',
                $request
            );

            DB::commit();

            return $role;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function destroy(
        int $id,
        Request $request
    ): bool {

        $user = $request->user();

        DB::beginTransaction();

        try {

            $role = Role::withCount('users')
                ->findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | PROTECT SUPER ADMIN ROLE
            |--------------------------------------------------------------------------
            */

            if (
                $role->slug === 'super-admin' &&
                (
                    !$user?->role ||
                    $user->role->slug !== 'super-admin'
                )
            ) {

                abort(403, 'Anda tidak memiliki akses');
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK RELATION
            |--------------------------------------------------------------------------
            */

            if ($role->users_count > 0) {

                throw new \Exception(
                    'Role masih digunakan oleh user'
                );
            }

            ActivityLogService::log(
                'ROLE',
                'DELETE',
                $role,
                $role->toArray(),
                null,
                'Menghapus role',
                $request
            );

            $role->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}