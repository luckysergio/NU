<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'anggota_id',
        'is_present',
        'checked_in_at',
        'kritik',
        'saran',
    ];

    protected $casts = [
        'is_present' => 'boolean',
        'checked_in_at' => 'datetime',
    ];

    public function activity()
    {
        return $this->belongsTo(
            Activity::class
        );
    }

    public function anggota()
    {
        return $this->belongsTo(
            Anggota::class
        );
    }
}