<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WorkProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'theme_id',
        'field_id',
        'target_id',
        'goal_id',
        'nama_program',
        'deskripsi',
        'tahun',
        'status',
        'created_by',
    ];

    public function organization()
    {
        return $this->belongsTo(
            Organization::class
        );
    }

    public function theme()
    {
        return $this->belongsTo(
            ProgramTheme::class,
            'theme_id'
        );
    }

    public function field()
    {
        return $this->belongsTo(
            ProgramField::class,
            'field_id'
        );
    }

    public function target()
    {
        return $this->belongsTo(
            ProgramTarget::class,
            'target_id'
        );
    }

    public function goal()
    {
        return $this->belongsTo(
            ProgramGoal::class,
            'goal_id'
        );
    }

    public function creator()
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function activities()
    {
        return $this->hasMany(
            Activity::class
        );
    }
}