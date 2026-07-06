<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(OrganizationLevel::class, 'organization_level_id');
    }

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'organization_type_id');
    }

    // SCOPES
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where(function ($q) use ($search) {
            $q->where('nama', 'LIKE', "%{$search}%")
              ->orWhere('slug', 'LIKE', "%{$search}%");
        });
    }

    public function scopeByLevel(Builder $query, int $levelId): Builder
    {
        return $query->where('organization_level_id', $levelId);
    }

    public function scopeBySlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    // ACCESSORS (Format Baru Laravel 12)
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                // Memanfaatkan eager loading jika ada, mencegah N+1 Query
                $level = $this->relationLoaded('level') ? $this->level : $this->level()->first();
                return $level ? "{$attributes['nama']} ({$level->nama})" : $attributes['nama'];
            }
        );
    }
}