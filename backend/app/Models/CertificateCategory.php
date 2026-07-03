<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
}