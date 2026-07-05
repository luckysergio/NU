<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'device',
        'browser',
        'platform',
        'ip_address',
        'last_login_at',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByDevice(Builder $query, string $device): Builder
    {
        return $query->where('device', $device);
    }

    public function scopeByIp(Builder $query, string $ip): Builder
    {
        return $query->where('ip_address', $ip);
    }

    public function getDeviceInfoAttribute(): string
    {
        $parts = [];
        if ($this->device) $parts[] = $this->device;
        if ($this->browser) $parts[] = $this->browser;
        if ($this->platform) $parts[] = $this->platform;
        
        return implode(' • ', $parts) ?: 'Unknown Device';
    }

    public function getLastLoginFormattedAttribute(): string
    {
        return $this->last_login_at?->format('d/m/Y H:i:s') ?? '-';
    }
}