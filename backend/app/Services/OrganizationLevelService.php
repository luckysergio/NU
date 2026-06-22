<?php

namespace App\Services;

use App\Models\OrganizationLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationLevelService
{
    public function getAll(Request $request)
    {
        $search = $request->query('search');

        return OrganizationLevel::query()

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

            ->orderBy('urutan')

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(
        int $id
    ): OrganizationLevel {

        return OrganizationLevel::findOrFail($id);
    }

    public function store(
        array $data,
        Request $request
    ): OrganizationLevel {

        DB::beginTransaction();

        try {

            $level = OrganizationLevel::create([

                'nama' => $data['nama'],

                'slug' => Str::slug($data['nama']),

                'urutan' => $data['urutan'],
            ]);

            ActivityLogService::log(
                'ORGANIZATION_LEVEL',
                'CREATE',
                $level,
                null,
                $level->toArray(),
                'Menambahkan level organisasi',
                $request
            );

            DB::commit();

            return $level;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function update(
        int $id,
        array $data,
        Request $request
    ): OrganizationLevel {

        DB::beginTransaction();

        try {

            $level = OrganizationLevel::findOrFail($id);

            $changes = ActivityLogService::detectChanges(
                $level,
                [
                    'nama' => $data['nama'],
                    'slug' => Str::slug($data['nama']),
                    'urutan' => $data['urutan'],
                ]
            );

            $level->update([

                'nama' => $data['nama'],

                'slug' => Str::slug($data['nama']),

                'urutan' => $data['urutan'],
            ]);

            ActivityLogService::log(
                'ORGANIZATION_LEVEL',
                'UPDATE',
                $level,
                $changes['old_values'],
                $changes['new_values'],
                'Mengubah level organisasi',
                $request
            );

            DB::commit();

            return $level;

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

            $level = OrganizationLevel::findOrFail($id);

            ActivityLogService::log(
                'ORGANIZATION_LEVEL',
                'DELETE',
                $level,
                $level->toArray(),
                null,
                'Menghapus level organisasi',
                $request
            );

            $level->delete();

            DB::commit();

            return true;

        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}