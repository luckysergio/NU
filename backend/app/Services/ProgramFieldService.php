<?php

namespace App\Services;

use App\Models\ProgramField;
use Illuminate\Http\Request;

class ProgramFieldService
{
    public function getAll(Request $request)
    {
        $search = trim(
            (string) $request->query('search')
        );

        return ProgramField::query()

            ->when($search, function ($query) use ($search) {

                $query->whereRaw(
                    'LOWER(nama) LIKE ?',
                    ['%' . strtolower($search) . '%']
                );
            })

            ->orderBy('nama')
            ->paginate(
                (int) $request->input('per_page', 10)
            );
    }

    public function findById(
        int $id
    ): ProgramField {

        return ProgramField::findOrFail($id);
    }

    public function store(
        array $data
    ): ProgramField {

        return ProgramField::create($data);
    }

    public function update(
        int $id,
        array $data
    ): ProgramField {

        $field = ProgramField::findOrFail($id);

        $field->update($data);

        return $field->fresh();
    }

    public function destroy(
        int $id
    ): bool {

        ProgramField::findOrFail($id)
            ->delete();

        return true;
    }
}