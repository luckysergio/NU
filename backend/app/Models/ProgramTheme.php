<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class ProgramTheme extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'nama',
        'deskripsi',
        'periode',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(
            Organization::class
        );
    }

    public function creator()
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function workPrograms()
    {
        return $this->hasMany(
            WorkProgram::class,
            'theme_id'
        );
    }

    public function getStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'nonaktif';
        }

        if (!$this->tanggal_selesai) {
            return 'aktif';
        }

        return Carbon::parse($this->tanggal_selesai)
            ->isFuture()
            || Carbon::parse($this->tanggal_selesai)->isToday()
            ? 'aktif'
            : 'expired';
    }
}
