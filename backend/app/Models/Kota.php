<?php
// app/Models/Kota.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Kota extends Model
{
    use HasFactory;

    protected $table = 'kotas';

    protected $fillable = [
        'nama',
        'kode',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relasi ke Kecamatan
     */
    public function kecamatans(): HasMany
    {
        return $this->hasMany(Kecamatan::class);
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
     * Scope untuk filter by kode
     */
    public function scopeByKode(Builder $query, string $kode): Builder
    {
        return $query->where('kode', $kode);
    }

    /**
     * Accessor untuk nama lengkap dengan kode
     */
    public function getFullNameAttribute(): string
    {
        return $this->kode ? "{$this->nama} ({$this->kode})" : $this->nama;
    }

    /**
     * Mendapatkan total kecamatan aktif
     */
    public function getActiveKecamatansCountAttribute(): int
    {
        return $this->kecamatans()->where('is_active', true)->count();
    }
}