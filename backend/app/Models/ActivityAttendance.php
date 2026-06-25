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

        'recorded_by',

        'catatan',
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

    public function recorder()
    {
        return $this->belongsTo(
            User::class,
            'recorded_by'
        );
    }
}