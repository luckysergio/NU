<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {

        $search = $request->query('search');

        $module = $request->query('module');

        $action = $request->query('action');

        $startDate = $request->query('start_date');

        $endDate = $request->query('end_date');

        $perPage = $request->query('per_page', 10);

        $logs = ActivityLog::query()

            ->with([
                'user',
            ])

            ->when($search, function ($query) use ($search) {

                $query->where(function ($q) use ($search) {

                    $q->whereRaw(
                        'LOWER(module) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(action) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    )

                    ->orWhereRaw(
                        'LOWER(description) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })

            ->when($module, function ($query) use ($module) {

                $query->where(
                    'module',
                    strtoupper($module)
                );
            })

            ->when($action, function ($query) use ($action) {

                $query->where(
                    'action',
                    strtoupper($action)
                );
            })

            ->when($startDate, function ($query) use ($startDate) {

                $query->whereDate(
                    'created_at',
                    '>=',
                    $startDate
                );
            })

            ->when($endDate, function ($query) use ($endDate) {

                $query->whereDate(
                    'created_at',
                    '<=',
                    $endDate
                );
            })

            ->latest()

            ->paginate($perPage);

        $logs->getCollection()->transform(function ($log) {

            return ActivityLogService::format($log);
        });

        return response()->json([

            'success' => true,

            'message' => 'List activity log',

            'data' => $logs,
        ]);
    }

    public function show(
        int $id
    ): JsonResponse {

        $log = ActivityLog::with([
            'user',
        ])->findOrFail($id);

        return response()->json([

            'success' => true,

            'message' => 'Detail activity log',

            'data' => ActivityLogService::format($log),
        ]);
    }

    public function destroy(
        int $id
    ): JsonResponse {

        $log = ActivityLog::findOrFail($id);

        $log->delete();

        return response()->json([

            'success' => true,

            'message' =>
                'Activity log berhasil dihapus',
        ]);
    }

    public function modules(): JsonResponse
    {
        $modules = ActivityLog::query()

            ->select('module')

            ->distinct()

            ->orderBy('module')

            ->pluck('module');

        return response()->json([

            'success' => true,

            'data' => $modules,
        ]);
    }

    public function actions(): JsonResponse
    {
        $actions = ActivityLog::query()

            ->select('action')

            ->distinct()

            ->orderBy('action')

            ->pluck('action');

        return response()->json([

            'success' => true,

            'data' => $actions,
        ]);
    }
}