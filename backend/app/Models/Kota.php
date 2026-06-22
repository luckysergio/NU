<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kota extends Model
{
    use HasFactory;

    protected $fillable = [
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

    public function kecamatans()
    {
        return $this->hasMany(Kecamatan::class);
    }

    public function organizations()
    {
        return $this->hasMany(Organization::class);
    }
}