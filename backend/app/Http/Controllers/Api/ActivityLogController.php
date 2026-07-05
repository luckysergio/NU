<?php
// app/Http/Controllers/Api/ActivityLogController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Database\Eloquent\Builder;

class ActivityLogController extends Controller
{
    protected const CACHE_DURATION = 300;

    public function __construct()
    {
        ini_set('max_execution_time', 120);
    }

    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'module' => 'nullable|string|max:100',
            'action' => 'nullable|string|max:50',
            'user_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
            'sort_by' => ['nullable', Rule::in(['created_at', 'module', 'action', 'user_id'])],
            'sort_order' => ['nullable', Rule::in(['asc', 'desc'])],
            'bypass_cache' => 'nullable|boolean',
            '_t' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $this->getLogs($request);

            return response()->json([
                'success' => true,
                'message' => 'List activity log berhasil diambil',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('ActivityLogController error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get logs with filters and caching
     * 
     * @param Request $request
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    protected function getLogs(Request $request)
    {
        $search = trim((string) $request->query('search'));
        $module = $request->query('module');
        $action = $request->query('action');
        $userId = $request->query('user_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $perPage = $this->validatePerPage($request->query('per_page', 10));
        $page = (int) $request->query('page', 1);
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildQuery(
                $search, $module, $action, $userId, $startDate, $endDate, $sortBy, $sortOrder
            )->paginate($perPage);
        }

        $cacheKey = $this->getCacheKey([
            'search' => $search,
            'module' => $module,
            'action' => $action,
            'user_id' => $userId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'per_page' => $perPage,
            'page' => $page,
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder,
        ]);

        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use (
            $search, $module, $action, $userId, $startDate, $endDate, $sortBy, $sortOrder, $perPage
        ) {
            return $this->buildQuery(
                $search, $module, $action, $userId, $startDate, $endDate, $sortBy, $sortOrder
            )->paginate($perPage);
        });
    }

    /**
     * Build query for activity logs
     * 
     * @param string $search
     * @param string|null $module
     * @param string|null $action
     * @param int|null $userId
     * @param string|null $startDate
     * @param string|null $endDate
     * @param string $sortBy
     * @param string $sortOrder
     * @return Builder|\Illuminate\Database\Query\Builder
     */
    protected function buildQuery(
        string $search,
        ?string $module,
        ?string $action,
        ?int $userId,
        ?string $startDate,
        ?string $endDate,
        string $sortBy,
        string $sortOrder
    ) {
        $query = ActivityLog::with(['user' => function ($q) {
            $q->select('id', 'name', 'email');
        }])
        ->select([
            'id', 'user_id', 'module', 'action',
            'model_type', 'model_id',
            'old_values', 'new_values',
            'method', 'url', 'ip_address', 'user_agent',
            'description', 'created_at'
        ]);

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('module', 'LIKE', "%{$search}%")
                  ->orWhere('action', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhere('ip_address', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function ($sub) use ($search) {
                      $sub->where('name', 'LIKE', "%{$search}%")
                          ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Module filter
        if ($module) {
            $query->where('module', strtoupper($module));
        }

        // Action filter
        if ($action) {
            $query->where('action', strtoupper($action));
        }

        // User filter
        if ($userId) {
            $query->where('user_id', $userId);
        }

        // Date range filter
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        // Sorting
        $sortColumns = [
            'created_at' => 'created_at',
            'module' => 'module',
            'action' => 'action',
            'user_id' => 'user_id',
        ];

        $sortColumn = $sortColumns[$sortBy] ?? 'created_at';
        $query->orderBy($sortColumn, $sortOrder);

        return $query;
    }

    /**
     * Validate and sanitize per page value
     * 
     * @param mixed $perPage
     * @return int
     */
    protected function validatePerPage($perPage): int
    {
        if (!is_numeric($perPage) || (int) $perPage <= 0) {
            return 10;
        }

        $perPage = (int) $perPage;

        if ($perPage > 100) {
            return 100;
        }

        return $perPage;
    }

    /**
     * Generate cache key
     * 
     * @param array $params
     * @return string
     */
    protected function getCacheKey(array $params): string
    {
        ksort($params);
        return 'activity_logs_' . md5(json_encode($params));
    }

    public function show(int $id): JsonResponse
    {
        try {
            $log = ActivityLog::with('user')
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail activity log berhasil diambil',
                'data' => ActivityLogService::format($log),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Activity log tidak ditemukan',
            ], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $log = ActivityLog::findOrFail($id);
            $log->delete();

            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Activity log berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function modules(): JsonResponse
    {
        try {
            $cacheKey = 'activity_logs_modules';
            
            $modules = Cache::remember($cacheKey, self::CACHE_DURATION, function () {
                return ActivityLog::query()
                    ->select('module')
                    ->distinct()
                    ->orderBy('module')
                    ->pluck('module')
                    ->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $modules,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to get modules: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data modul',
            ], 500);
        }
    }

    public function actions(): JsonResponse
    {
        try {
            $cacheKey = 'activity_logs_actions';
            
            $actions = Cache::remember($cacheKey, self::CACHE_DURATION, function () {
                return ActivityLog::query()
                    ->select('action')
                    ->distinct()
                    ->orderBy('action')
                    ->pluck('action')
                    ->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $actions,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to get actions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data aksi',
            ], 500);
        }
    }

    /**
     * Get list of users who have activity logs
     */
    public function users(): JsonResponse
    {
        try {
            $cacheKey = 'activity_logs_users';
            
            $users = Cache::remember($cacheKey, self::CACHE_DURATION, function () {
                // Ambil user_id yang unik dari activity logs
                $userIds = ActivityLog::query()
                    ->select('user_id')
                    ->distinct()
                    ->whereNotNull('user_id')
                    ->pluck('user_id')
                    ->toArray();
                
                if (empty($userIds)) {
                    return [];
                }
                
                // Ambil data user berdasarkan user_id
                return \App\Models\User::whereIn('id', $userIds)
                    ->select('id', 'name', 'email')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                        ];
                    })
                    ->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $users,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to get users: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data user: ' . $e->getMessage(),
            ], 500);
        }
    }
}