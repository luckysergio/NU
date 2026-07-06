<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'organization_level_id');
    }

    public function organizationTypes(): HasMany
    {
        return $this->hasMany(OrganizationType::class, 'organization_level_id');
    }

    public function jabatans(): HasMany
    {
        return $this->hasMany(Jabatan::class, 'organization_level_id');
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

    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: fn ($value, $attributes) => $attributes['display_name'] ?? $attributes['nama'],
        );
    }
}