<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class BlockedIp extends Model
{
    use HasFactory;

    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_until',
        'is_active',
    ];

    protected $casts = [
        'blocked_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isExpired(): bool
    {
        if (!$this->blocked_until) {
            return false;
        }

        return now()->greaterThan($this->blocked_until);
    }

    public function isStillBlocked(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        return true;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('ip_address', 'LIKE', "%{$search}%")
              ->orWhere('reason', 'LIKE', "%{$search}%");
        });
    }

    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('blocked_until')
              ->orWhere('blocked_until', '>', now());
        });
    }

    public function getStatusLabelAttribute(): string
    {
        if (!$this->is_active) return 'Tidak Aktif';
        if ($this->isExpired()) return 'Kadaluarsa';
        return 'Aktif';
    }

    public function getRemainingTimeAttribute(): ?string
    {
        if (!$this->blocked_until || $this->isExpired()) {
            return null;
        }

        $diff = now()->diff($this->blocked_until);
        return $diff->format('%d hari %h jam %i menit');
    }
}