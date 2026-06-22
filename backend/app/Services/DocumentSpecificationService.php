<?php

namespace App\Services;

use App\Models\DocumentSpecification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentSpecificationService
{
    public function getAll(Request $request)
    {
        $search = $request->query('search');

        $isActive = $request->query('is_active');

        return DocumentSpecification::query()

            ->when(
                $search,
                function ($query) use ($search) {

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
                }
            )

            ->when(
                $isActive !== null,
                function ($query) use ($isActive) {

                    $query->where(
                        'is_active',
                        filter_var(
                            $isActive,
                            FILTER_VALIDATE_BOOLEAN
                        )
                    );
                }
            )

            ->orderBy('urutan')

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(
        int $id
    ): DocumentSpecification {

        return DocumentSpecification::findOrFail($id);
    }

    public function store(
        array $data,
        Request $request
    ): DocumentSpecification {

        DB::beginTransaction();

        try {

            $documentSpecification =
                DocumentSpecification::create([

                    'nama' =>
                    $data['nama'],

                    'slug' =>
                    Str::slug($data['nama']),

                    'deskripsi' =>
                    $data['deskripsi'] ?? null,

                    'urutan' =>
                    $data['urutan'],

                    'is_active' =>
                    $data['is_active'] ?? true,
                ]);

            /*
            |--------------------------------------------------------------------------
            | Activity Log
            |--------------------------------------------------------------------------
            */

            ActivityLogService::log(

                module: 'DocumentSpecification',

                action: 'CREATE',

                model: $documentSpecification,

                newValues: $documentSpecification
                    ->toArray(),

                description: 'Menambahkan spesifikasi dokumen',

                request: $request
            );

            DB::commit();

            return $documentSpecification;
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }

    public function update(
        int $id,
        array $data,
        Request $request
    ): DocumentSpecification {

        DB::beginTransaction();

        try {

            $documentSpecification =
                DocumentSpecification::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | Detect Changes
            |--------------------------------------------------------------------------
            */

            $changes =
                ActivityLogService::detectChanges(
                    $documentSpecification,
                    [

                        'nama' =>
                        $data['nama'],

                        'slug' =>
                        Str::slug($data['nama']),

                        'deskripsi' =>
                        $data['deskripsi'] ?? null,

                        'urutan' =>
                        $data['urutan'],

                        'is_active' =>
                        $data['is_active'] ?? true,
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | Update
            |--------------------------------------------------------------------------
            */

            $documentSpecification->update([

                'nama' =>
                $data['nama'],

                'slug' =>
                Str::slug($data['nama']),

                'deskripsi' =>
                $data['deskripsi'] ?? null,

                'urutan' =>
                $data['urutan'],

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

                    module: 'DocumentSpecification',

                    action: 'UPDATE',

                    model: $documentSpecification,

                    oldValues: $changes['old_values'],

                    newValues: $changes['new_values'],

                    description: 'Mengubah spesifikasi dokumen',

                    request: $request
                );
            }

            DB::commit();

            return $documentSpecification;
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

            $documentSpecification =
                DocumentSpecification::findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | Old Values
            |--------------------------------------------------------------------------
            */

            $oldValues =
                $documentSpecification->toArray();

            /*
            |--------------------------------------------------------------------------
            | Delete
            |--------------------------------------------------------------------------
            */

            $documentSpecification->delete();

            /*
            |--------------------------------------------------------------------------
            | Activity Log
            |--------------------------------------------------------------------------
            */

            ActivityLogService::log(

                module: 'DocumentSpecification',

                action: 'DELETE',

                oldValues: $oldValues,

                description: 'Menghapus spesifikasi dokumen',

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
