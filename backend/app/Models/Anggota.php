<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Anggota extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [

        'organization_id',

        'jabatan_id',

        'nama',

        'no_anggota',

        'no_hp',

        'alamat',

        'is_active',
    ];

    protected function casts(): array
    {
        return [

            'is_active' => 'boolean',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(
            Organization::class
        );
    }

    public function jabatan()
    {
        return $this->belongsTo(
            Jabatan::class
        );
    }

    public function activities()
    {
        return $this->hasMany(
            Activity::class,
            'penanggung_jawab_id'
        );
    }

    public function attendances()
    {
        return $this->hasMany(
            ActivityAttendance::class
        );
    }

    public function attendedActivities()
    {
        return $this->belongsToMany(
            Activity::class,
            'activity_attendances',
            'anggota_id',
            'activity_id'
        )->withTimestamps();
    }
}
