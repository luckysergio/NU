<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Biodata extends Model
{
    use HasFactory;

    protected $fillable = [
        'no_anggota',
        'nama',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'status_perkawinan',
        'pendidikan',
        'no_hp',
        'alamat',
        'deskripsi',
        'foto',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tanggal_lahir' => 'date',
    ];

    public const JENIS_KELAMIN = ['laki-laki', 'perempuan'];
    public const STATUS_PERKAWINAN = ['menikah', 'belum menikah', 'cerai'];
    public const PENDIDIKAN = ['sd', 'smp', 'sma/smk', 'd1', 'd2', 'd3', 's1', 's2', 's3'];

    public function keanggotaan(): HasMany
    {
        return $this->hasMany(Anggota::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(MemberCertificate::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }
        
        return $query->where(function ($q) use ($search) {
            $q->where('nama', 'LIKE', "%{$search}%")
              ->orWhere('no_anggota', 'LIKE', "%{$search}%")
              ->orWhere('no_hp', 'LIKE', "%{$search}%");
        });
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->nama} ({$this->no_anggota})";
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getStatusBadgeAttribute(): string
    {
        return $this->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
    }

    public function getJenisKelaminLabelAttribute(): string
    {
        return ucfirst($this->jenis_kelamin ?? '-');
    }

    public function getStatusPerkawinanLabelAttribute(): string
    {
        return ucfirst($this->status_perkawinan ?? '-');
    }

    public function getPendidikanLabelAttribute(): string
    {
        return strtoupper($this->pendidikan ?? '-');
    }

    public static function getJenisKelaminOptions(): array
    {
        return array_combine(self::JENIS_KELAMIN, array_map('ucfirst', self::JENIS_KELAMIN));
    }

    public static function getStatusPerkawinanOptions(): array
    {
        return array_combine(self::STATUS_PERKAWINAN, array_map('ucfirst', self::STATUS_PERKAWINAN));
    }

    public static function getPendidikanOptions(): array
    {
        return array_combine(self::PENDIDIKAN, array_map('strtoupper', self::PENDIDIKAN));
    }
}