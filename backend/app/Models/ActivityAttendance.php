<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'anggota_id',
        'recorded_by',
        'catatan',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}