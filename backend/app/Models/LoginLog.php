<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class LoginLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'is_success',
    ];

    protected $casts = [
        'is_success' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeSuccess(Builder $query): Builder
    {
        return $query->where('is_success', true);
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('is_success', false);
    }

    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByIp(Builder $query, string $ip): Builder
    {
        return $query->where('ip_address', $ip);
    }

    public function scopeDateRange(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_success ? 'Berhasil' : 'Gagal';
    }

    public function getUserNameAttribute(): string
    {
        return $this->user?->name ?? $this->email ?? 'Unknown';
    }
}