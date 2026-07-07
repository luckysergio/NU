<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    public function workProgram(): BelongsTo
    {
        return $this->belongsTo(WorkProgram::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function penanggungJawab(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'penanggung_jawab_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ActivityPhoto::class);
    }

    public function expensePhotos(): HasMany
    {
        return $this->hasMany(ActivityExpensePhoto::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ActivityDocument::class);
    }

    public function getDocumentsCountAttribute(): int
    {
        return $this->documents()->count();
    }

    public function getDocumentsByCategory(string $category)
    {
        return $this->documents()->where('category', $category)->get();
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ActivityParticipant::class);
    }

    public function participantOrganizations(): BelongsToMany
    {
        return $this->belongsToMany(
            Organization::class,
            'activity_participants',
            'activity_id',
            'organization_id'
        )->withTimestamps();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(ActivityAttendance::class);
    }

    public function hadirAnggotas(): BelongsToMany
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