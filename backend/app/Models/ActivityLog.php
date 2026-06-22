<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityLog extends Model
{
    use HasFactory;

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

    protected function casts(): array
    {
        return [

            'old_values' => 'array',

            'new_values' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}