<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kelurahan extends Model
{
    use HasFactory;

    protected $fillable = [
        'kecamatan_id',
        'nama',
        'kode',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class);
    }

    public function rws()
    {
        return $this->hasMany(RW::class);
    }

    public function organizations()
    {
        return $this->hasMany(Organization::class);
    }
}
