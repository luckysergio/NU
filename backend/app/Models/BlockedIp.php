<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BlockedIp extends Model
{
    use HasFactory;

    protected $fillable = [

        'ip_address',

        'reason',

        'blocked_until',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'blocked_until' => 'datetime',

            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXPIRED
    |--------------------------------------------------------------------------
    */

    public function isExpired(): bool
    {
        if (!$this->blocked_until) {
            return false;
        }

        return now()->greaterThan(
            $this->blocked_until
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK ACTIVE
    |--------------------------------------------------------------------------
    */

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
}