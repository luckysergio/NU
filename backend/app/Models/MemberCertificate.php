<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class MemberCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'anggota_id',
        'certificate_category_id',
        'nama',
        'nomor_sertifikat',
        'tanggal_terbit',
        'tanggal_expired',
        'file',
        'size'
    ];

    protected $casts = [
        'tanggal_terbit' => 'date',
        'tanggal_expired' => 'date'
    ];

    public function anggota()
    {
        return $this->belongsTo(Anggota::class);
    }

    public function category()
    {
        return $this->belongsTo(CertificateCategory::class, 'certificate_category_id');
    }

    // Scope untuk filtering yang sering digunakan dengan type hinting
    public function scopeByAnggota(Builder $query, int $anggotaId): Builder
    {
        return $query->where('anggota_id', $anggotaId);
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('certificate_category_id', $categoryId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereHas('category', function ($q) {
            $q->where('is_active', true);
        });
    }

    public function scopeTanggalTerbitBetween(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('tanggal_terbit', [$startDate, $endDate]);
    }

    public function scopeBelumExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('tanggal_expired')
              ->orWhere('tanggal_expired', '>=', now());
        });
    }

    public static function getWithRelations(?int $id = null)
    {
        $query = self::with([
            'anggota:id,nama,nomor_anggota',
            'category:id,nama,slug,is_active'
        ]);

        if ($id) {
            return $query->findOrFail($id);
        }

        return $query;
    }
}