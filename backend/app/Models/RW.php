<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class RW extends Model
{
    use HasFactory;

    protected $table = 'rws';

    protected $fillable = [
        'kelurahan_id',
        'nomor',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relasi ke Kelurahan
     */
    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Kelurahan::class);
    }

    /**
     * Relasi ke Organization
     */
    public function organizations(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope untuk data aktif
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk filter by kelurahan
     */
    public function scopeByKelurahan(Builder $query, int $kelurahanId): Builder
    {
        return $query->where('kelurahan_id', $kelurahanId);
    }

    /**
     * Scope untuk filter by nomor
     */
    public function scopeByNomor(Builder $query, string $nomor): Builder
    {
        return $query->where('nomor', $nomor);
    }

    /**
     * Accessor untuk nomor yang diformat
     */
    public function getFormattedNomorAttribute(): string
    {
        return 'RW ' . $this->nomor;
    }

    /**
     * Accessor untuk nama lengkap dengan kelurahan
     */
    public function getFullNameAttribute(): string
    {
        $kelurahan = $this->kelurahan;
        if ($kelurahan) {
            return "RW {$this->nomor}, {$kelurahan->nama}";
        }
        return "RW {$this->nomor}";
    }

    /**
     * Accessor untuk alamat lengkap
     */
    public function getAddressAttribute(): string
    {
        $kelurahan = $this->kelurahan;
        if (!$kelurahan) return "RW {$this->nomor}";
        
        $kecamatan = $kelurahan->kecamatan;
        if ($kecamatan) {
            $kota = $kecamatan->kota;
            if ($kota) {
                return "RW {$this->nomor}, {$kelurahan->nama}, {$kecamatan->nama}, {$kota->nama}";
            }
            return "RW {$this->nomor}, {$kelurahan->nama}, {$kecamatan->nama}";
        }
        return "RW {$this->nomor}, {$kelurahan->nama}";
    }
}