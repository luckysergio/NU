<?php

namespace App\Services;

use App\Models\ProgramGoal;
use Illuminate\Http\Request;

class ProgramGoalService
{
    public function getAll(Request $request)
    {
        $search = trim(
            (string) $request->query('search')
        );

        return ProgramGoal::query()

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

    public function findById(int $id): ProgramGoal
    {
        return ProgramGoal::findOrFail($id);
    }

    public function store(array $data): ProgramGoal
    {
        return ProgramGoal::create($data);
    }

    public function update(
        int $id,
        array $data
    ): ProgramGoal {

        $goal = ProgramGoal::findOrFail($id);

        $goal->update($data);

        return $goal->fresh();
    }

    public function destroy(int $id): bool
    {
        ProgramGoal::findOrFail($id)
            ->delete();

        return true;
    }
}
