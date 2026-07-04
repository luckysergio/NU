<?php
// app/Models/Kelurahan.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Kelurahan extends Model
{
    use HasFactory;

    protected $table = 'kelurahans';

    protected $fillable = [
        'kecamatan_id',
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
    public function kecamatan(): BelongsTo
    {
        return $this->belongsTo(Kecamatan::class);
    }

    /**
     * Relasi ke RW
     */
    public function rws(): HasMany
    {
        return $this->hasMany(RW::class);
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
     * Scope untuk filter by kecamatan
     */
    public function scopeByKecamatan(Builder $query, int $kecamatanId): Builder
    {
        return $query->where('kecamatan_id', $kecamatanId);
    }

    /**
     * Scope untuk filter by kode
     */
    public function scopeByKode(Builder $query, string $kode): Builder
    {
        return $query->where('kode', $kode);
    }

    /**
     * Accessor untuk nama lengkap dengan kecamatan
     */
    public function getFullNameAttribute(): string
    {
        $kecamatan = $this->kecamatan;
        if ($kecamatan) {
            return "{$this->nama}, {$kecamatan->nama}";
        }
        return $this->nama;
    }

    /**
     * Accessor untuk alamat lengkap (Kota > Kecamatan > Kelurahan)
     */
    public function getAddressAttribute(): string
    {
        $kecamatan = $this->kecamatan;
        if (!$kecamatan) return $this->nama;
        
        $kota = $kecamatan->kota;
        if ($kota) {
            return "{$this->nama}, {$kecamatan->nama}, {$kota->nama}";
        }
        return "{$this->nama}, {$kecamatan->nama}";
    }

    /**
     * Mendapatkan total RW aktif
     */
    public function getActiveRwsCountAttribute(): int
    {
        return $this->rws()->where('is_active', true)->count();
    }
}