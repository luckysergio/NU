<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Activity extends Model
{
    use HasFactory;

    protected $table = 'activities';

    protected $fillable = [
        'work_program_id',
        'organization_id',
        'penanggung_jawab_id',
        'nama_kegiatan',
        'tanggal_pelaksanaan',
        'status',
        'total_pengeluaran',
        'catatan',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pelaksanaan' => 'date',
            'total_pengeluaran'   => 'decimal:2',
        ];
    }

    protected $attributes = [
        'status' => 'draft',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function workProgram()
    {
        return $this->belongsTo(
            WorkProgram::class
        );
    }

    public function organization()
    {
        return $this->belongsTo(
            Organization::class
        );
    }

    public function penanggungJawab()
    {
        return $this->belongsTo(
            Anggota::class,
            'penanggung_jawab_id'
        );
    }

    public function creator()
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function photos()
    {
        return $this->hasMany(
            ActivityPhoto::class
        );
    }

    public function expensePhotos()
    {
        return $this->hasMany(
            ActivityExpensePhoto::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Participant Organizations
    |--------------------------------------------------------------------------
    */

    public function participants()
    {
        return $this->hasMany(
            ActivityParticipant::class
        );
    }

    public function participantOrganizations()
    {
        return $this->belongsToMany(
            Organization::class,
            'activity_participants',
            'activity_id',
            'organization_id'
        )->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    public function attendances()
    {
        return $this->hasMany(
            ActivityAttendance::class
        );
    }

    public function hadirAnggotas()
    {
        return $this->belongsToMany(
            Anggota::class,
            'activity_attendances',
            'activity_id',
            'anggota_id'
        )
        ->withPivot([
            'recorded_by',
            'catatan',
        ])
        ->withTimestamps();
    }
}