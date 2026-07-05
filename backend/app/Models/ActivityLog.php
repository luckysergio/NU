<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'module',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'description',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessor untuk mendapatkan nama user
     */
    public function getUserNameAttribute(): string
    {
        return $this->user?->name ?? 'System';
    }

    /**
     * Accessor untuk mendapatkan email user
     */
    public function getUserEmailAttribute(): string
    {
        return $this->user?->email ?? 'system@nu.or.id';
    }

    /**
     * Accessor untuk mendapatkan module display name
     */
    public function getModuleDisplayAttribute(): string
    {
        $modules = [
            'ANGGOTA' => 'Anggota',
            'ORGANIZATION' => 'Organisasi',
            'USER' => 'User',
            'ROLE' => 'Role',
            'KOTA' => 'Kota',
            'KECAMATAN' => 'Kecamatan',
            'KELURAHAN' => 'Kelurahan',
            'RW' => 'RW',
            'CERTIFICATE' => 'Sertifikat',
            'PROGRAM_THEME' => 'Tema Program',
            'WORK_PROGRAM' => 'Program Kerja',
            'ACTIVITY' => 'Kegiatan',
            'LOGIN' => 'Login',
            'LOGOUT' => 'Logout',
        ];
        return $modules[$this->module] ?? $this->module;
    }

    /**
     * Accessor untuk mendapatkan action display name
     */
    public function getActionDisplayAttribute(): string
    {
        $actions = [
            'CREATE' => 'Membuat',
            'UPDATE' => 'Mengubah',
            'DELETE' => 'Menghapus',
            'LOGIN' => 'Login',
            'LOGOUT' => 'Logout',
            'VIEW' => 'Melihat',
            'EXPORT' => 'Export',
            'IMPORT' => 'Import',
        ];
        return $actions[$this->action] ?? $this->action;
    }

    /**
     * Scope untuk filter by user
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope untuk filter by module
     */
    public function scopeByModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }

    /**
     * Scope untuk filter by action
     */
    public function scopeByAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }

    /**
     * Scope untuk filter date range
     */
    public function scopeDateRange(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope untuk search
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where(function ($q) use ($search) {
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

    /**
     * Boot method untuk auto-clear cache saat data berubah
     */
    protected static function booted(): void
    {
        static::created(function () {
            self::clearCache();
        });

        static::updated(function () {
            self::clearCache();
        });

        static::deleted(function () {
            self::clearCache();
        });
    }

    /**
     * Clear cache untuk activity logs
     */
    protected static function clearCache(): void
    {
        try {
            Cache::forget('activity_logs_list');
            Cache::forget('activity_logs_modules');
            Cache::forget('activity_logs_actions');
        } catch (\Exception $e) {
            // Ignore cache clear errors
        }
    }
}