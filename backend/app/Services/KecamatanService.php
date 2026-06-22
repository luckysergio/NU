<?php

namespace App\Services;

use App\Models\Kecamatan;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KecamatanService
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

        return Kecamatan::query()

            ->with([
                'kota',
            ])

            /*
            |--------------------------------------------------------------------------
            | FILTER KOTA
            |--------------------------------------------------------------------------
            */

            ->when(
                $request->kota_id,
                function ($query) use ($request) {

                    $query->where(
                        'kota_id',
                        $request->kota_id
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
    ): Kecamatan {

        return Kecamatan::with([
            'kota',
            'kelurahans',
            'organizations',
        ])->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE FOR MWC
    |--------------------------------------------------------------------------
    */

    public function availableForMWC(
        ?int $ignoreOrganizationId = null,
        ?int $kotaId = null
    ) {

        // Jika kota tidak dipilih, return collection kosong
        if (!$kotaId) {
            return collect([]);
        }

        // Ambil ID kecamatan yang sudah digunakan oleh organisasi MWC
        $usedKecamatanIds = Organization::query()

            ->whereHas('level', function ($q) {
                $q->where('slug', 'mwc');
            })

            ->whereNotNull('kecamatan_id')

            ->when(
                $ignoreOrganizationId,
                function ($q) use ($ignoreOrganizationId) {
                    $q->where('id', '!=', $ignoreOrganizationId);
                }
            )

            ->pluck('kecamatan_id')
            ->unique()
            ->toArray();

        // Return kecamatan yang belum digunakan dan berada di kota yang dipilih
        return Kecamatan::query()

            ->with('kota')

            ->where('kota_id', $kotaId)
            ->where('is_active', true)
            ->whereNotIn('id', $usedKecamatanIds)
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
    ): Kecamatan {

        DB::beginTransaction();

        try {

            // Validasi unique nama dalam satu kota
            $exists = Kecamatan::where('kota_id', $data['kota_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kecamatan sudah digunakan di kota ini.');
            }

            $kecamatan = Kecamatan::create([

                'kota_id' =>
                    $data['kota_id'],

                'nama' =>
                    $data['nama'],

                'kode' =>
                    $data['kode'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ]);

            ActivityLogService::log(

                module: 'KECAMATAN',

                action: 'CREATE',

                model: $kecamatan,

                newValues:
                    $kecamatan->toArray(),

                description:
                    'Menambahkan kecamatan',

                request: $request
            );

            DB::commit();

            return $kecamatan->load('kota');

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
    ): Kecamatan {

        DB::beginTransaction();

        try {

            $kecamatan = Kecamatan::findOrFail($id);

            // Validasi unique nama dalam satu kota (kecuali diri sendiri)
            $exists = Kecamatan::where('kota_id', $data['kota_id'])
                ->whereRaw('LOWER(nama) = ?', [strtolower($data['nama'])])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                throw new \Exception('Nama kecamatan sudah digunakan di kota ini.');
            }

            $payload = [

                'kota_id' =>
                    $data['kota_id'],

                'nama' =>
                    $data['nama'],

                'kode' =>
                    $data['kode'] ?? null,

                'is_active' =>
                    $data['is_active'] ?? true,
            ];

            $changes =
                ActivityLogService::detectChanges(
                    $kecamatan,
                    $payload
                );

            $kecamatan->update($payload);

            if (
                !empty($changes['old_values']) ||
                !empty($changes['new_values'])
            ) {

                ActivityLogService::log(

                    module: 'KECAMATAN',

                    action: 'UPDATE',

                    model: $kecamatan,

                    oldValues:
                        $changes['old_values'],

                    newValues:
                        $changes['new_values'],

                    description:
                        'Mengubah kecamatan',

                    request: $request
                );
            }

            DB::commit();

            return $kecamatan->load('kota');

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

            $kecamatan = Kecamatan::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | CEK RELASI ORGANISASI
            |--------------------------------------------------------------------------
            */

            if (
                $kecamatan->organizations()->exists()
            ) {

                throw new \Exception(
                    'Kecamatan masih digunakan oleh organisasi MWC.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | CEK RELASI KELURAHAN
            |--------------------------------------------------------------------------
            */

            if (
                $kecamatan->kelurahans()->exists()
            ) {

                throw new \Exception(
                    'Kecamatan masih memiliki data kelurahan. Hapus kelurahan terlebih dahulu.'
                );
            }

            ActivityLogService::log(

                module: 'KECAMATAN',

                action: 'DELETE',

                model: $kecamatan,

                oldValues:
                    $kecamatan->toArray(),

                description:
                    'Menghapus kecamatan',

                request: $request
            );

            $kecamatan->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY KOTA
    |--------------------------------------------------------------------------
    */

    public function getByKota(
        int $kotaId
    ) {

        return Kecamatan::where('kota_id', $kotaId)
            ->where('is_active', true)
            ->orderBy('nama', 'asc')
            ->get();
    }
}