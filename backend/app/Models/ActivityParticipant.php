<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityParticipant extends Model
{
    use HasFactory;

    protected $fillable = [

        'activity_id',

        'organization_id',
    ];

    public function activity()
    {
        return $this->belongsTo(
            Activity::class
        );
    }

    public function organization()
    {
        return $this->belongsTo(
            Organization::class
        );
    }
}