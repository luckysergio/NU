<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RW extends Model
{
    use HasFactory;

    protected $table = 'rws';

    protected $fillable = [
        'kelurahan_id',
        'nomor',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function kelurahan()
    {
        return $this->belongsTo(Kelurahan::class);
    }

    public function organizations()
    {
        return $this->hasMany(
            Organization::class
        );
    }
}
