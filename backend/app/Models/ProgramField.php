<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProgramField extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function workPrograms()
    {
        return $this->hasMany(
            WorkProgram::class,
            'field_id'
        );
    }
}