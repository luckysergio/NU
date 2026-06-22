<?php

namespace App\Services;

use App\Models\ProgramTarget;
use Illuminate\Http\Request;

class ProgramTargetService
{
    public function getAll(Request $request)
    {
        $search = trim(
            (string) $request->query('search')
        );

        return ProgramTarget::query()

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

    public function findById(int $id): ProgramTarget
    {
        return ProgramTarget::findOrFail($id);
    }

    public function store(array $data): ProgramTarget
    {
        return ProgramTarget::create($data);
    }

    public function update(
        int $id,
        array $data
    ): ProgramTarget {

        $target = ProgramTarget::findOrFail($id);

        $target->update($data);

        return $target->fresh();
    }

    public function destroy(int $id): bool
    {
        ProgramTarget::findOrFail($id)
            ->delete();

        return true;
    }
}