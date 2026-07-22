<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'biodata_id',
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

    public function biodata(): BelongsTo
    {
        return $this->belongsTo(Biodata::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CertificateCategory::class, 'certificate_category_id');
    }

    public function scopeByBiodata(Builder $query, int $biodataId): Builder
    {
        return $query->where('biodata_id', $biodataId);
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
            'biodata:id,nama,no_anggota',
            'category:id,nama,slug,is_active'
        ]);

        if ($id) {
            return $query->findOrFail($id);
        }

        return $query;
    }
}