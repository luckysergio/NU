<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DocumentSpecification extends Model
{
    use HasFactory;

    protected $fillable = [

        'nama',

        'slug',

        'deskripsi',

        'urutan',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'is_active' => 'boolean',
        ];
    }
}