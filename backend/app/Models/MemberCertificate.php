<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


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
        return $this->belongsTo(CertificateCategory::class,'certificate_category_id');
    }
}