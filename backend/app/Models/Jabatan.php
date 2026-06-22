<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Jabatan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [

        'nama',

        'slug',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'is_active' => 'boolean',
        ];
    }

    public function anggotas()
    {
        return $this->hasMany(
            Anggota::class
        );
    }
}