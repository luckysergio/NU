<?php

namespace App\Services;

use App\Models\Kelurahan;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KelurahanService
{
    /*
    |--------------------------------------------------------------------------
    | LIST
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

        return Kelurahan::query()

            ->with([
                'kecamatan',
                'kecamatan.kota',
            ])

            /*
            |--------------------------------------------------------------------------
            | FILTER KECAMATAN
            |--------------------------------------------------------------------------
            */

            ->when(
                $request->kecamatan_id,
                function ($query) use ($request) {

                    $query->where(
                        'kecamatan_id',
                        $request->kecamatan_id
                    );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | FILTER KOTA
            |--------------------------------------------------------------------------
            */

            ->when(
                $request->kota_id,
                function ($query) use ($request) {

                    $query->whereHas(
                        'kecamatan',
                        function ($q) use ($request) {

                            $q->where(
                                'kota_id',
                                $request->kota_id
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
    ): Kelurahan {

        return Kelurahan::with([

            'kecamatan',
            'kecamatan.kota',
            'organizations',

        ])->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR RANTING
    |--------------------------------------------------------------------------
    */

    public function availableForRanting(
        ?int $ignoreOrganizationId = null,
        ?int $kotaId = null,
        ?int $kecamatanId = null
    ) {

        $usedKelurahanIds = Organization::query()

            ->whereHas('level', function ($q) {
                $q->where('slug', 'ranting');
            })

            ->whereNotNull('kelurahan_id')

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

            ->pluck('kelurahan_id');

        return Kelurahan::query()

            ->with([
                'kecamatan',
                'kecamatan.kota',
            ])

            ->when(
                $kecamatanId,
                function ($q) use (
                    $kecamatanId
                ) {

                    $q->where(
                        'kecamatan_id',
                        $kecamatanId
                    );
                }
            )

            ->when(
                $kotaId,
                function ($q) use (
                    $kotaId
                ) {

                    $q->whereHas(
                        'kecamatan',
                        function ($sub) use ($kotaId) {

                            $sub->where(
                                'kota_id',
                                $kotaId
                            );
                        }
                    );
                }
            )

            ->whereNotIn(
                'id',
                $usedKelurahanIds
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
    ): Kelurahan {

        DB::beginTransaction();

        try {

            $kelurahan = Kelurahan::create([

                'kecamatan_id' =>
                    $data['kecamatan_id'],

                'nama' =>
                    $data['nama'],

                'kode' =>
                    $data['kode'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(

                module: 'KELURAHAN',

                action: 'CREATE',

                model: $kelurahan,

                newValues:
                    $kelurahan->toArray(),

                description:
                    'Menambahkan kelurahan',

                request: $request
            );

            DB::commit();

            return $kelurahan->load([
                'kecamatan',
                'kecamatan.kota',
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
    ): Kelurahan {

        DB::beginTransaction();

        try {

            $kelurahan = Kelurahan::findOrFail($id);

            $payload = [

                'kecamatan_id' =>
                    $data['kecamatan_id'],

                'nama' =>
                    $data['nama'],

                'kode' =>
                    $data['kode'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ];

            $changes =
                ActivityLogService::detectChanges(
                    $kelurahan,
                    $payload
                );

            $kelurahan->update($payload);

            if (
                !empty($changes['old_values']) ||
                !empty($changes['new_values'])
            ) {

                ActivityLogService::log(

                    module: 'KELURAHAN',

                    action: 'UPDATE',

                    model: $kelurahan,

                    oldValues:
                        $changes['old_values'],

                    newValues:
                        $changes['new_values'],

                    description:
                        'Mengubah kelurahan',

                    request: $request
                );
            }

            DB::commit();

            return $kelurahan->load([
                'kecamatan',
                'kecamatan.kota',
            ]);

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

            $kelurahan = Kelurahan::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | CEK RELASI
            |--------------------------------------------------------------------------
            */

            if (
                $kelurahan->organizations()->exists()
            ) {

                throw new \Exception(
                    'Kelurahan masih digunakan organisasi.'
                );
            }

            ActivityLogService::log(

                module: 'KELURAHAN',

                action: 'DELETE',

                model: $kelurahan,

                oldValues:
                    $kelurahan->toArray(),

                description:
                    'Menghapus kelurahan',

                request: $request
            );

            $kelurahan->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}