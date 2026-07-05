<?php
// app/Services/ActivityLogService.php - Perbaiki method detectChanges

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    protected const CACHE_DURATION = 300;

    /**
     * Log activity
     */
    public static function log(
        string $module,
        string $action,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?Request $request = null
    ): void {
        try {
            $request ??= request();
            $user = Auth::guard('api')->user();

            // PERBAIKAN: Hanya log jika ada perubahan
            if ($action === 'UPDATE' && empty($oldValues) && empty($newValues)) {
                return;
            }

            ActivityLog::create([
                'user_id' => $user?->id,
                'module' => strtoupper($module),
                'action' => strtoupper($action),
                'model_type' => $model ? get_class($model) : null,
                'model_id' => $model?->id,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => $description,
            ]);

            self::clearCache();

        } catch (\Exception $e) {
            Log::error('Failed to log activity: ' . $e->getMessage(), [
                'module' => $module,
                'action' => $action,
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Detect changes between model original and new data
     * PERBAIKAN: Lebih akurat menggunakan getDirty()
     */
    public static function detectChanges(Model $model, array $newData): array
    {
        $oldValues = [];
        $newValues = [];

        // Ambil field yang berubah dari model
        $dirty = $model->getDirty();
        
        if (empty($dirty)) {
            return [
                'old_values' => [],
                'new_values' => [],
            ];
        }

        foreach ($dirty as $field => $newValue) {
            $oldValue = $model->getOriginal($field);
            
            $oldValues[$field] = $oldValue;
            $newValues[$field] = $newValue;
        }

        return [
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ];
    }

    /**
     * Format activity log for response
     */
    public static function format(ActivityLog $log): array
    {
        $oldValues = $log->old_values;
        $newValues = $log->new_values;
        
        if (is_string($oldValues)) {
            $oldValues = json_decode($oldValues, true) ?? [];
        }
        if (is_string($newValues)) {
            $newValues = json_decode($newValues, true) ?? [];
        }

        return [
            'id' => $log->id,
            'module' => $log->module,
            'action' => $log->action,
            'description' => $log->description,
            'method' => $log->method,
            'url' => $log->url,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'model_type' => $log->model_type,
            'model_id' => $log->model_id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'created_at' => $log->created_at?->toISOString(),
            'user' => $log->user ? [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'email' => $log->user->email,
            ] : null,
        ];
    }

    /**
     * Log model created
     */
    public static function logCreated(Model $model, string $module, ?Request $request = null): void
    {
        self::log(
            module: $module,
            action: 'CREATE',
            model: $model,
            newValues: $model->toArray(),
            description: 'Menambahkan ' . strtolower($module),
            request: $request
        );
    }

    /**
     * Log model updated
     * PERBAIKAN: Gunakan detectChanges yang sudah diperbaiki
     */
    public static function logUpdated(Model $model, string $module, array $oldValues, array $newValues, ?Request $request = null): void
    {
        // Jika tidak ada perubahan, jangan log
        if (empty($oldValues) && empty($newValues)) {
            return;
        }

        self::log(
            module: $module,
            action: 'UPDATE',
            model: $model,
            oldValues: $oldValues,
            newValues: $newValues,
            description: 'Mengubah ' . strtolower($module),
            request: $request
        );
    }

    /**
     * Log model deleted
     */
    public static function logDeleted(Model $model, string $module, ?Request $request = null): void
    {
        self::log(
            module: $module,
            action: 'DELETE',
            model: $model,
            oldValues: $model->toArray(),
            description: 'Menghapus ' . strtolower($module),
            request: $request
        );
    }

    /**
     * Log user login
     */
    public static function logLogin(User $user, ?Request $request = null): void
    {
        self::log(
            module: 'LOGIN',
            action: 'LOGIN',
            model: $user,
            newValues: ['user_id' => $user->id, 'email' => $user->email],
            description: 'User ' . $user->name . ' login ke sistem',
            request: $request
        );
    }

    /**
     * Log user logout
     */
    public static function logLogout(User $user, ?Request $request = null): void
    {
        self::log(
            module: 'LOGOUT',
            action: 'LOGOUT',
            model: $user,
            newValues: ['user_id' => $user->id, 'email' => $user->email],
            description: 'User ' . $user->name . ' logout dari sistem',
            request: $request
        );
    }

    /**
     * Clear cache for activity logs
     */
    protected static function clearCache(): void
    {
        try {
            Cache::forget('activity_logs_list');
            Cache::forget('activity_logs_modules');
            Cache::forget('activity_logs_actions');
            Cache::forget('activity_logs_users');
        } catch (\Exception $e) {
            // Ignore cache clear errors
        }
    }
}