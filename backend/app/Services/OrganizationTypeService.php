<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationTypeService
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function getAll(
        Request $request
    ): LengthAwarePaginator {

        $search = trim(
            strtolower(
                (string) $request->query('search')
            )
        );

        $perPage = (int) $request->query(
            'per_page',
            10
        );

        if ($perPage <= 0) {
            $perPage = 10;
        }

        if ($perPage > 1000) {
            $perPage = 1000;
        }

        return OrganizationType::query()

            ->with('level')

            ->when(
                $request->organization_level_id,
                function ($query) use ($request) {

                    $query->where(
                        'organization_level_id',
                        $request->organization_level_id
                    );
                }
            )

            ->when($search, function ($query) use ($search) {

                $query->where(function ($q) use ($search) {

                    $q->whereRaw(
                        'LOWER(nama) LIKE ?',
                        ["%{$search}%"]
                    )

                    ->orWhereRaw(
                        'LOWER(slug) LIKE ?',
                        ["%{$search}%"]
                    );
                });
            })

            ->orderBy('nama')

            ->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE BY LEVEL
    |--------------------------------------------------------------------------
    */

    public function getAvailableByLevel(
        int $levelId
    ): Collection {

        return OrganizationType::query()

            ->where(
                'organization_level_id',
                $levelId
            )

            ->where('is_active', true)

            ->orderBy('nama')

            ->get();
    }

    /*
|--------------------------------------------------------------------------
| GET UNUSED BY LEVEL (Tipe yang belum memiliki organisasi)
|--------------------------------------------------------------------------
*/

public function getUnusedByLevel(
    int $levelId,
    ?int $ignoreOrganizationId = null
): Collection {

    // Get type IDs that are already used by organizations of this level
    $usedTypeIds = Organization::query()
        ->whereHas('level', function ($q) use ($levelId) {
            $q->where('id', $levelId);
        })
        ->whereNotNull('organization_type_id')
        ->when($ignoreOrganizationId, function ($q) use ($ignoreOrganizationId) {
            $q->where('id', '!=', $ignoreOrganizationId);
        })
        ->pluck('organization_type_id')
        ->unique()
        ->toArray();

    return OrganizationType::query()
        ->where('organization_level_id', $levelId)
        ->where('is_active', true)
        ->whereNotIn('id', $usedTypeIds)
        ->orderBy('nama', 'asc')
        ->get();
}

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function findById(
        int $id
    ): OrganizationType {

        return OrganizationType::with([
            'level',
            'organizations',
        ])->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        array $data,
        Request $request
    ): OrganizationType {

        DB::beginTransaction();

        try {

            $this->validateUniqueName(
                $data
            );

            $type = OrganizationType::create([

                'organization_level_id' =>
                    $data['organization_level_id'],

                'nama' =>
                    $data['nama'],

                'slug' =>
                    Str::slug($data['nama']),

                'deskripsi' =>
                    $data['deskripsi'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(
                'ORGANIZATION_TYPE',
                'CREATE',
                $type,
                null,
                $type->toArray(),
                'Menambahkan tipe organisasi',
                $request
            );

            DB::commit();

            return $type->load('level');

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
    ): OrganizationType {

        DB::beginTransaction();

        try {

            $type = OrganizationType::findOrFail($id);

            $this->validateUniqueName(
                $data,
                $id
            );

            $payload = [

                'organization_level_id' =>
                    $data['organization_level_id'],

                'nama' =>
                    $data['nama'],

                'slug' =>
                    Str::slug($data['nama']),

                'deskripsi' =>
                    $data['deskripsi'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ];

            $changes = ActivityLogService::detectChanges(
                $type,
                $payload
            );

            $type->update($payload);

            ActivityLogService::log(
                'ORGANIZATION_TYPE',
                'UPDATE',
                $type,
                $changes['old_values'],
                $changes['new_values'],
                'Mengubah tipe organisasi',
                $request
            );

            DB::commit();

            return $type->load('level');

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

    public function destroy(
        int $id,
        Request $request
    ): bool {

        DB::beginTransaction();

        try {

            $type = OrganizationType::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | VALIDATION
            |--------------------------------------------------------------------------
            */

            $used = Organization::where(
                'organization_type_id',
                $id
            )->exists();

            if ($used) {

                throw new \Exception(
                    'Tipe organisasi masih digunakan organisasi lain.'
                );
            }

            ActivityLogService::log(
                'ORGANIZATION_TYPE',
                'DELETE',
                $type,
                $type->toArray(),
                null,
                'Menghapus tipe organisasi',
                $request
            );

            $type->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE UNIQUE NAME
    |--------------------------------------------------------------------------
    */

    private function validateUniqueName(
        array $data,
        ?int $ignoreId = null
    ): void {

        $exists = OrganizationType::query()

            ->whereRaw(
                'LOWER(nama) = ?',
                [strtolower($data['nama'])]
            )

            ->where(
                'organization_level_id',
                $data['organization_level_id']
            )

            ->when(
                $ignoreId,
                function ($query) use ($ignoreId) {

                    $query->where(
                        'id',
                        '!=',
                        $ignoreId
                    );
                }
            )

            ->exists();

        if ($exists) {

            throw new \Exception(
                'Nama tipe organisasi sudah digunakan pada level tersebut.'
            );
        }
    }
}