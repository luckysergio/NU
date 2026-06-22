<?php

namespace App\Services;

use App\Models\LoginLog;
use Illuminate\Http\Request;

class LoginLogService
{
    public function getAll(Request $request)
    {
        return LoginLog::query()

            ->with([
                'user',
            ])

            ->when(
                $request->search,
                function ($query) use ($request) {

                    $search = strtolower($request->search);

                    $query->where(function ($q) use ($search) {

                        $q->whereRaw(
                            'LOWER(email) LIKE ?',
                            ['%' . $search . '%']
                        )

                            ->orWhereHas(
                                'user',
                                function ($uq) use ($search) {

                                    $uq->whereRaw(
                                        'LOWER(name) LIKE ?',
                                        ['%' . $search . '%']
                                    );
                                }
                            );
                    });
                }
            )

            ->when(
                $request->user_id,
                function ($query) use ($request) {

                    $query->where(
                        'user_id',
                        $request->user_id
                    );
                }
            )

            ->when(
                !is_null($request->is_success),
                function ($query) use ($request) {

                    $query->where(
                        'is_success',
                        filter_var(
                            $request->is_success,
                            FILTER_VALIDATE_BOOLEAN
                        )
                    );
                }
            )

            ->when(
                $request->start_date,
                function ($query) use ($request) {

                    $query->whereDate(
                        'created_at',
                        '>=',
                        $request->start_date
                    );
                }
            )

            ->when(
                $request->end_date,
                function ($query) use ($request) {

                    $query->whereDate(
                        'created_at',
                        '<=',
                        $request->end_date
                    );
                }
            )

            ->latest()

            ->paginate(
                $request->query('per_page', 10)
            );
    }

    public function findById(int $id): LoginLog
    {
        return LoginLog::with([
            'user',
        ])->findOrFail($id);
    }
}
