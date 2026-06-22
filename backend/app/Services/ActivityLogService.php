<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;

class ActivityLogService
{
    public static function log(

        string $module,

        string $action,

        ?Model $model = null,

        ?array $oldValues = null,

        ?array $newValues = null,

        ?string $description = null,

        ?Request $request = null

    ): void {

        $request ??= request();

        ActivityLog::create([

            'user_id' => auth('api')->id(),

            'module' => strtoupper($module),

            'action' => strtoupper($action),

            'model_type' => $model
                ? get_class($model)
                : null,

            'model_id' => $model?->id,

            'old_values' => $oldValues,

            'new_values' => $newValues,

            'method' => $request->method(),

            'url' => $request->fullUrl(),

            'ip_address' => $request->ip(),

            'user_agent' => $request->userAgent(),

            'description' => $description,
        ]);
    }

    public static function detectChanges(
        Model $model,
        array $newData
    ): array {

        $oldValues = [];

        $newValues = [];

        foreach ($newData as $field => $value) {

            $old = $model->getOriginal($field);

            if ($old != $value) {

                $oldValues[$field] = $old;

                $newValues[$field] = $value;
            }
        }

        return [

            'old_values' => $oldValues,

            'new_values' => $newValues,
        ];
    }

    public static function format(ActivityLog $log): array
    {
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

            'old_values' => $log->old_values,

            'new_values' => $log->new_values,

            'created_at' => $log->created_at,

            'user' => $log->user
                ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ]
                : null,
        ];
    }
}