<?php

namespace App\Services;

use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JabatanService
{
    public function getAll(Request $request)
    {
        $search = $request->query('search');

        return Jabatan::query()

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

            ->latest()

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(int $id): Jabatan
    {
        return Jabatan::with([
            'anggotas',
        ])->findOrFail($id);
    }

    public function store(
        array $data,
        Request $request
    ): Jabatan {

        DB::beginTransaction();

        try {

            $jabatan = Jabatan::create([

                'nama' => $data['nama'],

                'slug' => Str::slug($data['nama']),

                'is_active' =>
                $data['is_active'] ?? true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Activity Log
            |--------------------------------------------------------------------------
            */

            ActivityLogService::log(

                module: 'Jabatan',

                action: 'CREATE',

                model: $jabatan,

                newValues: $jabatan->toArray(),

                description: 'Menambahkan jabatan',

                request: $request
            );

            DB::commit();

            return $jabatan;
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function update(
        int $id,
        array $data,
        Request $request
    ): Jabatan {

        DB::beginTransaction();

        try {

            $jabatan = Jabatan::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | Detect Changes
            |--------------------------------------------------------------------------
            */

            $changes =
                ActivityLogService::detectChanges(
                    $jabatan,
                    [

                        'nama' => $data['nama'],

                        'slug' =>
                        Str::slug($data['nama']),

                        'is_active' =>
                        $data['is_active'] ?? true,
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | Update
            |--------------------------------------------------------------------------
            */

            $jabatan->update([

                'nama' => $data['nama'],

                'slug' => Str::slug($data['nama']),

                'is_active' =>
                $data['is_active'] ?? true,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Activity Log
            |--------------------------------------------------------------------------
            */

            if (
                !empty($changes['old_values']) ||
                !empty($changes['new_values'])
            ) {

                ActivityLogService::log(

                    module: 'Jabatan',

                    action: 'UPDATE',

                    model: $jabatan,

                    oldValues: $changes['old_values'],

                    newValues: $changes['new_values'],

                    description: 'Mengubah jabatan',

                    request: $request
                );
            }

            DB::commit();

            return $jabatan;
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function destroy(
        int $id,
        Request $request
    ): bool {

        DB::beginTransaction();

        try {

            $jabatan = Jabatan::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | Old Values
            |--------------------------------------------------------------------------
            */

            $oldValues = $jabatan->toArray();

            /*
            |--------------------------------------------------------------------------
            | Delete
            |--------------------------------------------------------------------------
            */

            $jabatan->delete();

            /*
            |--------------------------------------------------------------------------
            | Activity Log
            |--------------------------------------------------------------------------
            */

            ActivityLogService::log(

                module: 'Jabatan',

                action: 'DELETE',

                oldValues: $oldValues,

                description: 'Menghapus jabatan',

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
