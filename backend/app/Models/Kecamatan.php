<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Kecamatan extends Model
{
    use HasFactory;

    protected $table = 'kecamatans';

    protected $fillable = [
        'kota_id',
        'nama',
        'kode',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function kota(): BelongsTo
    {
        return $this->belongsTo(Kota::class);
    }

    public function kelurahans(): HasMany
    {
        return $this->hasMany(Kelurahan::class);
    }

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where('nama', 'LIKE', "%{$search}%")
            ->orWhere('kode', 'LIKE', "%{$search}%");
    }

    public function scopeByKota(Builder $query, int $kotaId): Builder
    {
        return $query->where('kota_id', $kotaId);
    }

    public function scopeByKode(Builder $query, string $kode): Builder
    {
        return $query->where('kode', $kode);
    }

    public function getFullNameAttribute(): string
    {
        return $this->kota ? "{$this->nama}, {$this->kota->nama}" : $this->nama;
    }

    public function getActiveKelurahansCountAttribute(): int
    {
        return $this->kelurahans()->where('is_active', true)->count();
    }
}