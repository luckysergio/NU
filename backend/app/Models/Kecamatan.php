<?php
// app/Models/Kecamatan.php

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

    /**
     * Relasi ke Kota
     */
    public function kota(): BelongsTo
    {
        return $this->belongsTo(Kota::class);
    }

    /**
     * Relasi ke Kelurahan
     */
    public function kelurahans(): HasMany
    {
        return $this->hasMany(Kelurahan::class);
    }

    /**
     * Relasi ke Organization
     */
    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }

    /**
     * Scope untuk data aktif
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk pencarian
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        if (empty($search)) return $query;
        
        return $query->where('nama', 'LIKE', "%{$search}%")
            ->orWhere('kode', 'LIKE', "%{$search}%");
    }

    /**
     * Scope untuk filter by kota
     */
    public function scopeByKota(Builder $query, int $kotaId): Builder
    {
        return $query->where('kota_id', $kotaId);
    }

    /**
     * Scope untuk filter by kode
     */
    public function scopeByKode(Builder $query, string $kode): Builder
    {
        return $query->where('kode', $kode);
    }

    /**
     * Accessor untuk nama lengkap dengan kota
     */
    public function getFullNameAttribute(): string
    {
        return $this->kota ? "{$this->nama}, {$this->kota->nama}" : $this->nama;
    }

    /**
     * Mendapatkan total kelurahan aktif
     */
    public function getActiveKelurahansCountAttribute(): int
    {
        return $this->kelurahans()->where('is_active', true)->count();
    }
}