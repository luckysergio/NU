<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrganizationType extends Model
{
    use HasFactory;

    protected $fillable = [

        'organization_level_id',

        'nama',

        'slug',

        'deskripsi',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'is_active' => 'boolean',
        ];
    }

    public function level()
    {
        return $this->belongsTo(
            OrganizationLevel::class,
            'organization_level_id'
        );
    }

    public function organizations()
    {
        return $this->hasMany(
            Organization::class,
            'organization_type_id'
        );
    }
}
