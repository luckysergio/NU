<?php

namespace App\Services;

use App\Models\Kota;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class KotaService
{
    /*
    |--------------------------------------------------------------------------
    | LIST KOTA
    |--------------------------------------------------------------------------
    */

    public function getAll(Request $request)
    {
        $search = trim(
            (string) $request->query('search')
        );

        /*
        |--------------------------------------------------------------------------
        | PER PAGE SAFE
        |--------------------------------------------------------------------------
        */

        $perPage = $request->query(
            'per_page',
            10
        );

        if (
            !is_numeric($perPage) ||
            (int) $perPage <= 0
        ) {
            $perPage = 10;
        }

        $perPage = (int) $perPage;

        if ($perPage > 1000) {
            $perPage = 1000;
        }

        return Kota::query()

            ->with([
                'kecamatans',
            ])

            ->when(
                $search,
                function ($query) use ($search) {

                    $search = strtolower($search);

                    $query->where(function ($q) use ($search) {

                        $q->whereRaw(
                            'LOWER(nama) LIKE ?',
                            ["%{$search}%"]
                        )

                        ->orWhereRaw(
                            'LOWER(kode) LIKE ?',
                            ["%{$search}%"]
                        );
                    });
                }
            )

            ->orderBy('nama', 'asc')

            ->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function findById(
        int $id
    ): Kota {

        return Kota::with([
            'kecamatans',
            'organizations',
        ])->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR PC
    |--------------------------------------------------------------------------
    */

    public function availableForPC(
        ?int $ignoreOrganizationId = null
    ) {

        $usedKotaIds = Organization::query()

            ->whereHas('level', function ($q) {
                $q->where('slug', 'pc');
            })

            ->whereNotNull('kota_id')

            ->when(
                $ignoreOrganizationId,
                function ($q) use (
                    $ignoreOrganizationId
                ) {
                    $q->where(
                        'id',
                        '!=',
                        $ignoreOrganizationId
                    );
                }
            )

            ->pluck('kota_id');

        return Kota::query()

            ->whereNotIn(
                'id',
                $usedKotaIds
            )

            ->where('is_active', true)

            ->orderBy('nama', 'asc')

            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        array $data,
        Request $request
    ): Kota {

        DB::beginTransaction();

        try {

            $kota = Kota::create([

                'nama' => $data['nama'],

                'kode' => strtoupper(
                    Str::slug(
                        $data['kode'],
                        ''
                    )
                ),

                'is_active' =>
                    $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(

                module: 'KOTA',

                action: 'CREATE',

                model: $kota,

                newValues: $kota->toArray(),

                description: 'Menambahkan kota',

                request: $request
            );

            DB::commit();

            return $kota;

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
    ): Kota {

        DB::beginTransaction();

        try {

            $kota = Kota::findOrFail($id);

            $payload = [

                'nama' => $data['nama'],

                'kode' => strtoupper(
                    Str::slug(
                        $data['kode'],
                        ''
                    )
                ),

                'is_active' =>
                    $data['is_active'] ?? true,
            ];

            $changes =
                ActivityLogService::detectChanges(
                    $kota,
                    $payload
                );

            $kota->update($payload);

            if (
                !empty($changes['old_values']) ||
                !empty($changes['new_values'])
            ) {

                ActivityLogService::log(

                    module: 'KOTA',

                    action: 'UPDATE',

                    model: $kota,

                    oldValues:
                        $changes['old_values'],

                    newValues:
                        $changes['new_values'],

                    description:
                        'Mengubah kota',

                    request: $request
                );
            }

            DB::commit();

            return $kota;

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

            $kota = Kota::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | CEK RELASI ORGANIZATION
            |--------------------------------------------------------------------------
            */

            if (
                $kota->organizations()->exists()
            ) {

                throw new \Exception(
                    'Kota masih digunakan organisasi.'
                );
            }

            ActivityLogService::log(

                module: 'KOTA',

                action: 'DELETE',

                model: $kota,

                oldValues: $kota->toArray(),

                description:
                    'Menghapus kota',

                request: $request
            );

            $kota->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}