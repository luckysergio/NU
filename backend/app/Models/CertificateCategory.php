<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class CertificateCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'is_active'
    ];

    public function certificates()
    {
        return $this->hasMany(MemberCertificate::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, string $keyword): Builder
    {
        return $query->where('nama', 'LIKE', "%{$keyword}%")
                     ->orWhere('slug', 'LIKE', "%{$keyword}%");
    }

    public static function getWithCertificateCount()
    {
        return self::withCount('certificates')
                   ->active()
                   ->get();
    }
}