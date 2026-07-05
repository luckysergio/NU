<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class OrganizationLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'display_name',
        'deskripsi',
        'urutan',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'urutan' => 'integer',
    ];

    public function organizations()
    {
        return $this->hasMany(Organization::class, 'organization_level_id');
    }

    public function organizationTypes()
    {
        return $this->hasMany(OrganizationType::class);
    }

    public function jabatans()
    {
        return $this->hasMany(Jabatan::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('nama', 'LIKE', "%{$search}%")
              ->orWhere('slug', 'LIKE', "%{$search}%")
              ->orWhere('display_name', 'LIKE', "%{$search}%");
        });
    }

    public function scopeBySlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('urutan', 'asc')->orderBy('nama', 'asc');
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->attributes['display_name'] ?? $this->nama;
    }
}