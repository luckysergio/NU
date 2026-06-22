<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActivityExpensePhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'file_path',
    ];

    public function activity()
    {
        return $this->belongsTo(
            Activity::class
        );
    }
}