<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class Anggota extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'jabatan_id',
        'no_anggota',
        'nama',
        'no_hp',
        'alamat',
        'foto',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'penanggung_jawab_id');
    }

    public function attendances()
    {
        return $this->hasMany(ActivityAttendance::class);
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

    public function certificates()
    {
        return $this->hasMany(MemberCertificate::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeByJabatan(Builder $query, int $jabatanId): Builder
    {
        return $query->where('jabatan_id', $jabatanId);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        $search = strtolower($search);
        
        return $query->where(function ($q) use ($search) {
            $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(no_anggota) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(no_hp) LIKE ?', ["%{$search}%"]);
        });
    }

    public function scopeWithRelations(Builder $query): Builder
    {
        return $query->with([
            'organization' => function ($q) {
                $q->select(['id', 'nama', 'slug', 'organization_level_id'])
                    ->with(['level' => function ($q2) {
                        $q2->select(['id', 'nama', 'slug', 'display_name']);
                    }]);
            },
            'jabatan' => function ($q) {
                $q->select(['id', 'nama', 'slug']);
            },
        ]);
    }

    public function scopeWithCounts(Builder $query): Builder
    {
        return $query->withCount([
            'attendances as total_kehadiran',
            'certificates as total_sertifikat',
        ]);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getStatusBadgeAttribute(): string
    {
        return $this->is_active 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-gray-100 text-gray-600';
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->nama} ({$this->no_anggota})";
    }

    public function getOrganizationNameAttribute(): string
    {
        return $this->organization?->nama ?? '-';
    }

    public function getJabatanNameAttribute(): string
    {
        return $this->jabatan?->nama ?? '-';
    }
}